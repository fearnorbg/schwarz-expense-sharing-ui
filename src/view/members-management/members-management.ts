import { Component, inject, OnInit, signal, OnDestroy, computed } from '@angular/core';
import { Member } from '../../model/member';
import { MemberService } from '../../service/member.service';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MemberListItem } from '../../component/member-list-item/member-list-item';
import { MatDialog } from '@angular/material/dialog';
import { AddMemberDialog } from '../../component/add-member-dialog/add-member-dialog';
import { Subscription } from 'rxjs';

@Component({
  imports: [MatListModule, MatButtonModule, MemberListItem],
  selector: 'app-members-management',
  styleUrl: './members-management.scss',
  templateUrl: './members-management.html',
})
export class MembersManagement implements OnInit, OnDestroy {
  protected readonly sortedMembers = computed(() => {
    const members = this.members();
    if (!members) {
      return undefined;
    }

    return [...members].sort((a, b) => a.name.localeCompare(b.name));
  });

  private readonly members = signal<Member[] | undefined>(undefined);
  private readonly memberService = inject(MemberService);
  private readonly dialog = inject(MatDialog);
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
    dialogRef.afterClosed().subscribe((result) => {
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
