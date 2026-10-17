import { Component, input } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { Member } from '../../model/member';

@Component({
  imports: [MatListModule],
  selector: 'app-member-list-item',
  styleUrl: './member-list-item.scss',
  templateUrl: './member-list-item.html',
})
export class MemberListItem {
  readonly member = input.required<Member>();
}
