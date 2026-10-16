import React, { useState } from 'react';
import {
  X,
  CreditCard,
  ArrowRight,
  Sparkles,
  Coins,
} from 'lucide-react';
import { useCreditStore } from '../../store/useCreditStore';
import { CURRENCY_CONFIGS } from '../../engine/currency';
import { convertPaymentCurrency } from '../../engine/payments';
import { round } from '../../engine/formulas';
import type { Currency, Installment } from '../../types';

interface PaymentSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetInstallmentNumber?: number;
}

interface FormInnerProps {
  targetInstallment?: Installment;
  targetInstallmentNumber?: number;
  onClose: () => void;
}

const PaymentSimulatorForm: React.FC<FormInnerProps> = ({
  targetInstallment,
  targetInstallmentNumber,
  onClose,
}) => {
  const { params, applyPayment, evaluationDate } = useCreditStore();

  const [paymentCurrency, setPaymentCurrency] = useState<Currency>(params.currency);
  const [amount, setAmount] = useState<number>(() =>
    targetInstallment ? targetInstallment.remainingDue || targetInstallment.totalInstallment : 0
  );
  const [paymentDate, setPaymentDate] = useState<string>(() =>
    targetInstallment ? targetInstallment.dueDate : evaluationDate
  );
  const [prepaymentStrategy, setPrepaymentStrategy] = useState<
    'reduce_term' | 'reduce_installment'
  >('reduce_installment');

  const currentLoanCurrencyConfig = CURRENCY_CONFIGS[params.currency];
  const currentPayCurrencyConfig = CURRENCY_CONFIGS[paymentCurrency];

  const convertedAmount = convertPaymentCurrency(
    amount,
    paymentCurrency,
    params.currency,
    params.exchangeRate
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    applyPayment({
      amount,
      paymentDate,
      paymentCurrency,
      targetInstallmentNumber,
      prepaymentStrategy,
    });

    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
      {/* Target Installment Info Badge */}
      {targetInstallment && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">
              Cuota Seleccionada #{targetInstallment.number}
            </span>
            <div className="text-sm font-bold text-slate-900">
              Vencimiento: {targetInstallment.dueDate}
            </div>
            <div className="text-xs text-slate-500">
              Capital: {currentLoanCurrencyConfig.symbol}{' '}
              {targetInstallment.principal.toFixed(2)} | Interés:{' '}
              {currentLoanCurrencyConfig.symbol} {targetInstallment.interest.toFixed(2)}
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-500 font-semibold">Exigible</span>
            <div className="text-base font-black text-blue-700">
              {currentLoanCurrencyConfig.symbol}{' '}
              {targetInstallment.remainingDue.toFixed(2)}
            </div>
            {targetInstallment.lateFee > 0 && (
              <span className="text-[11px] font-bold text-rose-600 block">
                (Mora: +{targetInstallment.lateFee.toFixed(2)})
              </span>
            )}
          </div>
        </div>
      )}

      {/* Currency and Amount Fields */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-1 space-y-1">
          <label className="block text-xs font-semibold text-slate-700">
            Moneda Pago
          </label>
          <select
            value={paymentCurrency}
            onChange={(e) => setPaymentCurrency(e.target.value as Currency)}
            className="w-full py-2.5 px-3 text-xs font-bold rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500"
          >
            {(['PEN', 'USD', 'MXN', 'COP'] as Currency[]).map((c) => (
              <option key={c} value={c}>
                {CURRENCY_CONFIGS[c].flag} {c}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-2 space-y-1">
          <label className="block text-xs font-semibold text-slate-700">
            Monto a Pagar
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 font-bold text-sm">
              {currentPayCurrencyConfig.symbol}
            </span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount || ''}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full pl-9 pr-3 py-2 text-base font-bold rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
              required
            />
          </div>
        </div>
      </div>

      {/* Foreign Currency Conversion Alert */}
      {paymentCurrency !== params.currency && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800 flex items-center justify-between">
          <div>
            <span className="font-bold">Conversión al Tipo de Cambio:</span>
            <p className="text-[11px] text-blue-600">
              {amount} {paymentCurrency} = {convertedAmount.toFixed(2)}{' '}
              {params.currency} (T.C. {params.exchangeRate})
            </p>
          </div>
          <Coins className="w-5 h-5 text-blue-600" />
        </div>
      )}

      {/* Quick Amount Suggestion Pills */}
      {targetInstallment && (
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => setAmount(targetInstallment.remainingDue)}
            className="text-xs font-semibold px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors"
          >
            Pagar Cuota Exacta
          </button>
          <button
            type="button"
            onClick={() =>
              setAmount(
                round(
                  targetInstallment.remainingDue +
                    (targetInstallment.remainingDue > 500 ? 500 : 200),
                  2
                )
              )
            }
            className="text-xs font-semibold px-2.5 py-1 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-700 transition-colors"
          >
            Cuota + Abono Extra
          </button>
          <button
            type="button"
            onClick={() =>
              setAmount(round(targetInstallment.remainingDue / 2, 2))
            }
            className="text-xs font-semibold px-2.5 py-1 bg-amber-50 hover:bg-amber-100 rounded-lg text-amber-700 transition-colors"
          >
            Pago Parcial (50%)
          </button>
        </div>
      )}

      {/* Payment Date */}
      <div className="space-y-1">
        <label className="block text-xs font-semibold text-slate-700">
          Fecha de Ejecución del Pago
        </label>
        <div className="relative">
          <input
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <p className="text-[11px] text-slate-500">
          Si la fecha es posterior al vencimiento, se calcularán intereses moratorios automáticamente.
        </p>
      </div>

      {/* Prepayment Strategy */}
      <div className="space-y-2 pt-1">
        <label className="block text-xs font-semibold text-slate-700">
          En caso de Excedente / Prepago Extra:
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setPrepaymentStrategy('reduce_installment')}
            className={`p-2.5 text-left rounded-xl border text-xs transition-all ${
              prepaymentStrategy === 'reduce_installment'
                ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-bold'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div>Reducir Cuota</div>
            <span className="text-[10px] text-slate-500 font-normal">
              Mantiene el número de meses, baja el monto
            </span>
          </button>
          <button
            type="button"
            onClick={() => setPrepaymentStrategy('reduce_term')}
            className={`p-2.5 text-left rounded-xl border text-xs transition-all ${
              prepaymentStrategy === 'reduce_term'
                ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-bold'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div>Reducir Plazo</div>
            <span className="text-[10px] text-slate-500 font-normal">
              Cancela cuotas finales, termina antes
            </span>
          </button>
        </div>
      </div>

      {/* Microfinance Waterfall Explainer */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 space-y-1">
        <div className="font-bold text-slate-800 text-[11px] flex items-center">
          <Sparkles className="w-3.5 h-3.5 mr-1 text-blue-600" />
          Regla de Prelación de Pagos (Fintech/Banca):
        </div>
        <p className="text-[11px]">
          1° Mora y Penalidades &rarr; 2° Gastos y Seguros &rarr; 3° Interés Compensatorio &rarr; 4° Capital Exigible &rarr; 5° Amortización Anticipada.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-3 pt-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2.5 px-4 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 py-2.5 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center space-x-1.5"
        >
          <span>Confirmar Abono</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </form>
  );
};

export const PaymentSimulatorModal: React.FC<PaymentSimulatorModalProps> = ({
  isOpen,
  onClose,
  targetInstallmentNumber,
}) => {
  const { schedule } = useCreditStore();

  if (!isOpen) return null;

  const targetInstallment = targetInstallmentNumber
    ? schedule.find((i) => i.number === targetInstallmentNumber)
    : schedule.find((i) => i.status !== 'paid');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-700/60 rounded-xl">
              <CreditCard className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Simulador de Pago de Crédito
              </h3>
              <p className="text-xs text-blue-200">
                {targetInstallment
                  ? `Aplicar pago a Cuota #${targetInstallment.number}`
                  : 'Abono general en cascada al cronograma'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-blue-300 hover:text-white hover:bg-blue-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Keyed inner form ensuring fresh state on target change without useEffect */}
        <PaymentSimulatorForm
          key={targetInstallment ? `inst_${targetInstallment.number}` : 'generic'}
          targetInstallment={targetInstallment}
          targetInstallmentNumber={targetInstallmentNumber}
          onClose={onClose}
        />
      </div>
    </div>
  );
};
