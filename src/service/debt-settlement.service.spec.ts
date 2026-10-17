import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { Expense } from '../model/expense';
import { DebtSettlementService } from './debt-settlement.service';
import { ExpenseService } from './expense.service';

describe('DebtSettlementService', () => {
  function calculate(expenses: Expense[]) {
    TestBed.configureTestingModule({
      providers: [{ provide: ExpenseService, useValue: { getExpenses: () => of(expenses) } }],
    });
    return firstValueFrom(TestBed.inject(DebtSettlementService).calculateDebtSettlementTransactions());
  }

  function expense(payerId: number, amountInCents: number, participantIds: number[]): Expense {
    return { id: 1, title: 'Shared expense', payerId, amountInCents, participantIds };
  }

  it('returns no transactions for no expenses', async () => {
    expect(await calculate([])).toEqual([]);
  });

  it('excludes the payer’s own share', async () => {
    expect(await calculate([expense(1, 1000, [1, 2])])).toEqual([{ senderId: 2, recipientId: 1, amountInCents: 500 }]);
  });

  it('nets debts across expenses', async () => {
    expect(await calculate([expense(1, 1000, [1, 2]), expense(2, 600, [1, 2])])).toEqual([
      { senderId: 2, recipientId: 1, amountInCents: 200 },
    ]);
  });

  it('distributes remainder cents consistently even when the payer is not a participant', async () => {
    expect(await calculate([expense(4, 100, [3, 2, 1])])).toEqual([
      { senderId: 1, recipientId: 4, amountInCents: 34 },
      { senderId: 2, recipientId: 4, amountInCents: 33 },
      { senderId: 3, recipientId: 4, amountInCents: 33 },
    ]);
  });

  it('returns no transactions when debts cancel out', async () => {
    expect(await calculate([expense(1, 1000, [1, 2]), expense(2, 1000, [1, 2])])).toEqual([]);
  });

  it('settles all balances by repeatedly pairing the largest debtor and creditor', async () => {
    const transactions = await calculate([expense(5, 6, [1]), expense(4, 4, [2]), expense(4, 4, [3])]);
    expect(transactions).toEqual([
      { senderId: 1, recipientId: 4, amountInCents: 6 },
      { senderId: 2, recipientId: 5, amountInCents: 4 },
      { senderId: 3, recipientId: 4, amountInCents: 2 },
      { senderId: 3, recipientId: 5, amountInCents: 2 },
    ]);
    const balances = new Map([
      [1, -6],
      [2, -4],
      [3, -4],
      [4, 8],
      [5, 6],
    ]);
    for (const transaction of transactions) {
      expect(transaction.amountInCents).toBeGreaterThan(0);
      balances.set(transaction.senderId, balances.get(transaction.senderId)! + transaction.amountInCents);
      balances.set(transaction.recipientId, balances.get(transaction.recipientId)! - transaction.amountInCents);
    }
    expect([...balances.values()]).toEqual([0, 0, 0, 0, 0]);
  });

  it('nets fractional shares before rounding to whole cents', async () => {
    expect(await calculate([expense(1, 1, [1, 2]), expense(2, 1, [1, 2])])).toEqual([]);
  });
});
