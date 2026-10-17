import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Expense } from '../model/expense';
import { DebtSettlementTransaction } from '../model/debt-settlement';
import { ExpenseService } from './expense.service';
import { Fraction } from 'fraction.js';

const zeroFraction = new Fraction(0);

@Injectable({ providedIn: 'root' })
export class DebtSettlementService {
  private readonly expenseService = inject(ExpenseService);

  calculateDebtSettlementTransactions(): Observable<DebtSettlementTransaction[]> {
    return this.expenseService
      .getExpenses()
      .pipe(map((expenses) => this.calculateDebtSettlementTransactionsSync(expenses)));
  }

  private calculateDebtSettlementTransactionsSync(expenses: Expense[]): DebtSettlementTransaction[] {
    interface MemberBalance {
      memberId: number;
      balance: Fraction;
    }

    const compareMemberBalances = (a: MemberBalance, b: MemberBalance): number =>
      a.balance.compare(b.balance) || a.memberId - b.memberId;

    const compareRoundingRemainders = (a: MemberBalance, b: MemberBalance): number => {
      const aRemainder = a.balance.sub(a.balance.floor());
      const bRemainder = b.balance.sub(b.balance.floor());
      return bRemainder.compare(aRemainder) || b.memberId - a.memberId;
    };

    const balances = new Map<number, Fraction>();
    const addBalance = (memberId: number, amount: Fraction) => {
      balances.set(memberId, (balances.get(memberId) ?? zeroFraction).add(amount));
    };

    for (const expense of expenses) {
      const amount = new Fraction(expense.amountInCents);
      const share = amount.div(expense.participantIds.length);
      addBalance(expense.payerId, amount);
      for (const participantId of expense.participantIds) {
        addBalance(participantId, share.neg());
      }
    }

    // Round net balances together so payments use whole cents and still sum to zero.
    // Largest remainders receive the spare cents; ties leave the lower ID owing more.
    const members: MemberBalance[] = [...balances].map(([memberId, balance]) => ({
      memberId,
      balance,
    }));
    const roundingOrder = [...members].sort(compareRoundingRemainders);
    let spareCents = -members.reduce((sum, member) => sum + member.balance.floor().valueOf(), 0);
    for (const member of roundingOrder) {
      member.balance = member.balance.floor().add(spareCents > 0 ? 1 : 0);
      spareCents--;
    }

    const unsettled = members.filter((member) => !member.balance.equals(zeroFraction));
    const transactions: DebtSettlementTransaction[] = [];

    // Re-select the largest debtor and creditor after every payment.
    while (unsettled.length > 1) {
      unsettled.sort(compareMemberBalances);
      const debtor = unsettled[0];
      const creditor = unsettled[unsettled.length - 1];
      const debt = debtor.balance.neg();
      const amount = debt.compare(creditor.balance) < 0 ? debt : creditor.balance;
      transactions.push({
        senderId: debtor.memberId,
        recipientId: creditor.memberId,
        amountInCents: amount.valueOf(),
      });
      debtor.balance = debtor.balance.add(amount);
      creditor.balance = creditor.balance.sub(amount);
      if (creditor.balance.equals(zeroFraction)) {
        unsettled.pop();
      }
      if (debtor.balance.equals(zeroFraction)) {
        unsettled.shift();
      }
    }

    return transactions;
  }
}
