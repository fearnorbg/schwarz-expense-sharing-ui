import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Member } from '../../model/member';
import { ExpenseService } from '../../service/expense.service';
import { maxExpenseAmount } from '../../model/expense';

@Component({
  selector: 'app-add-expense-dialog',
  imports: [ReactiveFormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './add-expense-dialog.html',
  styleUrl: './add-expense-dialog.scss',
})
export class AddExpenseDialog {
  protected readonly maxExpenseAmount = maxExpenseAmount;
  protected readonly members = [...inject<Member[]>(MAT_DIALOG_DATA)].sort((a, b) => a.name.localeCompare(b.name));
  protected readonly form = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/\S/)] }),
    amount: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/), Validators.max(maxExpenseAmount)],
    }),
    payerId: new FormControl<number | null>(null, Validators.required),
    participantIds: new FormControl<number[]>([], { nonNullable: true, validators: [Validators.required] }),
  });
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  private readonly expenseService = inject(ExpenseService);
  private readonly dialogRef = inject(MatDialogRef<AddExpenseDialog>);

  protected save(): void {
    if (this.saving()) {
      return;
    }

    if (this.form.invalid || this.members.length === 0) {
      this.form.markAllAsTouched();
      return;
    }

    const { title, amount, payerId, participantIds } = this.form.getRawValue();
    const amountInCents = Math.round(Number(amount) * 100);
    if (!Number.isSafeInteger(amountInCents)) {
      this.error.set('Expense amount is too large.');
      return;
    }

    if (payerId === null) {
      return;
    }

    this.saving.set(true);
    this.error.set('');
    this.form.disable();
    this.dialogRef.disableClose = true;
    this.expenseService.addExpense({ id: 0, title, amountInCents, payerId, participantIds }).subscribe({
      next: (expense) => this.dialogRef.close(expense),
      error: (error: unknown) => {
        this.saving.set(false);
        this.form.enable();
        this.dialogRef.disableClose = false;
        this.error.set(error instanceof Error ? error.message : String(error));
      },
    });
  }
}
