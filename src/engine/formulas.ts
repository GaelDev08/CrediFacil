import type { PaymentFrequency, RateType } from '../types';

/**
 * Rounds a number to a fixed number of decimals with financial precision.
 */
export function round(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/**
 * Returns the standard number of days associated with a payment frequency (LATAM banking convention 360-day year).
 */
export function getPeriodDays(frequency: PaymentFrequency): number {
  switch (frequency) {
    case 'weekly':
      return 7;
    case 'biweekly':
      return 15;
    case 'monthly':
    default:
      return 30;
  }
}

/**
 * Returns periods per standard year for a given frequency.
 */
export function getPeriodsPerYear(frequency: PaymentFrequency): number {
  switch (frequency) {
    case 'weekly':
      return 52;
    case 'biweekly':
      return 24;
    case 'monthly':
    default:
      return 12;
  }
}

/**
 * Converts a nominal or effective rate (TEA, TEM, TNA) into an exact periodic effective interest rate (decimal).
 * Follows LATAM banking regulations (SBS / Condusef).
 *
 * @param rate - Stated interest rate percentage (e.g., 24 for 24%)
 * @param rateType - 'TEA' (Annual Effective), 'TEM' (Monthly Effective), 'TNA' (Annual Nominal)
 * @param frequency - Payment frequency
 */
export function calculatePeriodicRate(
  rate: number,
  rateType: RateType,
  frequency: PaymentFrequency
): number {
  if (rate <= 0) return 0;
  const rateDecimal = rate / 100;
  const days = getPeriodDays(frequency);

  switch (rateType) {
    case 'TEA': {
      // Periodic effective rate from TEA: (1 + TEA)^(days / 360) - 1
      return Math.pow(1 + rateDecimal, days / 360) - 1;
    }
    case 'TEM': {
      if (frequency === 'monthly') {
        return rateDecimal;
      }
      // Equivalent periodic rate: (1 + TEM)^(days / 30) - 1
      return Math.pow(1 + rateDecimal, days / 30) - 1;
    }
    case 'TNA': {
      // Linear proportional rate: TNA * (days / 360)
      return rateDecimal * (days / 360);
    }
    default:
      return rateDecimal / getPeriodsPerYear(frequency);
  }
}

/**
 * Standard French Method formula for fixed installment (PMT).
 *
 * PMT = Principal * [ i * (1 + i)^n ] / [ (1 + i)^n - 1 ]
 */
export function calculateFrenchInstallment(
  principal: number,
  periodicRate: number,
  remainingPeriods: number
): number {
  if (remainingPeriods <= 0 || principal <= 0) return 0;
  if (periodicRate === 0) return round(principal / remainingPeriods, 2);

  const factor = Math.pow(1 + periodicRate, remainingPeriods);
  const pmt = principal * ((periodicRate * factor) / (factor - 1));
  return round(pmt, 2);
}

/**
 * Calculates calendar due date by adding periods to a disbursement or base date.
 */
export function addPeriodsToDate(
  baseDateStr: string,
  periodNumber: number,
  frequency: PaymentFrequency
): string {
  const [year, month, day] = baseDateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  if (frequency === 'monthly') {
    // Keep day of month consistent, adjusting for shorter months
    const targetMonth = month - 1 + periodNumber;
    date.setMonth(targetMonth);
  } else if (frequency === 'biweekly') {
    date.setDate(date.getDate() + periodNumber * 14); // 2 weeks
  } else if (frequency === 'weekly') {
    date.setDate(date.getDate() + periodNumber * 7); // 1 week
  }

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Computes difference in calendar days between two ISO date strings (target - base).
 */
export function getDaysDifference(baseDateStr: string, targetDateStr: string): number {
  const [y1, m1, d1] = baseDateStr.split('-').map(Number);
  const [y2, m2, d2] = targetDateStr.split('-').map(Number);

  const t1 = new Date(y1, m1 - 1, d1).getTime();
  const t2 = new Date(y2, m2 - 1, d2).getTime();

  const diffTime = t2 - t1;
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculates Internal Rate of Return (IRR / TIR) using Newton-Raphson.
 * Used to compute the regulatory TCEA (Tasa de Costo Efectivo Anual).
 *
 * @param cashFlows - Array where index 0 is negative disbursement (-principal) and 1..n are total installments.
 * @param maxIterations - Max iterations for convergence
 * @param tolerance - Precision threshold
 */
export function calculateIRR(
  cashFlows: number[],
  maxIterations: number = 100,
  tolerance: number = 1e-7
): number {
  if (cashFlows.length < 2) return 0;
  
  let rate = 0.1; // Initial guess: 10% per period

  for (let iter = 0; iter < maxIterations; iter++) {
    let npv = 0;
    let dNpv = 0;

    for (let t = 0; t < cashFlows.length; t++) {
      const denom = Math.pow(1 + rate, t);
      npv += cashFlows[t] / denom;
      if (t > 0) {
        dNpv -= (t * cashFlows[t]) / Math.pow(1 + rate, t + 1);
      }
    }

    if (Math.abs(dNpv) < 1e-12) break;

    const newRate = rate - npv / dNpv;
    if (Math.abs(newRate - rate) < tolerance) {
      return newRate;
    }
    rate = newRate;

    // Safety bounds
    if (rate <= -0.999) rate = -0.999;
    if (rate > 10) rate = 10;
  }

  return rate;
}

/**
 * Annualizes a periodic IRR into TCEA (Annual Effective Cost Rate).
 */
export function calculateTCEA(
  cashFlows: number[],
  frequency: PaymentFrequency
): number {
  const periodicIrr = calculateIRR(cashFlows);
  if (periodicIrr <= 0 || isNaN(periodicIrr)) return 0;
  const periodsPerYear = getPeriodsPerYear(frequency);
  const tcea = Math.pow(1 + periodicIrr, periodsPerYear) - 1;
  return round(tcea * 100, 2);
}
