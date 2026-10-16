import { describe, it, expect } from 'vitest';
import { simulatePayment, convertPaymentCurrency } from '../engine/payments';
import { generateAmortizationSchedule } from '../engine/amortization';
import type { LoanParams } from '../types';

const testParams: LoanParams = {
  principal: 6000,
  currency: 'PEN',
  exchangeRate: 3.75,
  interestRate: 2.0,
  rateType: 'TEM',
  term: 6,
  frequency: 'monthly',
  method: 'french',
  gracePeriods: 0,
  graceType: 'none',
  disbursementDate: '2026-01-01',
  desgravamenRate: 0,
  adminFee: 0,
  dailyLateRate: 0.1,
  fixedLateFee: 10,
  graceDaysLate: 2,
};

describe('Payment Simulation Engine', () => {
  it('converts currencies correctly', () => {
    // 100 USD at 3.75 PEN/USD = 375 PEN
    const pen = convertPaymentCurrency(100, 'USD', 'PEN', 3.75);
    expect(pen).toBe(375);

    // 375 PEN to USD at 3.75 = 100 USD
    const usd = convertPaymentCurrency(375, 'PEN', 'USD', 3.75);
    expect(usd).toBe(100);
  });

  it('simulates an on-time full payment of installment 1', () => {
    const schedule = generateAmortizationSchedule(testParams);
    const inst1 = schedule[0];

    const result = simulatePayment({
      schedule,
      loanParams: testParams,
      paymentDate: inst1.dueDate,
      amount: inst1.totalInstallment,
      paymentCurrency: 'PEN',
    });

    expect(result.updatedSchedule[0].status).toBe('paid');
    expect(result.updatedSchedule[0].remainingDue).toBe(0);
    expect(result.paymentRecord.allocation.interestPaid).toBe(inst1.interest);
    expect(result.paymentRecord.allocation.principalPaid).toBe(inst1.principal);
    expect(result.remainingCash).toBe(0);
  });

  it('simulates a partial payment respecting waterfall hierarchy', () => {
    const schedule = generateAmortizationSchedule(testParams);
    const inst1 = schedule[0]; // interest is 120, total is ~1071.05

    // Pay only 100 PEN (less than interest 120)
    const result = simulatePayment({
      schedule,
      loanParams: testParams,
      paymentDate: inst1.dueDate,
      amount: 100,
      paymentCurrency: 'PEN',
    });

    const updated1 = result.updatedSchedule[0];
    expect(updated1.status).toBe('partial');
    expect(result.paymentRecord.allocation.interestPaid).toBe(100);
    expect(result.paymentRecord.allocation.principalPaid).toBe(0);
    expect(updated1.remainingDue).toBeGreaterThan(0);
  });

  it('allocates late fee first when payment is late', () => {
    const schedule = generateAmortizationSchedule(testParams);
    const inst1 = schedule[0];
    // Payment made 10 days after due date
    const latePaymentDate = '2026-02-11'; // due was 2026-02-01

    const result = simulatePayment({
      schedule,
      loanParams: testParams,
      paymentDate: latePaymentDate,
      amount: inst1.totalInstallment,
      paymentCurrency: 'PEN',
    });

    // Mora should have been paid first, leaving some principal remaining
    expect(result.paymentRecord.allocation.lateFeePaid).toBeGreaterThan(0);
    expect(result.updatedSchedule[0].remainingDue).toBeGreaterThan(0);
  });

  it('handles foreign currency payments (USD for a PEN loan)', () => {
    const schedule = generateAmortizationSchedule(testParams);
    const inst1 = schedule[0];
    // e.g. installment is ~1071.05 PEN => in USD at 3.75 that's ~285.61 USD
    const usdAmount = Math.ceil(inst1.totalInstallment / 3.75);

    const result = simulatePayment({
      schedule,
      loanParams: testParams,
      paymentDate: inst1.dueDate,
      amount: usdAmount,
      paymentCurrency: 'USD',
    });

    expect(result.paymentRecord.convertedAmount).toBeGreaterThanOrEqual(inst1.totalInstallment);
    expect(result.updatedSchedule[0].status).toBe('paid');
  });
});
