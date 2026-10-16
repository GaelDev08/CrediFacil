import type {
  AmortizationMethod,
  Installment,
  LoanParams,
  LoanSummary,
  MethodComparisonItem,
} from '../types';
import {
  addPeriodsToDate,
  calculateFrenchInstallment,
  calculatePeriodicRate,
  calculateTCEA,
  round,
} from './formulas';

/**
 * Generates the full amortization schedule based on loan parameters.
 * Supports French, German, and Flat rate methods with full grace period and microfinance fee logic.
 */
export function generateAmortizationSchedule(params: LoanParams): Installment[] {
  const {
    principal,
    term,
    frequency,
    rateType,
    interestRate,
    method,
    gracePeriods,
    graceType,
    disbursementDate,
    firstPaymentDate,
    desgravamenRate,
    adminFee,
  } = params;

  if (term <= 0 || principal <= 0) {
    return [];
  }

  const periodicRate = calculatePeriodicRate(interestRate, rateType, frequency);
  const safeGracePeriods = Math.min(Math.max(0, gracePeriods), term - 1);
  const effectiveGraceType = safeGracePeriods > 0 ? graceType : 'none';
  const remainingPeriodsAfterGrace = term - safeGracePeriods;

  const schedule: Installment[] = [];
  let currentBalance = principal;

  // Monthly desgravamen rate decimal
  const desgravamenDecimal = (desgravamenRate || 0) / 100;
  const fixedAdminFee = round(adminFee || 0, 2);

  // Pre-calculate fixed amounts depending on method
  let frenchPMT = 0;
  if (method === 'french' && effectiveGraceType === 'none') {
    frenchPMT = calculateFrenchInstallment(currentBalance, periodicRate, term);
  }

  // Flat rate upfront total interest
  const flatTotalInterest =
    method === 'flat' ? round(principal * periodicRate * term, 2) : 0;
  const flatPeriodInterest =
    method === 'flat' ? round(flatTotalInterest / term, 2) : 0;
  const flatPeriodPrincipal =
    method === 'flat' && remainingPeriodsAfterGrace > 0
      ? round(principal / remainingPeriodsAfterGrace, 2)
      : 0;

  for (let k = 1; k <= term; k++) {
    const isGracePeriod = k <= safeGracePeriods;
    const beginningBalance = currentBalance;

    // Determine due date
    const baseDate = firstPaymentDate && k === 1 ? firstPaymentDate : disbursementDate;
    const offset = firstPaymentDate ? k - 1 : k;
    const dueDate = addPeriodsToDate(baseDate, offset, frequency);

    // 1. Insurance (Desgravamen) calculated on beginning balance
    const insurance = round(beginningBalance * desgravamenDecimal, 2);

    // 2. Admin fee
    const installmentAdminFee = fixedAdminFee;

    // 3. Interest & Principal according to method & grace state
    let interest = 0;
    let principalAmortized = 0;

    if (isGracePeriod) {
      if (effectiveGraceType === 'partial') {
        // Partial grace: pays only interest and charges, principal = 0, balance unchanged
        interest = round(beginningBalance * periodicRate, 2);
        principalAmortized = 0;
      } else if (effectiveGraceType === 'total') {
        // Total grace: no interest or principal payment; interest is capitalized to balance
        interest = round(beginningBalance * periodicRate, 2);
        principalAmortized = 0;
      }
    } else {
      // Regular repayment period
      // Recalculate French PMT right after grace period ends or on step 1 of grace exit
      if (method === 'french') {
        if (k === safeGracePeriods + 1) {
          frenchPMT = calculateFrenchInstallment(
            beginningBalance,
            periodicRate,
            remainingPeriodsAfterGrace
          );
        }
        interest = round(beginningBalance * periodicRate, 2);

        if (k === term) {
          // Final installment: ensure exact zero balance
          principalAmortized = round(beginningBalance, 2);
        } else {
          principalAmortized = round(frenchPMT - interest, 2);
          // Safety guard if rate or rounding causes negative principal
          if (principalAmortized < 0) principalAmortized = 0;
          if (principalAmortized > beginningBalance) principalAmortized = beginningBalance;
        }
      } else if (method === 'german') {
        // German: constant principal amortized across remaining non-grace periods
        const constantGermanPrincipal = round(
          beginningBalance / (term - k + 1),
          2
        );
        interest = round(beginningBalance * periodicRate, 2);

        if (k === term) {
          principalAmortized = round(beginningBalance, 2);
        } else {
          principalAmortized = constantGermanPrincipal;
        }
      } else if (method === 'flat') {
        // Flat rate: fixed interest and fixed principal
        interest = flatPeriodInterest;
        if (k === term) {
          principalAmortized = round(beginningBalance, 2);
        } else {
          principalAmortized = flatPeriodPrincipal;
        }
      }
    }

    // 4. Ending Balance calculation
    let endingBalance = 0;
    if (isGracePeriod && effectiveGraceType === 'total') {
      // Interest capitalizes into ending balance
      endingBalance = round(beginningBalance + interest, 2);
    } else {
      endingBalance = round(Math.max(0, beginningBalance - principalAmortized), 2);
    }

    // 5. Total Installment
    let totalInstallment = 0;
    if (isGracePeriod && effectiveGraceType === 'total') {
      // Borrower only pays administrative fees/insurance if any, or 0
      totalInstallment = round(insurance + installmentAdminFee, 2);
    } else {
      totalInstallment = round(
        principalAmortized + interest + insurance + installmentAdminFee,
        2
      );
    }

    currentBalance = endingBalance;

    schedule.push({
      number: k,
      dueDate,
      beginningBalance,
      principal: principalAmortized,
      interest,
      insurance,
      adminFee: installmentAdminFee,
      totalInstallment,
      endingBalance,
      status: isGracePeriod ? 'grace' : 'pending',
      isGracePeriod,
      graceType: isGracePeriod ? effectiveGraceType : 'none',
      daysPastDue: 0,
      lateFee: 0,
      amountPaid: 0,
      remainingDue: totalInstallment,
    });
  }

  return schedule;
}

/**
 * Computes executive loan summary metrics including total interest, repayment, and TCEA.
 */
export function calculateLoanSummary(
  params: LoanParams,
  schedule: Installment[]
): LoanSummary {
  if (schedule.length === 0) {
    return {
      totalPrincipal: 0,
      totalInterest: 0,
      totalInsurance: 0,
      totalAdminFee: 0,
      totalRepayment: 0,
      tcea: 0,
      totalLateFees: 0,
      totalPaid: 0,
      outstandingBalance: 0,
      initialInstallment: 0,
      finalInstallment: 0,
      averageInstallment: 0,
    };
  }

  let totalPrincipal = 0;
  let totalInterest = 0;
  let totalInsurance = 0;
  let totalAdminFee = 0;
  let totalRepayment = 0;
  let totalLateFees = 0;
  let totalPaid = 0;

  for (const item of schedule) {
    totalPrincipal += item.principal;
    totalInterest += item.interest;
    totalInsurance += item.insurance;
    totalAdminFee += item.adminFee;
    totalRepayment += item.totalInstallment;
    totalLateFees += item.lateFee;
    totalPaid += item.amountPaid;
  }

  // TCEA Cash Flows: [ -disbursement, installment_1, installment_2, ... ]
  const cashFlows = [-params.principal, ...schedule.map((item) => item.totalInstallment)];
  const tcea = calculateTCEA(cashFlows, params.frequency);

  const nonGraceSchedule = schedule.filter((i) => !i.isGracePeriod);
  const initialInstallment =
    nonGraceSchedule.length > 0 ? nonGraceSchedule[0].totalInstallment : schedule[0].totalInstallment;
  const finalInstallment = schedule[schedule.length - 1].totalInstallment;
  const averageInstallment = round(totalRepayment / schedule.length, 2);

  // Outstanding balance = ending balance of the latest unpaid or partially paid installment
  const lastInstallment = schedule[schedule.length - 1];
  const outstandingBalance = round(
    Math.max(0, totalRepayment + totalLateFees - totalPaid),
    2
  );

  return {
    totalPrincipal: round(totalPrincipal, 2),
    totalInterest: round(totalInterest, 2),
    totalInsurance: round(totalInsurance, 2),
    totalAdminFee: round(totalAdminFee, 2),
    totalRepayment: round(totalRepayment, 2),
    tcea,
    totalLateFees: round(totalLateFees, 2),
    totalPaid: round(totalPaid, 2),
    outstandingBalance: outstandingBalance || lastInstallment.endingBalance,
    initialInstallment,
    finalInstallment,
    averageInstallment,
  };
}

/**
 * Compares French, German, and Flat rate amortization methods side-by-side for the current loan parameters.
 */
export function compareAmortizationMethods(params: LoanParams): MethodComparisonItem[] {
  const methods: AmortizationMethod[] = ['french', 'german', 'flat'];
  const names: Record<AmortizationMethod, string> = {
    french: 'Francesa (Cuota Fija)',
    german: 'Alemana (Capital Fijo)',
    flat: 'Tasa Fija / Interés Simple',
  };

  const results = methods.map((m) => {
    const sched = generateAmortizationSchedule({ ...params, method: m });
    const summary = calculateLoanSummary({ ...params, method: m }, sched);
    return {
      method: m,
      name: names[m],
      totalInterest: summary.totalInterest,
      totalRepayment: summary.totalRepayment,
      initialInstallment: summary.initialInstallment,
      finalInstallment: summary.finalInstallment,
      differenceVsFrench: 0,
    };
  });

  const frenchItem = results.find((r) => r.method === 'french') || results[0];
  for (const item of results) {
    item.differenceVsFrench = round(item.totalInterest - frenchItem.totalInterest, 2);
  }

  return results;
}
