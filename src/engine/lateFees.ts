import type { Installment, LoanParams } from '../types';
import { getDaysDifference, round } from './formulas';

export interface LateFeeCalculationResult {
  daysPastDue: number;
  dailyLateInterest: number;
  fixedLateFee: number;
  totalLateFee: number;
  isOverdue: boolean;
}

/**
 * Calculates late fee (mora) for an overdue installment.
 * Uses standard LATAM microfinance rules:
 * - Days past due (DPD)
 * - Daily moratory rate applied to overdue balance
 * - Fixed collection penalty applied once DPD exceeds grace days threshold
 */
export function calculateLateFee(
  dueDate: string,
  asOfDate: string,
  overdueAmount: number,
  dailyLateRate: number,
  fixedLateFee: number,
  graceDaysLate: number = 0
): LateFeeCalculationResult {
  const daysDiff = getDaysDifference(dueDate, asOfDate);

  if (daysDiff <= 0 || overdueAmount <= 0) {
    return {
      daysPastDue: 0,
      dailyLateInterest: 0,
      fixedLateFee: 0,
      totalLateFee: 0,
      isOverdue: false,
    };
  }

  const daysPastDue = daysDiff;
  const isBeyondGrace = daysPastDue > graceDaysLate;

  // Daily interest = overdueAmount * (dailyRate / 100) * daysPastDue
  const dailyRateDecimal = (dailyLateRate || 0) / 100;
  const dailyLateInterest = round(overdueAmount * dailyRateDecimal * daysPastDue, 2);

  // Fixed collection fee triggers only after grace days expire
  const appliedFixedFee = isBeyondGrace ? round(fixedLateFee || 0, 2) : 0;
  const totalLateFee = round(dailyLateInterest + appliedFixedFee, 2);

  return {
    daysPastDue,
    dailyLateInterest,
    fixedLateFee: appliedFixedFee,
    totalLateFee,
    isOverdue: true,
  };
}

/**
 * Updates an entire amortization schedule with accrued late fees up to a specific evaluation date.
 */
export function updateScheduleWithLateFees(
  schedule: Installment[],
  asOfDate: string,
  params: LoanParams
): Installment[] {
  return schedule.map((item) => {
    // If installment is already fully paid, keep historical state
    if (item.status === 'paid') {
      return item;
    }

    const unpaidAmount = Math.max(0, item.totalInstallment - item.amountPaid);
    if (unpaidAmount <= 0) {
      return {
        ...item,
        status: 'paid',
        remainingDue: 0,
        daysPastDue: 0,
        lateFee: 0,
      };
    }

    const lateResult = calculateLateFee(
      item.dueDate,
      asOfDate,
      item.principal + item.interest, // Moratory interest applies to principal + interest
      params.dailyLateRate,
      params.fixedLateFee,
      params.graceDaysLate
    );

    if (lateResult.isOverdue) {
      const remainingDue = round(unpaidAmount + lateResult.totalLateFee, 2);
      return {
        ...item,
        status: 'overdue',
        daysPastDue: lateResult.daysPastDue,
        lateFee: lateResult.totalLateFee,
        remainingDue,
      };
    }

    return {
      ...item,
      daysPastDue: 0,
      lateFee: 0,
      remainingDue: unpaidAmount,
      status: item.amountPaid > 0 ? 'partial' : item.isGracePeriod ? 'grace' : 'pending',
    };
  });
}
