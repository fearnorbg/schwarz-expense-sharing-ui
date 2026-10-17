import { Component, computed, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButton } from '@angular/material/button';
import { createViewModel, Expense, ExpenseViewModel } from '../../model/expense';
import { getMembersById, Member } from '../../model/member';

@Component({
  selector: 'app-expense-list',
  imports: [MatTableModule, MatButton, DecimalPipe],
  templateUrl: './expense-list.html',
  styleUrl: './expense-list.scss',
})
export class ExpenseList {
  readonly expenses = input<Expense[]>();
  readonly members = input<Member[]>();
  readonly addExpense = output<void>();
  protected readonly displayedColumns = ['title', 'amount', 'payer', 'participants'];
  protected readonly expensesViewData = computed<ExpenseViewModel[] | undefined>(() => {
    const expenses = this.expenses();
    const members = this.members();
    if (!expenses || !members) {
      return undefined;
    }

    const membersById = getMembersById(members);
    return expenses.map((expense) => createViewModel(expense, membersById));
  });
  protected readonly totalExpensesInCents = computed<number | undefined>(() => {
    const expenses = this.expensesViewData();
    if (!expenses) {
      return undefined;
    }

    return expenses
      .map((expense) => expense.amountInCents)
      .reduce((accumulator, currentValue) => accumulator + currentValue, 0);
  });
}
