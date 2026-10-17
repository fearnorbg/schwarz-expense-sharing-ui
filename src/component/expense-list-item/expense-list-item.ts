import { DecimalPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { ExpenseViewModel } from '../../model/expense';

@Component({
  imports: [DecimalPipe, MatListModule],
  selector: 'app-expense-list-item',
  styleUrl: './expense-list-item.scss',
  templateUrl: './expense-list-item.html',
})
export class ExpenseListItem {
  readonly expense = input.required<ExpenseViewModel>();
  protected readonly participantNames = computed(() =>
    this.expense()
      .participants.map((participant) => participant.name)
      .join(', '),
  );
}
