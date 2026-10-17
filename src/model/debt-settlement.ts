import { Member } from './member';

export interface DebtSettlementTransaction {
  senderId: number;
  recipientId: number;
  amountInCents: number;
}

export interface DebtSettlementTransactionViewModel {
  sender: Member;
  recipient: Member;
  amountInCents: number;
}

export function createSettlementViewModel(
  settlement: DebtSettlementTransaction,
  membersById: Map<number, Member>,
): DebtSettlementTransactionViewModel {
  const sender = membersById.get(settlement.senderId);
  const recipient = membersById.get(settlement.recipientId);
  if (!sender) {
    throw new Error(`Settlement sender with ID: ${settlement.senderId} not found.`);
  }
  if (!recipient) {
    throw new Error(`Settlement recipient with ID: ${settlement.recipientId} not found.`);
  }

  return { sender, recipient, amountInCents: settlement.amountInCents };
}
