import { Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import {
  createSettlementViewModel,
  DebtSettlementTransaction,
  DebtSettlementTransactionViewModel,
} from '../../model/debt-settlement';
import { getMembersById, Member } from '../../model/member';

@Component({
  selector: 'app-debt-settlement-list',
  imports: [MatTableModule, DecimalPipe],
  templateUrl: './debt-settlement-list.html',
  styleUrl: './debt-settlement-list.scss',
})
export class DebtSettlementList {
  readonly settlements = input<DebtSettlementTransaction[]>();
  readonly members = input<Member[]>();
  protected readonly settlementColumns = ['sender', 'recipient', 'amount'];
  protected readonly settlementsViewData = computed<DebtSettlementTransactionViewModel[] | undefined>(() => {
    const settlements = this.settlements();
    const members = this.members();
    if (!settlements || !members) {
      return undefined;
    }

    const membersById = getMembersById(members);
    return settlements.map((settlement) => createSettlementViewModel(settlement, membersById));
  });
}
