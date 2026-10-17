import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MemberService } from '../../service/member.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-add-member-dialog',
  imports: [ReactiveFormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, FormsModule],
  templateUrl: './add-member-dialog.html',
  styleUrl: './add-member-dialog.scss',
})
export class AddMemberDialog {
  protected readonly name = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  private readonly memberService = inject(MemberService);
  private readonly dialogRef = inject(MatDialogRef<AddMemberDialog>);
  private readonly destroyRef = inject(DestroyRef);

  protected save(): void {
    if (this.name.invalid || this.saving()) {
      this.name.markAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set('');
    this.dialogRef.disableClose = true;
    this.memberService
      .addMember({ id: 0, name: this.name.value })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (member) => this.dialogRef.close(member),
        error: (error: unknown) => {
          this.saving.set(false);
          this.dialogRef.disableClose = false;
          this.error.set(error instanceof Error ? error.message : String(error));
        },
      });
  }
}
