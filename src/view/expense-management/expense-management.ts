import { Component, inject, OnInit, signal, OnDestroy, DestroyRef } from '@angular/core';
import { Expense } from '../../model/expense';
import { DebtSettlementTransaction } from '../../model/debt-settlement';
import { MemberService } from '../../service/member.service';
import { MatDialog } from '@angular/material/dialog';
import { forkJoin, Subscription } from 'rxjs';
import { ExpenseService } from '../../service/expense.service';
import { Member } from '../../model/member';
import { AddExpenseDialog } from '../../component/add-expense-dialog/add-expense-dialog';
import { DebtSettlementService } from '../../service/debt-settlement.service';

import { ExpenseList } from '../../component/expense-list/expense-list';
import { DebtSettlementList } from '../../component/debt-settlement-list/debt-settlement-list';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  imports: [ExpenseList, DebtSettlementList],
  selector: 'app-expense-management',
  styleUrl: './expense-management.scss',
  templateUrl: './expense-management.html',
})
export class ExpenseManagement implements OnInit, OnDestroy {
  protected readonly expenses = signal<Expense[] | undefined>(undefined);
  protected readonly settlements = signal<DebtSettlementTransaction[] | undefined>(undefined);
  protected readonly members = signal<Member[] | undefined>(undefined);
  private readonly memberService = inject(MemberService);
  private readonly expenseService = inject(ExpenseService);
  private readonly debtSettlementService = inject(DebtSettlementService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
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
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((expense) => {
        if (expense) {
          this.loadData();
        }
      });
  }

  private loadData() {
    this.members.set(undefined);
    this.expenses.set(undefined);
    this.settlements.set(undefined);

    if (this.loadExpensesDataSubscription) {
      this.loadExpensesDataSubscription.unsubscribe();
    }

    this.loadExpensesDataSubscription = forkJoin([
      this.expenseService.getExpenses(),
      this.memberService.getMembers(),
      this.debtSettlementService.calculateDebtSettlementTransactions(),
    ]).subscribe(([expenses, members, settlements]) => {
      this.expenses.set(expenses);
      this.members.set(members);
      this.settlements.set(settlements);
    });
  }
}
