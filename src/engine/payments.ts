import type {
  Currency,
  Installment,
  LoanParams,
  PaymentChannel,
  PaymentCurrencySplit,
  PaymentSimulation,
} from '../types';
import { calculateFrenchInstallment, calculatePeriodicRate, round } from './formulas';
import { calculateLateFee } from './lateFees';
import { convertCurrency } from './currency';

export interface ApplyPaymentParams {
  schedule: Installment[];
  loanParams: LoanParams;
  paymentDate: string;
  amount: number;
  paymentCurrency: Currency;
  targetInstallmentNumber?: number; // specific installment or cascading
  prepaymentStrategy?: 'reduce_term' | 'reduce_installment';
  channel?: PaymentChannel;
  referenceNumber?: string;
  isSplitPayment?: boolean;
  splitDetails?: PaymentCurrencySplit;
}

export interface ApplyPaymentResult {
  updatedSchedule: Installment[];
  paymentRecord: PaymentSimulation;
  remainingCash: number;
}

/**
 * Calculates consolidated equivalent in loan currency for a split-currency payment (e.g. USD cash + VES transfer).
 */
export function calculateSplitPaymentTotal(
  usdAmount: number,
  localAmount: number,
  localCurrency: Currency,
  loanCurrency: Currency,
  usdPenRate: number = 3.75,
  bcvVesRate: number = 881.88
): {
  totalInLoanCurrency: number;
  usdConverted: number;
  localConverted: number;
} {
  const usdConverted = convertCurrency(usdAmount, 'USD', loanCurrency, usdPenRate, bcvVesRate);
  const localConverted = convertCurrency(localAmount, localCurrency, loanCurrency, usdPenRate, bcvVesRate);
  const totalInLoanCurrency = round(usdConverted + localConverted, 2);

  return {
    totalInLoanCurrency,
    usdConverted,
    localConverted,
  };
}

/**
 * Converts a payment amount to the loan currency based on exchange rates (including BCV for VES).
 */
export function convertPaymentCurrency(
  amount: number,
  fromCurrency: Currency,
  loanCurrency: Currency,
  exchangeRate: number = 3.75, // USD/PEN
  bcvRate: number = 881.88 // USD/VES
): number {
  return convertCurrency(amount, fromCurrency, loanCurrency, exchangeRate, bcvRate);
}

/**
 * Simulates a payment against the loan amortization schedule according to the LATAM microfinance waterfall:
 * 1. Mora / Late fees
 * 2. Comisiones / Admin fees
 * 3. Seguros / Insurance
 * 4. Intereses compensatorios
 * 5. Capital corriente exigible
 * 6. Excedente / Abono extraordinario a capital (Método Interés sobre Saldo: recálculo inmediato del crédito)
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
    channel = 'cash',
    referenceNumber,
    isSplitPayment = false,
    splitDetails,
  } = params;

  // Si es un pago combinado (split), consolidar ambas partes a la moneda base del préstamo
  let convertedAmount = 0;
  if (isSplitPayment && splitDetails) {
    const splitCalc = calculateSplitPaymentTotal(
      splitDetails.usdAmount,
      splitDetails.localAmount,
      splitDetails.localCurrency,
      loanParams.currency,
      loanParams.exchangeRate,
      loanParams.bcvExchangeRate || 881.88
    );
    convertedAmount = splitCalc.totalInLoanCurrency;
  } else {
    convertedAmount = convertPaymentCurrency(
      amount,
      paymentCurrency,
      loanParams.currency,
      loanParams.exchangeRate,
      loanParams.bcvExchangeRate || 881.88
    );
  }

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
      item.paymentChannel = channel || (isSplitPayment ? splitDetails?.usdChannel : 'cash');
      item.paymentReference = referenceNumber || splitDetails?.referenceNumber;
      item.isSplitPayment = isSplitPayment;
      item.daysPastDue = 0;
      item.lateFee = 0;
    } else {
      item.daysPastDue = late.daysPastDue;
      item.status = late.daysPastDue > 0 ? 'overdue' : 'partial';
      item.paymentChannel = channel || (isSplitPayment ? splitDetails?.usdChannel : 'cash');
      item.paymentReference = referenceNumber || splitDetails?.referenceNumber;
      item.isSplitPayment = isSplitPayment;
    }
  }

  // Waterfall 6: Surplus cash (Abono de más / Prepago a capital: Actualización del crédito)
  if (cash > 0) {
    allocation.extraPrepayment = cash;
    const unpaidInstallments = updatedSchedule.filter((i) => i.status !== 'paid');

    if (unpaidInstallments.length > 0) {
      if (prepaymentStrategy === 'reduce_term') {
        // Reducir Plazo: El cliente paga de más y cancela cuotas finales, terminando antes
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
            inst.totalInstallment = round(
              inst.principal + inst.interest + inst.insurance + inst.adminFee,
              2
            );
            inst.remainingDue = inst.totalInstallment;
            surplus = 0;
          }
        }
        cash = surplus;
      } else {
        // Reducir Cuota (Interés sobre Saldo): Se deduce el excedente del saldo insoluto
        // y se actualizan todas las cuotas restantes con el nuevo saldo deudor menor
        const currentBalance =
          unpaidInstallments[0].beginningBalance - allocation.principalPaid - cash;
        const newBalance = Math.max(0, currentBalance);
        const remainingCount = unpaidInstallments.length;
        const periodicRate = calculatePeriodicRate(
          loanParams.interestRate,
          loanParams.rateType,
          loanParams.frequency
        );

        if (remainingCount > 0) {
          if (loanParams.method === 'french') {
            const newPmt = calculateFrenchInstallment(newBalance, periodicRate, remainingCount);
            let rollingBalance = newBalance;

            unpaidInstallments.forEach((inst, idx) => {
              inst.beginningBalance = round(rollingBalance, 2);
              inst.interest = round(rollingBalance * periodicRate, 2);
              if (idx === remainingCount - 1) {
                inst.principal = round(rollingBalance, 2);
              } else {
                inst.principal = round(newPmt - inst.interest, 2);
                if (inst.principal > rollingBalance) inst.principal = rollingBalance;
              }
              inst.endingBalance = round(Math.max(0, rollingBalance - inst.principal), 2);
              inst.totalInstallment = round(
                inst.principal + inst.interest + inst.insurance + inst.adminFee,
                2
              );
              inst.remainingDue = inst.totalInstallment;
              rollingBalance = inst.endingBalance;
            });
          } else if (
            loanParams.method === 'german' ||
            loanParams.method === 'interest_balance'
          ) {
            // Método Interés sobre Saldo / Alemán:
            // Interés calculado rigurosamente sobre el saldo remanente menor
            const constantCapital = round(newBalance / remainingCount, 2);
            let rollingBalance = newBalance;

            unpaidInstallments.forEach((inst, idx) => {
              inst.beginningBalance = round(rollingBalance, 2);
              inst.interest = round(rollingBalance * periodicRate, 2);
              if (idx === remainingCount - 1) {
                inst.principal = round(rollingBalance, 2);
              } else {
                inst.principal = constantCapital;
                if (inst.principal > rollingBalance) inst.principal = rollingBalance;
              }
              inst.endingBalance = round(Math.max(0, rollingBalance - inst.principal), 2);
              inst.totalInstallment = round(
                inst.principal + inst.interest + inst.insurance + inst.adminFee,
                2
              );
              inst.remainingDue = inst.totalInstallment;
              rollingBalance = inst.endingBalance;
            });
          } else if (loanParams.method === 'flat') {
            // Flat rate: recálculo sobre nuevo saldo
            const newFlatInterest = round(newBalance * periodicRate, 2);
            const newFlatPrincipal = round(newBalance / remainingCount, 2);
            let rollingBalance = newBalance;

            unpaidInstallments.forEach((inst, idx) => {
              inst.beginningBalance = round(rollingBalance, 2);
              inst.interest = newFlatInterest;
              inst.principal = idx === remainingCount - 1 ? round(rollingBalance, 2) : newFlatPrincipal;
              inst.endingBalance = round(Math.max(0, rollingBalance - inst.principal), 2);
              inst.totalInstallment = round(
                inst.principal + inst.interest + inst.insurance + inst.adminFee,
                2
              );
              inst.remainingDue = inst.totalInstallment;
              rollingBalance = inst.endingBalance;
            });
          }
        }
        cash = 0;
      }
    }
  }

  // Build simulation log record
  const effectiveChannel = channel || (isSplitPayment ? splitDetails?.usdChannel : 'cash');
  const effectiveRef = referenceNumber || splitDetails?.referenceNumber;

  let summaryText = '';
  if (isSplitPayment && splitDetails) {
    const usdCh = splitDetails.usdChannel === 'cash' ? 'Efectivo' : 'Depósito';
    const locCh = splitDetails.localChannel === 'cash' ? 'Efectivo' : 'Depósito';
    const refStr = splitDetails.referenceNumber ? ` (Ref: ${splitDetails.referenceNumber})` : '';
    summaryText = `Pago Mixto: $${splitDetails.usdAmount.toFixed(2)} USD [${usdCh}] + ${splitDetails.localCurrency} ${splitDetails.localAmount.toFixed(2)} [${locCh}${refStr}] = Consolidado ${loanParams.currency} ${convertedAmount.toFixed(2)}`;
  } else {
    const chLabel = effectiveChannel === 'cash' ? 'Efectivo' : `Depósito Bancario${effectiveRef ? ` (Ref: ${effectiveRef})` : ''}`;
    summaryText = `Abono de ${paymentCurrency} ${amount.toFixed(2)} [${chLabel}]${
      paymentCurrency !== loanParams.currency
        ? ` (≈ ${loanParams.currency} ${convertedAmount.toFixed(2)})`
        : ''
    }`;
  }

  summaryText += `: Mora: ${allocation.lateFeePaid.toFixed(2)}, Interés: ${allocation.interestPaid.toFixed(2)}, Capital: ${(
    allocation.principalPaid + allocation.extraPrepayment
  ).toFixed(2)}${
    allocation.extraPrepayment > 0
      ? ` [Abono Extra a Capital: ${allocation.extraPrepayment.toFixed(2)} - Recalculado con Interés sobre Saldo (${
          prepaymentStrategy === 'reduce_term' ? 'Reducción de Plazo' : 'Reducción de Cuota'
        })]`
      : ''
  }`;

  const paymentRecord: PaymentSimulation = {
    id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    paymentDate,
    amount: isSplitPayment && splitDetails ? convertedAmount : amount,
    currency: isSplitPayment && splitDetails ? loanParams.currency : paymentCurrency,
    convertedAmount,
    exchangeRateUsed:
      paymentCurrency === 'VES' || loanParams.currency === 'VES'
        ? loanParams.bcvExchangeRate || 881.88
        : loanParams.exchangeRate,
    channel: effectiveChannel,
    referenceNumber: effectiveRef,
    isSplitPayment,
    splitDetails,
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
    impactSummary: summaryText,
  };

  return {
    updatedSchedule,
    paymentRecord,
    remainingCash: cash,
  };
}
