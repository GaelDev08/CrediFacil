import React, { useState } from 'react';
import {
  X,
  CreditCard,
  ArrowRight,
  Sparkles,
  Coins,
  AlertCircle,
} from 'lucide-react';
import { useCreditStore } from '../../store/useCreditStore';
import { CURRENCY_CONFIGS, formatCurrency } from '../../engine/currency';
import { convertPaymentCurrency } from '../../engine/payments';
import { round } from '../../engine/formulas';
import { calculateLateFee } from '../../engine/lateFees';
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
  const { params, applyPayment, evaluationDate, bcvRate } = useCreditStore();

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

  const currentPayCurrencyConfig = CURRENCY_CONFIGS[paymentCurrency];

  const convertedAmount = convertPaymentCurrency(
    amount,
    paymentCurrency,
    params.currency,
    params.exchangeRate,
    bcvRate
  );

  // Validación de mora proyectada a la fecha de pago elegida
  const projectedLateFee = targetInstallment
    ? calculateLateFee(
        targetInstallment.dueDate,
        paymentDate,
        targetInstallment.principal + targetInstallment.interest,
        params.dailyLateRate,
        params.fixedLateFee,
        params.graceDaysLate
      )
    : null;

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

  const currencies: Currency[] = ['PEN', 'USD', 'MXN', 'COP', 'VES'];

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
      {/* Target Installment Info Badge */}
      {targetInstallment && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase">
                Cuota Seleccionada #{targetInstallment.number}
              </span>
              <div className="text-sm font-bold text-slate-900">
                Vencimiento: {targetInstallment.dueDate}
              </div>
              <div className="text-xs text-slate-500">
                Capital: {formatCurrency(targetInstallment.principal, params.currency)} | Interés:{' '}
                {formatCurrency(targetInstallment.interest, params.currency)}
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-500 font-semibold">Exigible</span>
              <div className="text-base font-black text-blue-700">
                {formatCurrency(targetInstallment.remainingDue, params.currency)}
              </div>
              {targetInstallment.lateFee > 0 && (
                <span className="text-[11px] font-bold text-rose-600 block">
                  (Mora actual: +{formatCurrency(targetInstallment.lateFee, params.currency)})
                </span>
              )}
            </div>
          </div>

          {/* Validación de Mora a la fecha elegida */}
          {projectedLateFee && projectedLateFee.isOverdue && (
            <div className="bg-rose-50 border border-rose-200 text-rose-900 rounded-xl p-2.5 text-xs space-y-1">
              <div className="font-bold flex items-center text-rose-700">
                <AlertCircle className="w-3.5 h-3.5 mr-1" />
                Validación de Mora Proyectada: {projectedLateFee.daysPastDue} días de atraso
              </div>
              <div className="grid grid-cols-2 text-[11px] text-rose-800">
                <span>Interés Moratorio ({params.dailyLateRate}%/d): +{formatCurrency(projectedLateFee.dailyLateInterest, params.currency)}</span>
                <span>Comisión Cobranza Fija: +{formatCurrency(projectedLateFee.fixedLateFee, params.currency)}</span>
              </div>
              <p className="text-[10px] text-rose-600">
                Total Mora a liquidar: <strong>{formatCurrency(projectedLateFee.totalLateFee, params.currency)}</strong>
              </p>
            </div>
          )}
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
            {currencies.map((c) => (
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
              {formatCurrency(amount, paymentCurrency)} = {formatCurrency(convertedAmount, params.currency)}{' '}
              {paymentCurrency === 'VES' || params.currency === 'VES'
                ? `(Tasa BCV: Bs. ${bcvRate})`
                : `(T.C.: ${params.exchangeRate})`}
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
            Cuota + Abono Extra (Pagar de Más)
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
          Si la fecha supera los días de tolerancia de mora, se aplican los intereses moratorios y comisiones.
        </p>
      </div>

      {/* Prepayment Strategy */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-700">
            Método Interés sobre Saldo al Pagar de Más (Excedente):
          </label>
          <span className="text-[10px] text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded">
            Recálculo de Crédito
          </span>
        </div>
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
            <span className="text-[10px] text-slate-500 font-normal block">
              Disminuye las cuotas futuras calculando intereses sobre el nuevo saldo insoluto menor.
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
            <span className="text-[10px] text-slate-500 font-normal block">
              Cancela cuotas finales de capital y elimina por completo sus intereses.
            </span>
          </button>
        </div>
      </div>

      {/* Microfinance Waterfall Explainer */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 space-y-1">
        <div className="font-bold text-slate-800 text-[11px] flex items-center">
          <Sparkles className="w-3.5 h-3.5 mr-1 text-blue-600" />
          Regla de Prelación de Pagos (Payment Waterfall):
        </div>
        <p className="text-[11px]">
          1° Mora &rarr; 2° Comisiones & Gastos &rarr; 3° Seguros &rarr; 4° Interés Compensatorio &rarr; 5° Capital Exigible &rarr; 6° Abono Extraordinario a Saldo.
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
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Simulador de Abonos & Pagos
              </h3>
              <p className="text-xs text-slate-500">
                Aplica la prelación legal y recalcula sobre saldo si pagas de más
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <PaymentSimulatorForm
          targetInstallment={targetInstallment}
          targetInstallmentNumber={targetInstallmentNumber}
          onClose={onClose}
        />
      </div>
    </div>
  );
};
