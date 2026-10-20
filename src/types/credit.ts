export type Currency = 'PEN' | 'USD' | 'MXN' | 'COP' | 'VES';

export interface CurrencyConfig {
  code: Currency;
  symbol: string;
  name: string;
  flag: string;
  defaultExchangeRateToPEN: number; // PEN base
  defaultExchangeRateToUSD?: number; // USD base
}

export type AmortizationMethod = 'french' | 'german' | 'flat' | 'interest_balance';

export type RateType = 'TEA' | 'TEM' | 'TNA';

export type PaymentFrequency = 'annual' | 'monthly' | 'biweekly' | 'weekly' | 'daily';

export type GracePeriodType = 'none' | 'partial' | 'total';

export type InstallmentStatus = 'pending' | 'paid' | 'partial' | 'overdue' | 'grace';

export interface LoanParams {
  id?: string;
  name?: string;
  principal: number;
  currency: Currency;
  exchangeRate: number; // e.g. 3.75 PEN per USD
  bcvExchangeRate?: number; // e.g. 881.88 VES per USD (Banco Central de Venezuela)
  bcvLastUpdated?: string;
  interestRate: number; // percentage value, e.g. 24 for 24%
  rateType: RateType;
  term: number; // number of installments
  frequency: PaymentFrequency;
  method: AmortizationMethod;
  gracePeriods: number; // count of installments in grace
  graceType: GracePeriodType;
  disbursementDate: string; // YYYY-MM-DD
  firstPaymentDate?: string; // YYYY-MM-DD
  desgravamenRate: number; // monthly rate % on debt balance, e.g. 0.05
  adminFee: number; // fixed fee per installment, e.g. 5
  adminFeeType?: 'fixed' | 'percentage'; // whether admin fee is fixed amount or %
  adminFeePercent?: number; // percentage fee per installment (e.g. 1 for 1%)
  disbursementFeePercent?: number; // % fee deducted or charged at disbursement (e.g. 2 for 2%)
  disbursementFeeAmount?: number; // calculated disbursement fee
  dailyLateRate: number; // daily late rate % on overdue principal/installment, e.g. 0.1
  fixedLateFee: number; // fixed collection fee if overdue, e.g. 15
  graceDaysLate: number; // grace days before fixed fee is applied, e.g. 2
}

export interface Installment {
  number: number;
  dueDate: string; // YYYY-MM-DD
  beginningBalance: number;
  principal: number; // capital amortizado
  interest: number; // interés compensatorio
  insurance: number; // seguro desgravamen
  adminFee: number; // comisiones fijas
  totalInstallment: number; // principal + interest + insurance + adminFee
  endingBalance: number;
  status: InstallmentStatus;
  isGracePeriod: boolean;
  graceType: GracePeriodType;
  // Dynamic payment tracking
  daysPastDue: number;
  lateFee: number; // accrued late penalty
  amountPaid: number;
  paidDate?: string;
  remainingDue: number; // totalInstallment + lateFee - amountPaid
}

export interface PaymentSimulation {
  id: string;
  paymentDate: string; // YYYY-MM-DD
  amount: number;
  currency: Currency;
  convertedAmount: number; // Amount in loan currency
  exchangeRateUsed: number;
  targetInstallmentNumber?: number; // specific installment or automatic cascade
  prepaymentStrategy?: 'reduce_term' | 'reduce_installment';
  allocation: {
    lateFeePaid: number;
    adminFeePaid: number;
    insurancePaid: number;
    interestPaid: number;
    principalPaid: number;
    extraPrepayment: number;
  };
  impactSummary: string;
}

export interface LoanSummary {
  totalPrincipal: number;
  totalInterest: number;
  totalInsurance: number;
  totalAdminFee: number;
  disbursementFee: number;
  netDisbursement: number;
  totalRepayment: number;
  tcea: number; // Tasa de Costo Efectivo Anual en %
  totalLateFees: number;
  totalPaid: number;
  outstandingBalance: number;
  initialInstallment: number;
  finalInstallment: number;
  averageInstallment: number;
}

export interface MethodComparisonItem {
  method: AmortizationMethod;
  name: string;
  totalInterest: number;
  totalRepayment: number;
  initialInstallment: number;
  finalInstallment: number;
  differenceVsFrench: number;
}
