import { describe, it, expect } from 'vitest';
import {
  generateAmortizationSchedule,
  calculateLoanSummary,
  compareAmortizationMethods,
} from '../engine/amortization';
import type { LoanParams } from '../types';

describe('Amortization Schedule Engine', () => {
  const baseParams: LoanParams = {
    principal: 10000,
    currency: 'PEN',
    exchangeRate: 3.75,
    interestRate: 24, // 24% TEA
    rateType: 'TEA',
    term: 12,
    frequency: 'monthly',
    method: 'french',
    gracePeriods: 0,
    graceType: 'none',
    disbursementDate: '2026-01-01',
    desgravamenRate: 0.05,
    adminFee: 5.0,
    dailyLateRate: 0.1,
    fixedLateFee: 15.0,
    graceDaysLate: 2,
  };

  it('generates a correct French schedule with zero final balance', () => {
    const schedule = generateAmortizationSchedule(baseParams);

    expect(schedule).toHaveLength(12);
    expect(schedule[0].beginningBalance).toBe(10000);
    // Ending balance on last installment must reach exactly zero
    expect(schedule[11].endingBalance).toBe(0);

    // Sum of principal amortized must equal initial loan principal
    const totalPrincipalAmortized = schedule.reduce((sum, item) => sum + item.principal, 0);
    expect(Math.round(totalPrincipalAmortized)).toBe(10000);
  });

  it('generates a correct German schedule with constant principal', () => {
    const germanParams: LoanParams = { ...baseParams, method: 'german' };
    const schedule = generateAmortizationSchedule(germanParams);

    expect(schedule).toHaveLength(12);
    // Capital is constant across installments (10000 / 12 ~ 833.33)
    const p1 = schedule[0].principal;
    const p2 = schedule[1].principal;
    expect(Math.abs(p1 - p2)).toBeLessThanOrEqual(0.02);

    expect(schedule[11].endingBalance).toBe(0);
    // Installments decrease period to period
    expect(schedule[0].totalInstallment).toBeGreaterThan(schedule[11].totalInstallment);
  });

  it('generates a correct Interest on Balance (Interés sobre Saldo) schedule', () => {
    const ibParams: LoanParams = { ...baseParams, method: 'interest_balance' };
    const schedule = generateAmortizationSchedule(ibParams);

    expect(schedule).toHaveLength(12);
    expect(schedule[11].endingBalance).toBe(0);
    // Interest is calculated directly on declining beginningBalance
    expect(schedule[0].interest).toBeGreaterThan(schedule[11].interest);
  });

  it('generates Flat rate schedule (simple interest)', () => {
    const flatParams: LoanParams = {
      ...baseParams,
      method: 'flat',
      interestRate: 2, // 2% TEM
      rateType: 'TEM',
    };
    const schedule = generateAmortizationSchedule(flatParams);

    expect(schedule).toHaveLength(12);
    // Flat interest must be constant in every installment
    expect(schedule[0].interest).toBe(schedule[5].interest);
    expect(schedule[11].endingBalance).toBe(0);
  });

  it('handles partial grace period correctly', () => {
    const graceParams: LoanParams = {
      ...baseParams,
      gracePeriods: 2,
      graceType: 'partial',
    };
    const schedule = generateAmortizationSchedule(graceParams);

    // First 2 installments pay only interest + charges, zero principal
    expect(schedule[0].principal).toBe(0);
    expect(schedule[0].endingBalance).toBe(10000);
    expect(schedule[1].principal).toBe(0);
    expect(schedule[1].endingBalance).toBe(10000);

    // Installment 3 begins active amortization
    expect(schedule[2].principal).toBeGreaterThan(0);
    expect(schedule[11].endingBalance).toBe(0);
  });

  it('handles total grace period with capitalization of interest', () => {
    const graceParams: LoanParams = {
      ...baseParams,
      gracePeriods: 2,
      graceType: 'total',
      interestRate: 2, // TEM 2%
      rateType: 'TEM',
    };
    const schedule = generateAmortizationSchedule(graceParams);

    // Period 1: interest 10000 * 0.02 = 200 capitalizes to 10200
    expect(schedule[0].totalInstallment).toBe(schedule[0].insurance + schedule[0].adminFee);
    expect(schedule[0].endingBalance).toBe(10200);

    // Period 2: interest 10200 * 0.02 = 204 capitalizes to 10404
    expect(schedule[1].totalInstallment).toBe(schedule[1].insurance + schedule[1].adminFee);
    expect(schedule[1].endingBalance).toBe(10404);

    // Period 3 starts amortizing the capitalized balance (10404)
    expect(schedule[2].beginningBalance).toBe(10404);
    expect(schedule[11].endingBalance).toBe(0);
  });

  it('calculates disbursement fees (%) and updates net disbursement and TCEA', () => {
    const feeParams: LoanParams = {
      ...baseParams,
      disbursementFeePercent: 2.0, // 2% of 10000 = 200
    };
    const schedule = generateAmortizationSchedule(feeParams);
    const summary = calculateLoanSummary(feeParams, schedule);

    expect(summary.disbursementFee).toBe(200);
    expect(summary.netDisbursement).toBe(9800);
    // TCEA increases when net disbursement is reduced by fees
    const normalSummary = calculateLoanSummary(baseParams, schedule);
    expect(summary.tcea).toBeGreaterThan(normalSummary.tcea);
  });

  it('calculates administrative expenses as percentage when configured', () => {
    const adminPercentParams: LoanParams = {
      ...baseParams,
      adminFeeType: 'percentage',
      adminFeePercent: 1.0, // 1% of balance
    };
    const schedule = generateAmortizationSchedule(adminPercentParams);
    // Period 1 admin fee should be 1% of 10000 = 100
    expect(schedule[0].adminFee).toBe(100);
  });

  it('calculates normally when no disbursement or admin fee is configured', () => {
    const pureParams: LoanParams = {
      ...baseParams,
      adminFee: 0,
      adminFeePercent: 0,
      disbursementFeePercent: 0,
      desgravamenRate: 0,
    };
    const schedule = generateAmortizationSchedule(pureParams);
    const summary = calculateLoanSummary(pureParams, schedule);

    expect(summary.disbursementFee).toBe(0);
    expect(summary.netDisbursement).toBe(10000);
    expect(summary.totalAdminFee).toBe(0);
    expect(schedule[0].adminFee).toBe(0);
    expect(schedule[0].totalInstallment).toBe(schedule[0].principal + schedule[0].interest);
  });

  it('calculates complete summary and compares 4 methods', () => {
    const schedule = generateAmortizationSchedule(baseParams);
    const summary = calculateLoanSummary(baseParams, schedule);

    expect(summary.totalPrincipal).toBe(10000);
    expect(summary.totalInterest).toBeGreaterThan(1200);
    expect(summary.tcea).toBeGreaterThan(20);

    const comparison = compareAmortizationMethods(baseParams);
    expect(comparison).toHaveLength(4);
    const french = comparison.find((c) => c.method === 'french');
    const german = comparison.find((c) => c.method === 'german');
    const interestBalance = comparison.find((c) => c.method === 'interest_balance');
    expect(german!.totalInterest).toBeLessThanOrEqual(french!.totalInterest);
    expect(interestBalance).toBeDefined();
  });
});
