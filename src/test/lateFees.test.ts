import { describe, it, expect } from 'vitest';
import { calculateLateFee, updateScheduleWithLateFees } from '../engine/lateFees';
import { generateAmortizationSchedule } from '../engine/amortization';
import type { LoanParams } from '../types';

describe('Late Fees (Mora) Engine', () => {
  it('returns zero late fee if paid on or before due date', () => {
    const fee = calculateLateFee('2026-02-01', '2026-02-01', 1000, 0.1, 15, 2);
    expect(fee.isOverdue).toBe(false);
    expect(fee.totalLateFee).toBe(0);
    expect(fee.daysPastDue).toBe(0);
  });

  it('does not apply fixed collection fee within grace days threshold', () => {
    // 2 days late, within 2 days of grace
    const fee = calculateLateFee('2026-02-01', '2026-02-03', 1000, 0.1, 15, 2);
    expect(fee.isOverdue).toBe(true);
    expect(fee.daysPastDue).toBe(2);
    expect(fee.fixedLateFee).toBe(0);
    // Daily interest: 1000 * 0.001 * 2 = 2.00
    expect(fee.dailyLateInterest).toBe(2.0);
    expect(fee.totalLateFee).toBe(2.0);
  });

  it('applies daily interest and fixed fee when past grace days', () => {
    // 5 days late, grace is 2 days
    const fee = calculateLateFee('2026-02-01', '2026-02-06', 1000, 0.1, 15, 2);
    expect(fee.isOverdue).toBe(true);
    expect(fee.daysPastDue).toBe(5);
    // Daily interest: 1000 * 0.001 * 5 = 5.00
    expect(fee.dailyLateInterest).toBe(5.0);
    expect(fee.fixedLateFee).toBe(15.0);
    expect(fee.totalLateFee).toBe(20.0);
  });

  it('updates schedule installments when overdue', () => {
    const params: LoanParams = {
      principal: 5000,
      currency: 'PEN',
      exchangeRate: 3.75,
      interestRate: 20,
      rateType: 'TEA',
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
      graceDaysLate: 1,
    };

    const schedule = generateAmortizationSchedule(params);
    // Due date of installment 1 is 2026-02-01. As of 2026-02-15 it's 14 days overdue
    const updated = updateScheduleWithLateFees(schedule, '2026-02-15', params);

    expect(updated[0].status).toBe('overdue');
    expect(updated[0].daysPastDue).toBe(14);
    expect(updated[0].lateFee).toBeGreaterThan(0);
    expect(updated[0].remainingDue).toBeGreaterThan(updated[0].totalInstallment);
  });
});
