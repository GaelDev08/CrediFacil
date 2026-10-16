import { create } from 'zustand';
import type {
  Currency,
  Installment,
  LoanParams,
  LoanSummary,
  MethodComparisonItem,
  PaymentSimulation,
} from '../types';
import {
  calculateLoanSummary,
  compareAmortizationMethods,
  generateAmortizationSchedule,
} from '../engine/amortization';
import { updateScheduleWithLateFees } from '../engine/lateFees';
import { simulatePayment } from '../engine/payments';

const today = new Date().toISOString().split('T')[0];

export const DEFAULT_LOAN_PARAMS: LoanParams = {
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
  disbursementDate: today,
  desgravamenRate: 0.05, // 0.05% monthly
  adminFee: 5.0, // S/. 5.00 fixed
  dailyLateRate: 0.1, // 0.1% daily mora
  fixedLateFee: 15.0, // S/. 15 fixed collection fee
  graceDaysLate: 2, // 2 grace days
};

export interface Preset {
  id: string;
  name: string;
  description: string;
  icon: string;
  params: Partial<LoanParams>;
}

export const LOAN_PRESETS: Preset[] = [
  {
    id: 'micro-capital',
    name: 'Microcrédito Capital de Trabajo',
    description: 'Crédito ágil para abastecimiento de inventario y negocios pequeños.',
    icon: 'Store',
    params: {
      principal: 5000,
      currency: 'PEN',
      term: 6,
      frequency: 'monthly',
      interestRate: 32,
      rateType: 'TEA',
      method: 'french',
      gracePeriods: 0,
      graceType: 'none',
      adminFee: 3,
      desgravamenRate: 0.05,
    },
  },
  {
    id: 'pyme-german',
    name: 'Crédito PYME (Amortización Alemana)',
    description: 'Cuotas decrecientes con amortización constante para reducir intereses totales.',
    icon: 'Building2',
    params: {
      principal: 25000,
      currency: 'PEN',
      term: 24,
      frequency: 'monthly',
      interestRate: 19.5,
      rateType: 'TEA',
      method: 'german',
      gracePeriods: 0,
      graceType: 'none',
      adminFee: 10,
      desgravamenRate: 0.04,
    },
  },
  {
    id: 'agricola-grace',
    name: 'Crédito Campaña con Gracia',
    description: '3 meses de gracia parcial (solo intereses) para cosecha o producción.',
    icon: 'Sprout',
    params: {
      principal: 12000,
      currency: 'PEN',
      term: 12,
      frequency: 'monthly',
      interestRate: 26,
      rateType: 'TEA',
      method: 'french',
      gracePeriods: 3,
      graceType: 'partial',
      adminFee: 5,
      desgravamenRate: 0.05,
    },
  },
  {
    id: 'usd-commercial',
    name: 'Préstamo en Divisas (USD)',
    description: 'Financiamiento en dólares estadounidenses con tipo de cambio dinámico.',
    icon: 'DollarSign',
    params: {
      principal: 8000,
      currency: 'USD',
      exchangeRate: 3.75,
      term: 18,
      frequency: 'monthly',
      interestRate: 13.5,
      rateType: 'TEA',
      method: 'french',
      gracePeriods: 0,
      graceType: 'none',
      adminFee: 2,
      desgravamenRate: 0.03,
    },
  },
  {
    id: 'flat-market',
    name: 'Microcrédito Tasa Plana (Mercado)',
    description: 'Interés simple fijo por cuota, común en créditos directos de comercio.',
    icon: 'Receipt',
    params: {
      principal: 3000,
      currency: 'PEN',
      term: 12,
      frequency: 'monthly',
      interestRate: 2.5,
      rateType: 'TEM',
      method: 'flat',
      gracePeriods: 0,
      graceType: 'none',
      adminFee: 0,
      desgravamenRate: 0,
    },
  },
];

interface CreditState {
  params: LoanParams;
  schedule: Installment[];
  summary: LoanSummary;
  comparison: MethodComparisonItem[];
  payments: PaymentSimulation[];
  evaluationDate: string;
  displayCurrency: Currency;
  isAdvancedOpen: boolean;
  activeTab: 'table' | 'charts' | 'compare' | 'payments';

  // Actions
  setLoanParam: <K extends keyof LoanParams>(key: K, value: LoanParams[K]) => void;
  setMultipleParams: (partial: Partial<LoanParams>) => void;
  setExchangeRate: (rate: number) => void;
  setDisplayCurrency: (currency: Currency) => void;
  setEvaluationDate: (date: string) => void;
  setIsAdvancedOpen: (open: boolean) => void;
  setActiveTab: (tab: 'table' | 'charts' | 'compare' | 'payments') => void;
  applyPayment: (paymentData: {
    amount: number;
    paymentDate: string;
    paymentCurrency: Currency;
    targetInstallmentNumber?: number;
    prepaymentStrategy?: 'reduce_term' | 'reduce_installment';
  }) => PaymentSimulation;
  resetPayments: () => void;
  resetToDefaults: () => void;
  loadPreset: (presetId: string) => void;
}

function computeState(
  params: LoanParams,
  evaluationDate: string,
  existingPayments: PaymentSimulation[] = []
) {
  let baseSchedule = generateAmortizationSchedule(params);

  // If there are existing payments, replay them
  let currentSchedule = baseSchedule;
  const replayedPayments: PaymentSimulation[] = [];

  for (const pay of existingPayments) {
    const res = simulatePayment({
      schedule: currentSchedule,
      loanParams: params,
      paymentDate: pay.paymentDate,
      amount: pay.amount,
      paymentCurrency: pay.currency,
      targetInstallmentNumber: pay.targetInstallmentNumber,
      prepaymentStrategy: pay.prepaymentStrategy,
    });
    currentSchedule = res.updatedSchedule;
    replayedPayments.push(res.paymentRecord);
  }

  // Update schedule with overdue late fees relative to evaluationDate
  const evaluatedSchedule = updateScheduleWithLateFees(currentSchedule, evaluationDate, params);
  const summary = calculateLoanSummary(params, evaluatedSchedule);
  const comparison = compareAmortizationMethods(params);

  return {
    schedule: evaluatedSchedule,
    summary,
    comparison,
    payments: replayedPayments,
  };
}

export const useCreditStore = create<CreditState>((set, get) => {
  const initialParams = { ...DEFAULT_LOAN_PARAMS };
  const initialCalculations = computeState(initialParams, today);

  return {
    params: initialParams,
    schedule: initialCalculations.schedule,
    summary: initialCalculations.summary,
    comparison: initialCalculations.comparison,
    payments: [],
    evaluationDate: today,
    displayCurrency: 'PEN',
    isAdvancedOpen: false,
    activeTab: 'table',

    setLoanParam: (key, value) => {
      const { params, evaluationDate, payments } = get();
      const updatedParams = { ...params, [key]: value };
      const computed = computeState(updatedParams, evaluationDate, payments);
      set({
        params: updatedParams,
        ...computed,
      });
    },

    setMultipleParams: (partial) => {
      const { params, evaluationDate, payments } = get();
      const updatedParams = { ...params, ...partial };
      const computed = computeState(updatedParams, evaluationDate, payments);
      set({
        params: updatedParams,
        ...computed,
      });
    },

    setExchangeRate: (rate) => {
      const safeRate = Math.max(0.01, rate);
      const { params, evaluationDate, payments } = get();
      const updatedParams = { ...params, exchangeRate: safeRate };
      const computed = computeState(updatedParams, evaluationDate, payments);
      set({
        params: updatedParams,
        ...computed,
      });
    },

    setDisplayCurrency: (currency) => {
      set({ displayCurrency: currency });
    },

    setEvaluationDate: (date) => {
      const { params, payments } = get();
      const computed = computeState(params, date, payments);
      set({
        evaluationDate: date,
        ...computed,
      });
    },

    setIsAdvancedOpen: (open) => {
      set({ isAdvancedOpen: open });
    },

    setActiveTab: (tab) => {
      set({ activeTab: tab });
    },

    applyPayment: (paymentData) => {
      const { schedule, params, payments, evaluationDate } = get();
      const result = simulatePayment({
        schedule,
        loanParams: params,
        paymentDate: paymentData.paymentDate,
        amount: paymentData.amount,
        paymentCurrency: paymentData.paymentCurrency,
        targetInstallmentNumber: paymentData.targetInstallmentNumber,
        prepaymentStrategy: paymentData.prepaymentStrategy,
      });

      const updatedPayments = [...payments, result.paymentRecord];
      const evaluatedSchedule = updateScheduleWithLateFees(
        result.updatedSchedule,
        evaluationDate,
        params
      );
      const summary = calculateLoanSummary(params, evaluatedSchedule);

      set({
        schedule: evaluatedSchedule,
        summary,
        payments: updatedPayments,
      });

      return result.paymentRecord;
    },

    resetPayments: () => {
      const { params, evaluationDate } = get();
      const computed = computeState(params, evaluationDate, []);
      set({
        ...computed,
        payments: [],
      });
    },

    resetToDefaults: () => {
      const computed = computeState(DEFAULT_LOAN_PARAMS, today, []);
      set({
        params: { ...DEFAULT_LOAN_PARAMS },
        displayCurrency: 'PEN',
        evaluationDate: today,
        ...computed,
        payments: [],
      });
    },

    loadPreset: (presetId) => {
      const preset = LOAN_PRESETS.find((p) => p.id === presetId);
      if (!preset) return;
      const { params, evaluationDate } = get();
      const updatedParams = { ...params, ...preset.params };
      const computed = computeState(updatedParams, evaluationDate, []);
      set({
        params: updatedParams,
        displayCurrency: updatedParams.currency,
        ...computed,
        payments: [],
      });
    },
  };
});
