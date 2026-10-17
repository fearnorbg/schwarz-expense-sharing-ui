import { Component, computed, input, output } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { Member } from '../../model/member';

@Component({
  selector: 'app-member-list',
  imports: [MatTableModule, MatButtonModule],
  templateUrl: './member-list.html',
  styleUrl: './member-list.scss',
})
export class MemberList {
  readonly members = input<Member[]>();
  readonly addMember = output<void>();
  protected readonly displayedColumns = ['name'];
  protected readonly sortedMembers = computed(() => {
    const members = this.members();
    if (!members) {
      return undefined;
    }

    return [...members].sort((a, b) => a.name.localeCompare(b.name));
  });
}
