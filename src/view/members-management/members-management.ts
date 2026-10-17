import { Component, inject, OnInit, signal, OnDestroy, DestroyRef } from '@angular/core';
import { Member } from '../../model/member';
import { MemberService } from '../../service/member.service';
import { MemberList } from '../../component/member-list/member-list';
import { MatDialog } from '@angular/material/dialog';
import { AddMemberDialog } from '../../component/add-member-dialog/add-member-dialog';
import { Subscription } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  imports: [MemberList],
  selector: 'app-members-management',
  styleUrl: './members-management.scss',
  templateUrl: './members-management.html',
})
export class MembersManagement implements OnInit, OnDestroy {
  protected readonly members = signal<Member[] | undefined>(undefined);
  private readonly memberService = inject(MemberService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private loadMembersSubscription: Subscription | null = null;

  ngOnInit() {
    this.loadMembers();
  }

  ngOnDestroy() {
    if (this.loadMembersSubscription) {
      this.loadMembersSubscription.unsubscribe();
    }
  }

  protected addMember(): void {
    const dialogRef = this.dialog.open<AddMemberDialog, void, Member>(AddMemberDialog, {
      width: '400px',
      maxWidth: 'calc(100vw - 32px)',
    });
    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          this.loadMembers();
        }
      });
  }

  private loadMembers(): void {
    this.members.set(undefined);
    if (this.loadMembersSubscription) {
      this.loadMembersSubscription.unsubscribe();
    }

    this.loadMembersSubscription = this.memberService.getMembers().subscribe((members) => {
      this.members.set(members);
    });
  }
}
