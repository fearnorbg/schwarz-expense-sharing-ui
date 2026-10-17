import { Component, inject, OnInit, signal, OnDestroy, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { ExpenseListItem } from '../../component/expense-list-item/expense-list-item';
import { createViewModel, Expense, ExpenseViewModel } from '../../model/expense';
import { MemberService } from '../../service/member.service';
import { MatDialog } from '@angular/material/dialog';
import { forkJoin, Subscription } from 'rxjs';
import { ExpenseService } from '../../service/expense.service';
import { getMembersById, Member } from '../../model/member';
import { MatButton } from '@angular/material/button';
import { AddExpenseDialog } from '../../component/add-expense-dialog/add-expense-dialog';

@Component({
  imports: [MatListModule, ExpenseListItem, MatButton, DecimalPipe],
  selector: 'app-expense-management',
  styleUrl: './expense-management.scss',
  templateUrl: './expense-management.html',
})
export class ExpenseManagement implements OnInit, OnDestroy {
  protected readonly totalExpensesInCents = computed<number | undefined>(() => {
    const expenses = this.expensesViewData();
    if (!expenses) {
      return undefined;
    }

    return expenses
      .map((expense) => expense.amountInCents)
      .reduce((accumulator, currentValue) => accumulator + currentValue, 0);
  });
  protected readonly expensesViewData = computed<ExpenseViewModel[] | undefined>(() => {
    const expenses = this.expenses();
    const members = this.members();
    if (!expenses || !members) {
      return undefined;
    }

    const membersById = getMembersById(members);
    return expenses.map((expense) => createViewModel(expense, membersById));
  });
  private readonly expenses = signal<Expense[] | undefined>(undefined);
  private readonly members = signal<Member[] | undefined>(undefined);
  private readonly memberService = inject(MemberService);
  private readonly expenseService = inject(ExpenseService);
  private readonly dialog = inject(MatDialog);
  private loadExpensesDataSubscription: Subscription | null = null;

  ngOnInit() {
    this.loadData();
  }

  ngOnDestroy() {
    if (this.loadExpensesDataSubscription) {
      this.loadExpensesDataSubscription.unsubscribe();
    }
  }

  protected addExpense() {
    const members = this.members();
    if (!members) {
      return;
    }
    this.dialog
      .open<AddExpenseDialog, Member[], Expense>(AddExpenseDialog, {
        data: members,
        width: '480px',
        maxWidth: 'calc(100vw - 32px)',
      })
      .afterClosed()
      .subscribe((expense) => {
        if (expense) {
          this.loadData();
        }
      });
  }

  private loadData() {
    this.members.set(undefined);
    this.expenses.set(undefined);

    if (this.loadExpensesDataSubscription) {
      this.loadExpensesDataSubscription.unsubscribe();
    }

    this.loadExpensesDataSubscription = forkJoin([
      this.expenseService.getExpenses(),
      this.memberService.getMembers(),
    ]).subscribe(([expenses, members]) => {
      this.expenses.set(expenses);
      this.members.set(members);
    });
  }
}
