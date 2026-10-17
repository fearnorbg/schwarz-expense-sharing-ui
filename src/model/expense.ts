import { Member } from './member';

export const maxExpenseAmount = 1000;

export interface Expense {
  id: number;
  title: string;
  amountInCents: number;
  payerId: number;
  participantIds: number[];
}

export interface ExpenseViewModel {
  id: number;
  title: string;
  amountInCents: number;
  payer: Member;
  participants: Member[];
}

export function createViewModel(expense: Expense, membersById: Map<number, Member>): ExpenseViewModel {
  if (!membersById.has(expense.payerId)) {
    throw new Error(`Expense payer with ID: ${expense.payerId} not found.`);
  }

  const invalidParticipantIds = expense.participantIds.filter((id) => !membersById.has(id));
  if (invalidParticipantIds.length > 0) {
    throw new Error(`Expense participants with IDs: ${invalidParticipantIds.join(', ')} not found.`);
  }

  return {
    id: expense.id,
    title: expense.title,
    amountInCents: expense.amountInCents,
    payer: membersById.get(expense.payerId)!,
    participants: expense.participantIds.map((id) => membersById.get(id)!),
  };
}
