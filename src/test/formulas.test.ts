import { describe, it, expect } from 'vitest';
import {
  calculatePeriodicRate,
  calculateFrenchInstallment,
  calculateTCEA,
  round,
  getPeriodDays,
  getPeriodsPerYear,
} from '../engine/formulas';

describe('Financial Formulas Engine', () => {
  it('correctly rounds decimals', () => {
    expect(round(123.4567, 2)).toBe(123.46);
    expect(round(123.454, 2)).toBe(123.45);
    expect(round(0.005, 2)).toBe(0.01);
  });

  it('provides standard periods per year and days', () => {
    expect(getPeriodDays('annual')).toBe(360);
    expect(getPeriodDays('monthly')).toBe(30);
    expect(getPeriodDays('biweekly')).toBe(15);
    expect(getPeriodDays('weekly')).toBe(7);
    expect(getPeriodDays('daily')).toBe(1);

    expect(getPeriodsPerYear('annual')).toBe(1);
    expect(getPeriodsPerYear('monthly')).toBe(12);
    expect(getPeriodsPerYear('biweekly')).toBe(24);
    expect(getPeriodsPerYear('weekly')).toBe(52);
    expect(getPeriodsPerYear('daily')).toBe(360);
  });

  it('converts TEA (Annual Effective Rate) to monthly periodic rate', () => {
    // 24% TEA to monthly: (1 + 0.24)^(30/360) - 1 ≈ 1.8087%
    const rate = calculatePeriodicRate(24, 'TEA', 'monthly');
    expect(round(rate * 100, 3)).toBe(1.809);
  });

  it('converts TEM directly for monthly frequency', () => {
    const rate = calculatePeriodicRate(2.5, 'TEM', 'monthly');
    expect(rate).toBe(0.025);
  });

  it('calculates French installment accurately', () => {
    // Principal: 10,000, monthly rate: 2% (0.02), 12 periods
    // PMT = 10000 * (0.02 * (1.02^12)) / ((1.02^12) - 1) ≈ 945.60
    const pmt = calculateFrenchInstallment(10000, 0.02, 12);
    expect(pmt).toBe(945.6);
  });

  it('handles zero interest rate in French installment', () => {
    const pmt = calculateFrenchInstallment(12000, 0, 12);
    expect(pmt).toBe(1000);
  });

  it('calculates TCEA / IRR correctly for a standard loan', () => {
    // 10,000 disbursement, 12 payments of 945.60 (2% monthly)
    const cashFlows = [-10000, ...Array(12).fill(945.6)];
    const tcea = calculateTCEA(cashFlows, 'monthly');
    // Annual effective rate ≈ (1 + 0.02)^12 - 1 ≈ 26.82%
    expect(tcea).toBeGreaterThan(26);
    expect(tcea).toBeLessThan(27.5);
  });
});
