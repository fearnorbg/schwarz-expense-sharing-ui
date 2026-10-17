import { inject, Injectable, Injector, runInInjectionContext, signal } from '@angular/core';
import { delay, map, Observable, ReplaySubject, switchMap, take, throwError, timer } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { Expense, maxExpenseAmount } from '../model/expense';
import { MemberService } from './member.service';

const getExpensesDelay = 1000;
const addExpenseDelay = 1500;
const defaultExpenses: Expense[] = [];
const defaultLastExpenseId = Math.max(0, ...defaultExpenses.map((expense) => expense.id));

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private expenses = signal<Expense[]>(defaultExpenses);
  private lastExpenseId = defaultLastExpenseId;
  private memberService = inject(MemberService);
  private injector = inject(Injector);

  getExpenses(): Observable<Expense[]> {
    return runInInjectionContext(this.injector, () =>
      toObservable(this.expenses).pipe(take(1), delay(getExpensesDelay)),
    );
  }

  addExpense(expense: Expense): Observable<Expense> {
    const resultSubject = new ReplaySubject<Expense>(1);
    this.validateExpense(expense).subscribe({
      next: () => {
        const newExpense = {
          ...expense,
          title: expense.title.trim(),
          id: ++this.lastExpenseId,
        };
        this.expenses.update((expenses) => [...expenses, newExpense]);
        resultSubject.next(newExpense);
        resultSubject.complete();
      },
      error: (error) => {
        resultSubject.error(error);
      },
    });

    return timer(addExpenseDelay).pipe(switchMap(() => resultSubject.asObservable()));
  }

  private validateExpense(expense: Expense): Observable<void> {
    if (expense.title.trim() === '') {
      return throwError(() => new Error('Expense title cannot be empty.'));
    }

    if (Number.isNaN(expense.amountInCents) || !Number.isSafeInteger(expense.amountInCents)) {
      return throwError(() => new Error('Expense amount in cents must be an integer.'));
    }

    if (expense.amountInCents <= 0) {
      return throwError(() => new Error('Expense amount must be greater than zero.'));
    }

    if (expense.amountInCents > maxExpenseAmount * 100) {
      return throwError(() => new Error(`Expense amount cannot exceed ${maxExpenseAmount}.`));
    }

    if (expense.participantIds.length === 0) {
      return throwError(() => new Error('Expense must have at least one participant.'));
    }

    return this.memberService.getMembers().pipe(
      take(1),
      map((members) => {
        const validMemberIds = new Set(members.map((member) => member.id));
        if (!validMemberIds.has(expense.payerId)) {
          throw new Error(`Unknown payer ID: ${expense.payerId}`);
        }
        const invalidParticipantIds = expense.participantIds.filter(
          (participantId) => !validMemberIds.has(participantId),
        );
        if (invalidParticipantIds.length > 0) {
          throw new Error(`Unknown participant IDs: ${invalidParticipantIds.join(', ')}.`);
        }
      }),
    );
  }
}
