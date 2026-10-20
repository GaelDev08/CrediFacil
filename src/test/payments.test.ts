import { describe, it, expect } from 'vitest';
import { simulatePayment, convertPaymentCurrency } from '../engine/payments';
import { generateAmortizationSchedule } from '../engine/amortization';
import type { LoanParams } from '../types';

const testParams: LoanParams = {
  principal: 6000,
  currency: 'PEN',
  exchangeRate: 3.75,
  bcvExchangeRate: 880.0,
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
  it('converts currencies correctly including USD, PEN, and VES (BCV)', () => {
    // 100 USD at 3.75 PEN/USD = 375 PEN
    const pen = convertPaymentCurrency(100, 'USD', 'PEN', 3.75);
    expect(pen).toBe(375);

    // 375 PEN to USD at 3.75 = 100 USD
    const usd = convertPaymentCurrency(375, 'PEN', 'USD', 3.75);
    expect(usd).toBe(100);

    // 10 USD to VES at 880 = 8800 VES
    const ves = convertPaymentCurrency(10, 'USD', 'VES', 3.75, 880);
    expect(ves).toBe(8800);
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
      targetInstallmentNumber: 1,
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
      targetInstallmentNumber: 1,
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
      targetInstallmentNumber: 1,
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
      targetInstallmentNumber: 1,
    });

    expect(result.paymentRecord.currency).toBe('USD');
    expect(result.paymentRecord.convertedAmount).toBeGreaterThanOrEqual(inst1.totalInstallment);
    expect(result.updatedSchedule[0].status).toBe('paid');
  });

  it('updates credit on balance when paying extra (pagar de mas con reduccion de cuota)', () => {
    const ibParams: LoanParams = {
      ...testParams,
      method: 'interest_balance',
    };
    const schedule = generateAmortizationSchedule(ibParams);
    const inst1 = schedule[0];

    // Client pays installment 1 plus an extra 2000 PEN of principal prepayment
    const extraPayment = inst1.totalInstallment + 2000;

    const result = simulatePayment({
      schedule,
      loanParams: ibParams,
      paymentDate: inst1.dueDate,
      amount: extraPayment,
      paymentCurrency: 'PEN',
      targetInstallmentNumber: 1,
      prepaymentStrategy: 'reduce_installment',
    });

    expect(result.updatedSchedule[0].status).toBe('paid');
    expect(result.paymentRecord.allocation.extraPrepayment).toBe(2000);

    // Remaining installments have recalculated interest based on the lower balance
    const originalInst2Interest = schedule[1].interest;
    const updatedInst2Interest = result.updatedSchedule[1].interest;
    expect(updatedInst2Interest).toBeLessThan(originalInst2Interest);
  });

  it('updates credit on balance when paying extra with reduce_term strategy', () => {
    const ibParams: LoanParams = {
      ...testParams,
      method: 'interest_balance',
    };
    const schedule = generateAmortizationSchedule(ibParams);
    const inst1 = schedule[0];

    // Client pays installment 1 plus enough to cancel the last installment
    const extraPayment = inst1.totalInstallment + 1200;

    const result = simulatePayment({
      schedule,
      loanParams: ibParams,
      paymentDate: inst1.dueDate,
      amount: extraPayment,
      paymentCurrency: 'PEN',
      targetInstallmentNumber: 1,
      prepaymentStrategy: 'reduce_term',
    });

    // Last installment is cancelled/paid early
    const lastInst = result.updatedSchedule[result.updatedSchedule.length - 1];
    expect(lastInst.status).toBe('paid');
    expect(lastInst.principal).toBe(0);
    expect(lastInst.interest).toBe(0);
  });

  it('handles split currency payment (USD cash + PEN bank deposit)', () => {
    const usdParams: LoanParams = {
      ...testParams,
      currency: 'USD',
      principal: 1200,
      term: 2,
      exchangeRate: 3.75,
    };
    const schedule = generateAmortizationSchedule(usdParams);
    const inst1 = schedule[0]; // e.g. ~618.12 USD

    // Client pays $300 USD in cash and the rest in PEN via bank deposit
    const usdPortion = 300;
    const penNeeded = Math.round((inst1.totalInstallment - usdPortion) * 3.75 * 100) / 100;

    const result = simulatePayment({
      schedule,
      loanParams: usdParams,
      paymentDate: inst1.dueDate,
      amount: inst1.totalInstallment,
      paymentCurrency: 'USD',
      targetInstallmentNumber: 1,
      channel: 'cash',
      isSplitPayment: true,
      splitDetails: {
        usdAmount: usdPortion,
        usdChannel: 'cash',
        localAmount: penNeeded,
        localCurrency: 'PEN',
        localChannel: 'bank_transfer',
        referenceNumber: 'DEP-BCRP-9821',
        exchangeRateUsed: 3.75,
        totalInLoanCurrency: inst1.totalInstallment,
      },
    });

    expect(result.updatedSchedule[0].status).toBe('paid');
    expect(result.paymentRecord.isSplitPayment).toBe(true);
    expect(result.paymentRecord.splitDetails?.usdAmount).toBe(300);
    expect(result.paymentRecord.splitDetails?.usdChannel).toBe('cash');
    expect(result.paymentRecord.splitDetails?.localChannel).toBe('bank_transfer');
    expect(result.paymentRecord.splitDetails?.referenceNumber).toBe('DEP-BCRP-9821');
    expect(result.updatedSchedule[0].paymentReference).toBe('DEP-BCRP-9821');
  });

  it('handles split payment in Venezuela (USD cash + VES transfer at BCV rate)', () => {
    const vesParams: LoanParams = {
      ...testParams,
      currency: 'VES',
      principal: 88000,
      term: 2,
      bcvExchangeRate: 880,
    };
    const schedule = generateAmortizationSchedule(vesParams);
    const inst1 = schedule[0]; // e.g. ~45,325 VES

    // Client pays $20 USD cash ($20 * 880 = 17,600 VES) and the rest in VES bank transfer
    const usdPortion = 20;
    const usdInVes = usdPortion * 880;
    const vesPortion = Math.round((inst1.totalInstallment - usdInVes) * 100) / 100;

    const result = simulatePayment({
      schedule,
      loanParams: vesParams,
      paymentDate: inst1.dueDate,
      amount: inst1.totalInstallment,
      paymentCurrency: 'VES',
      targetInstallmentNumber: 1,
      isSplitPayment: true,
      splitDetails: {
        usdAmount: usdPortion,
        usdChannel: 'cash',
        localAmount: vesPortion,
        localCurrency: 'VES',
        localChannel: 'bank_transfer',
        referenceNumber: 'PAGOMOVIL-BCV-4412',
        exchangeRateUsed: 880,
        totalInLoanCurrency: inst1.totalInstallment,
      },
    });

    expect(result.updatedSchedule[0].status).toBe('paid');
    expect(result.paymentRecord.isSplitPayment).toBe(true);
    expect(result.paymentRecord.splitDetails?.usdAmount).toBe(20);
    expect(result.paymentRecord.splitDetails?.usdChannel).toBe('cash');
    expect(result.paymentRecord.splitDetails?.localChannel).toBe('bank_transfer');
    expect(result.paymentRecord.splitDetails?.referenceNumber).toBe('PAGOMOVIL-BCV-4412');
  });
});
