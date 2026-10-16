import type {
  Currency,
  Installment,
  LoanParams,
  PaymentSimulation,
} from '../types';
import { calculateFrenchInstallment, calculatePeriodicRate, round } from './formulas';
import { calculateLateFee } from './lateFees';

export interface ApplyPaymentParams {
  schedule: Installment[];
  loanParams: LoanParams;
  paymentDate: string;
  amount: number;
  paymentCurrency: Currency;
  targetInstallmentNumber?: number; // specific installment or cascading
  prepaymentStrategy?: 'reduce_term' | 'reduce_installment';
}

export interface ApplyPaymentResult {
  updatedSchedule: Installment[];
  paymentRecord: PaymentSimulation;
  remainingCash: number;
}

/**
 * Converts a payment amount to the loan currency based on the exchange rate.
 */
export function convertPaymentCurrency(
  amount: number,
  fromCurrency: Currency,
  loanCurrency: Currency,
  exchangeRate: number // e.g. 3.75 PEN per USD
): number {
  if (fromCurrency === loanCurrency) {
    return round(amount, 2);
  }

  // If loan is PEN and payment is in USD: PEN = USD * exchangeRate
  if (loanCurrency === 'PEN' && fromCurrency === 'USD') {
    return round(amount * exchangeRate, 2);
  }

  // If loan is USD and payment is in PEN: USD = PEN / exchangeRate
  if (loanCurrency === 'USD' && fromCurrency === 'PEN') {
    return round(amount / exchangeRate, 2);
  }

  // Generic fallback using 1:1 if unsupported direct pair
  return round(amount, 2);
}

/**
 * Simulates a payment against the loan amortization schedule according to the LATAM microfinance waterfall:
 * 1. Mora / Late fees
 * 2. Comisiones / Admin fees
 * 3. Seguros / Insurance
 * 4. Intereses compensatorios
 * 5. Capital exigible
 * 6. Extra capital prepayment
 */
export function simulatePayment(params: ApplyPaymentParams): ApplyPaymentResult {
  const {
    schedule: originalSchedule,
    loanParams,
    paymentDate,
    amount,
    paymentCurrency,
    targetInstallmentNumber,
    prepaymentStrategy = 'reduce_installment',
  } = params;

  // Convert to loan's base currency
  const convertedAmount = convertPaymentCurrency(
    amount,
    paymentCurrency,
    loanParams.currency,
    loanParams.exchangeRate
  );

  let cash = convertedAmount;
  const updatedSchedule: Installment[] = JSON.parse(JSON.stringify(originalSchedule));

  const allocation = {
    lateFeePaid: 0,
    adminFeePaid: 0,
    insurancePaid: 0,
    interestPaid: 0,
    principalPaid: 0,
    extraPrepayment: 0,
  };

  // Determine target installments to process
  let targets: Installment[] = [];
  if (targetInstallmentNumber && targetInstallmentNumber > 0) {
    const target = updatedSchedule.find((i) => i.number === targetInstallmentNumber);
    if (target) {
      targets = [target];
    }
  } else {
    // Cascading: pay from oldest unpaid installment forward
    targets = updatedSchedule.filter((i) => i.status !== 'paid');
  }

  for (const item of targets) {
    if (cash <= 0) break;

    // Check if overdue as of paymentDate
    const late = calculateLateFee(
      item.dueDate,
      paymentDate,
      item.principal + item.interest,
      loanParams.dailyLateRate,
      loanParams.fixedLateFee,
      loanParams.graceDaysLate
    );

    const accruedLate = Math.max(item.lateFee, late.totalLateFee);
    item.lateFee = accruedLate;

    const startCash = cash;
    const initialDebt = round(item.totalInstallment + accruedLate - item.amountPaid, 2);

    // Waterfall 1: Late Fee
    const lateFeeDue = Math.max(0, item.lateFee);
    if (lateFeeDue > 0) {
      const payLate = Math.min(cash, lateFeeDue);
      allocation.lateFeePaid = round(allocation.lateFeePaid + payLate, 2);
      cash = round(cash - payLate, 2);
      item.lateFee = round(item.lateFee - payLate, 2);
    }

    // Waterfall 2: Admin fee
    const adminFeeDue = Math.max(0, item.adminFee);
    if (adminFeeDue > 0 && cash > 0) {
      const payAdmin = Math.min(cash, adminFeeDue);
      allocation.adminFeePaid = round(allocation.adminFeePaid + payAdmin, 2);
      cash = round(cash - payAdmin, 2);
    }

    // Waterfall 3: Insurance
    const insuranceDue = Math.max(0, item.insurance);
    if (insuranceDue > 0 && cash > 0) {
      const payInsurance = Math.min(cash, insuranceDue);
      allocation.insurancePaid = round(allocation.insurancePaid + payInsurance, 2);
      cash = round(cash - payInsurance, 2);
    }

    // Waterfall 4: Interest
    const interestDue = Math.max(0, item.interest);
    if (interestDue > 0 && cash > 0) {
      const payInterest = Math.min(cash, interestDue);
      allocation.interestPaid = round(allocation.interestPaid + payInterest, 2);
      cash = round(cash - payInterest, 2);
    }

    // Waterfall 5: Principal
    const principalDue = Math.max(0, item.principal);
    if (principalDue > 0 && cash > 0) {
      const payPrincipal = Math.min(cash, principalDue);
      allocation.principalPaid = round(allocation.principalPaid + payPrincipal, 2);
      cash = round(cash - payPrincipal, 2);
    }

    // Track total amount paid towards this installment
    const paidInThisStep = round(startCash - cash, 2);
    item.amountPaid = round(item.amountPaid + paidInThisStep, 2);

    const remainingDebt = round(Math.max(0, initialDebt - paidInThisStep), 2);
    item.remainingDue = remainingDebt;

    if (remainingDebt === 0) {
      item.status = 'paid';
      item.paidDate = paymentDate;
      item.daysPastDue = 0;
      item.lateFee = 0;
    } else {
      item.daysPastDue = late.daysPastDue;
      item.status = late.daysPastDue > 0 ? 'overdue' : 'partial';
    }
  }

  // Waterfall 6: Surplus cash (Prepayment to remaining loan principal)
  if (cash > 0) {
    allocation.extraPrepayment = cash;
    const unpaidInstallments = updatedSchedule.filter((i) => i.status !== 'paid');

    if (unpaidInstallments.length > 0) {
      if (prepaymentStrategy === 'reduce_term') {
        // Apply surplus from the last installment backwards to cancel full periods
        let surplus = cash;
        for (let i = updatedSchedule.length - 1; i >= 0; i--) {
          const inst = updatedSchedule[i];
          if (inst.status === 'paid' || surplus <= 0) continue;

          if (surplus >= inst.principal) {
            surplus = round(surplus - inst.principal, 2);
            inst.principal = 0;
            inst.interest = 0;
            inst.insurance = 0;
            inst.adminFee = 0;
            inst.totalInstallment = 0;
            inst.remainingDue = 0;
            inst.status = 'paid';
            inst.paidDate = paymentDate;
          } else {
            inst.principal = round(inst.principal - surplus, 2);
            inst.totalInstallment = round(inst.principal + inst.interest + inst.insurance + inst.adminFee, 2);
            inst.remainingDue = inst.totalInstallment;
            surplus = 0;
          }
        }
        cash = surplus;
      } else {
        // reduce_installment: Reduce current balance and recalculate remaining installments
        const currentBalance = unpaidInstallments[0].beginningBalance - allocation.principalPaid - cash;
        const newBalance = Math.max(0, currentBalance);
        const remainingCount = unpaidInstallments.length;
        const periodicRate = calculatePeriodicRate(
          loanParams.interestRate,
          loanParams.rateType,
          loanParams.frequency
        );

        if (loanParams.method === 'french' && remainingCount > 0) {
          const newPmt = calculateFrenchInstallment(newBalance, periodicRate, remainingCount);
          let rollingBalance = newBalance;

          unpaidInstallments.forEach((inst, idx) => {
            inst.beginningBalance = round(rollingBalance, 2);
            inst.interest = round(rollingBalance * periodicRate, 2);
            if (idx === remainingCount - 1) {
              inst.principal = round(rollingBalance, 2);
            } else {
              inst.principal = round(newPmt - inst.interest, 2);
            }
            inst.endingBalance = round(Math.max(0, rollingBalance - inst.principal), 2);
            inst.totalInstallment = round(
              inst.principal + inst.interest + inst.insurance + inst.adminFee,
              2
            );
            inst.remainingDue = inst.totalInstallment;
            rollingBalance = inst.endingBalance;
          });
        }
        cash = 0;
      }
    }
  }

  // Build simulation log record
  const paymentRecord: PaymentSimulation = {
    id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    paymentDate,
    amount,
    currency: paymentCurrency,
    convertedAmount,
    exchangeRateUsed: loanParams.exchangeRate,
    targetInstallmentNumber,
    prepaymentStrategy,
    allocation: {
      lateFeePaid: round(allocation.lateFeePaid, 2),
      adminFeePaid: round(allocation.adminFeePaid, 2),
      insurancePaid: round(allocation.insurancePaid, 2),
      interestPaid: round(allocation.interestPaid, 2),
      principalPaid: round(allocation.principalPaid, 2),
      extraPrepayment: round(allocation.extraPrepayment, 2),
    },
    impactSummary: `Abono de ${paymentCurrency} ${amount.toFixed(2)}${
      paymentCurrency !== loanParams.currency
        ? ` (${loanParams.currency} ${convertedAmount.toFixed(2)})`
        : ''
    }: Mora: ${allocation.lateFeePaid.toFixed(2)}, Interés: ${allocation.interestPaid.toFixed(2)}, Capital: ${(
      allocation.principalPaid + allocation.extraPrepayment
    ).toFixed(2)}`,
  };

  return {
    updatedSchedule,
    paymentRecord,
    remainingCash: cash,
  };
}
