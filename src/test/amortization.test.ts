import { describe, it, expect } from 'vitest';
import {
  generateAmortizationSchedule,
  calculateLoanSummary,
  compareAmortizationMethods,
} from '../engine/amortization';
import type { LoanParams } from '../types';

const baseParams: LoanParams = {
  principal: 10000,
  currency: 'PEN',
  exchangeRate: 3.75,
  interestRate: 2.0, // 2% monthly
  rateType: 'TEM',
  term: 12,
  frequency: 'monthly',
  method: 'french',
  gracePeriods: 0,
  graceType: 'none',
  disbursementDate: '2026-01-01',
  desgravamenRate: 0,
  adminFee: 0,
  dailyLateRate: 0.1,
  fixedLateFee: 15,
  graceDaysLate: 2,
};

describe('Amortization Schedule Engine', () => {
  it('generates a correct French schedule with zero final balance', () => {
    const schedule = generateAmortizationSchedule(baseParams);

    expect(schedule).toHaveLength(12);
    // Installments should be equal (around 945.60)
    expect(schedule[0].totalInstallment).toBe(945.6);
    expect(schedule[6].totalInstallment).toBe(945.6);

    // Final balance must be zero
    expect(schedule[11].endingBalance).toBe(0);

    // Total principal amortized must equal 10,000
    const totalPrincipal = schedule.reduce((sum, item) => sum + item.principal, 0);
    expect(Math.round(totalPrincipal)).toBe(10000);
  });

  it('generates a correct German schedule with constant principal', () => {
    const schedule = generateAmortizationSchedule({
      ...baseParams,
      method: 'german',
    });

    expect(schedule).toHaveLength(12);
    // In German, principal is constant (10,000 / 12 = 833.33)
    expect(schedule[0].principal).toBe(833.33);
    expect(schedule[5].principal).toBe(833.33);

    // Installments should decrease over time
    expect(schedule[0].totalInstallment).toBeGreaterThan(schedule[11].totalInstallment);

    // Final ending balance must be 0
    expect(schedule[11].endingBalance).toBe(0);
  });

  it('generates Flat rate schedule (simple interest)', () => {
    const schedule = generateAmortizationSchedule({
      ...baseParams,
      method: 'flat',
    });

    expect(schedule).toHaveLength(12);
    // Flat interest = 10000 * 0.02 * 12 = 2400 total => 200 per month
    expect(schedule[0].interest).toBe(200);
    expect(schedule[5].interest).toBe(200);

    // Constant installment
    expect(schedule[0].totalInstallment).toBe(schedule[5].totalInstallment);
    expect(schedule[11].endingBalance).toBe(0);
  });

  it('handles partial grace period correctly', () => {
    const schedule = generateAmortizationSchedule({
      ...baseParams,
      gracePeriods: 2,
      graceType: 'partial',
    });

    expect(schedule).toHaveLength(12);
    // Periods 1 and 2: principal amortized is 0, pays only interest
    expect(schedule[0].principal).toBe(0);
    expect(schedule[0].interest).toBe(200); // 10000 * 0.02
    expect(schedule[0].isGracePeriod).toBe(true);

    expect(schedule[1].principal).toBe(0);
    expect(schedule[1].endingBalance).toBe(10000);

    // Period 3 onwards starts amortizing over remaining 10 periods
    expect(schedule[2].principal).toBeGreaterThan(0);
    expect(schedule[11].endingBalance).toBe(0);
  });

  it('handles total grace period with capitalization of interest', () => {
    const schedule = generateAmortizationSchedule({
      ...baseParams,
      gracePeriods: 2,
      graceType: 'total',
    });

    expect(schedule).toHaveLength(12);
    // Period 1: interest 200 capitalizes to 10200
    expect(schedule[0].totalInstallment).toBe(0);
    expect(schedule[0].endingBalance).toBe(10200);

    // Period 2: interest 10200 * 0.02 = 204 capitalizes to 10404
    expect(schedule[1].totalInstallment).toBe(0);
    expect(schedule[1].endingBalance).toBe(10404);

    // Period 3 starts amortizing the capitalized balance (10404)
    expect(schedule[2].beginningBalance).toBe(10404);
    expect(schedule[11].endingBalance).toBe(0);
  });

  it('calculates complete summary and compares methods', () => {
    const schedule = generateAmortizationSchedule(baseParams);
    const summary = calculateLoanSummary(baseParams, schedule);

    expect(summary.totalPrincipal).toBe(10000);
    expect(summary.totalInterest).toBeGreaterThan(1300);
    expect(summary.tcea).toBeGreaterThan(20);

    const comparison = compareAmortizationMethods(baseParams);
    expect(comparison).toHaveLength(3);
    const french = comparison.find((c) => c.method === 'french');
    const german = comparison.find((c) => c.method === 'german');
    // German method generally yields less total interest than French
    expect(german!.totalInterest).toBeLessThanOrEqual(french!.totalInterest);
  });
});
