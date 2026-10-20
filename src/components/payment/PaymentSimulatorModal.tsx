import React, { useState } from 'react';
import {
  X,
  CreditCard,
  ArrowRight,
  Sparkles,
  Coins,
  AlertCircle,
  Banknote,
  Building2,
  Receipt,
  Layers,
} from 'lucide-react';
import { useCreditStore } from '../../store/useCreditStore';
import { CURRENCY_CONFIGS, formatCurrency } from '../../engine/currency';
import {
  convertPaymentCurrency,
  calculateSplitPaymentTotal,
} from '../../engine/payments';
import { round } from '../../engine/formulas';
import { calculateLateFee } from '../../engine/lateFees';
import type { Currency, Installment, PaymentChannel } from '../../types';

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

  // Modo de pago: simple o mixto (divisas + moneda local)
  const [isSplitMode, setIsSplitMode] = useState<boolean>(false);

  // Estados para Pago Simple
  const [paymentCurrency, setPaymentCurrency] = useState<Currency>(params.currency);
  const [amount, setAmount] = useState<number>(() =>
    targetInstallment ? targetInstallment.remainingDue || targetInstallment.totalInstallment : 0
  );
  const [paymentChannel, setPaymentChannel] = useState<PaymentChannel>('cash');
  const [referenceNumber, setReferenceNumber] = useState<string>('');

  // Estados para Pago Mixto / Combinado
  const [splitUsdAmount, setSplitUsdAmount] = useState<number>(() => {
    if (!targetInstallment) return 10;
    const due = targetInstallment.remainingDue || targetInstallment.totalInstallment;
    // Si el crédito está en USD, sugerir la mitad en USD
    if (params.currency === 'USD') return round(due / 2, 2);
    // Si está en VES/PEN, sugerir un monto base en USD
    return round(due / (params.currency === 'VES' ? bcvRate : params.exchangeRate) / 2, 2);
  });
  const [splitUsdChannel, setSplitUsdChannel] = useState<PaymentChannel>('cash');

  const [splitLocalCurrency, setSplitLocalCurrency] = useState<Currency>(() =>
    params.currency === 'USD' ? 'VES' : params.currency
  );
  const [splitLocalAmount, setSplitLocalAmount] = useState<number>(0);
  const [splitLocalChannel, setSplitLocalChannel] = useState<PaymentChannel>('bank_transfer');
  const [splitReferenceNumber, setSplitReferenceNumber] = useState<string>('');

  // Fecha y estrategia de prepago
  const [paymentDate, setPaymentDate] = useState<string>(() =>
    targetInstallment ? targetInstallment.dueDate : evaluationDate
  );
  const [prepaymentStrategy, setPrepaymentStrategy] = useState<
    'reduce_term' | 'reduce_installment'
  >('reduce_installment');

  const currentPayCurrencyConfig = CURRENCY_CONFIGS[paymentCurrency];
  const currencies: Currency[] = ['PEN', 'USD', 'MXN', 'COP', 'VES'];

  // Conversión simple a la moneda del crédito
  const convertedSimpleAmount = convertPaymentCurrency(
    amount,
    paymentCurrency,
    params.currency,
    params.exchangeRate,
    bcvRate
  );

  // Cálculo consolidado de pago mixto
  const splitCalculation = calculateSplitPaymentTotal(
    splitUsdAmount || 0,
    splitLocalAmount || 0,
    splitLocalCurrency,
    params.currency,
    params.exchangeRate,
    bcvRate
  );

  // Monto efectivo total a liquidar según la modalidad
  const totalEffectiveAmount = isSplitMode
    ? splitCalculation.totalInLoanCurrency
    : convertedSimpleAmount;

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

  // Auto-completar el pago mixto para cubrir exactamente la cuota exigible
  const handleAutoCompleteSplit = () => {
    if (!targetInstallment) return;
    const due = targetInstallment.remainingDue || targetInstallment.totalInstallment;
    // Cuánto cubre la porción en USD convertida a la moneda del préstamo
    const usdInLoanCurrency = convertPaymentCurrency(
      splitUsdAmount || 0,
      'USD',
      params.currency,
      params.exchangeRate,
      bcvRate
    );
    const pendingInLoanCurrency = Math.max(0, due - usdInLoanCurrency);

    // Convertir lo pendiente a la moneda local seleccionada
    const neededLocal = convertPaymentCurrency(
      pendingInLoanCurrency,
      params.currency,
      splitLocalCurrency,
      params.exchangeRate,
      bcvRate
    );
    setSplitLocalAmount(round(neededLocal, 2));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isSplitMode) {
      if (totalEffectiveAmount <= 0) return;

      applyPayment({
        amount: totalEffectiveAmount,
        paymentDate,
        paymentCurrency: params.currency,
        targetInstallmentNumber,
        prepaymentStrategy,
        channel: splitUsdChannel,
        referenceNumber: splitReferenceNumber,
        isSplitPayment: true,
        splitDetails: {
          usdAmount: splitUsdAmount || 0,
          usdChannel: splitUsdChannel,
          localAmount: splitLocalAmount || 0,
          localCurrency: splitLocalCurrency,
          localChannel: splitLocalChannel,
          referenceNumber: splitReferenceNumber,
          exchangeRateUsed:
            splitLocalCurrency === 'VES' || params.currency === 'VES'
              ? (params.bcvExchangeRate || bcvRate)
              : params.exchangeRate,
          totalInLoanCurrency: totalEffectiveAmount,
        },
      });
    } else {
      if (amount <= 0) return;

      applyPayment({
        amount,
        paymentDate,
        paymentCurrency,
        targetInstallmentNumber,
        prepaymentStrategy,
        channel: paymentChannel,
        referenceNumber,
        isSplitPayment: false,
      });
    }

    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar">
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

      {/* Tabs: Pago Simple vs Pago Mixto / Combinado */}
      <div className="bg-slate-100 p-1 rounded-xl flex items-center space-x-1">
        <button
          type="button"
          onClick={() => setIsSplitMode(false)}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
            !isSplitMode
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Pago Simple (Moneda Única)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setIsSplitMode(true);
            if (splitLocalAmount === 0) handleAutoCompleteSplit();
          }}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
            isSplitMode
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-emerald-600" />
          <span>Pago Mixto (USD + Otra Moneda)</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* OPCION A: PAGO SIMPLE (UNA SOLA MONEDA)                         */}
      {/* ============================================================== */}
      {!isSplitMode ? (
        <div className="space-y-3.5 bg-slate-50/60 p-3.5 rounded-2xl border border-slate-200">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1 space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Moneda Pago
              </label>
              <select
                value={paymentCurrency}
                onChange={(e) => setPaymentCurrency(e.target.value as Currency)}
                className="w-full py-2 px-2.5 text-xs font-bold rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500"
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
                  className="w-full pl-9 pr-3 py-2 text-base font-bold rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  required={!isSplitMode}
                />
              </div>
            </div>
          </div>

          {/* Método de Pago: Efectivo o Depósito */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Canal de Recepción
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setPaymentChannel('cash')}
                  className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center space-x-1 ${
                    paymentChannel === 'cash'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Efectivo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentChannel('bank_transfer')}
                  className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center space-x-1 ${
                    paymentChannel === 'bank_transfer'
                      ? 'border-blue-600 bg-blue-50 text-blue-800 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Depósito</span>
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                N° Comprobante / Referencia
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder={paymentChannel === 'cash' ? 'Opcional (Recibo N°)' : 'Ej: DEP-40912 / Transferencia'}
                  className="w-full px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Conversión si es moneda diferente */}
          {paymentCurrency !== params.currency && (
            <div className="bg-blue-50/90 border border-blue-200 rounded-xl p-2.5 text-xs text-blue-800 flex items-center justify-between">
              <div>
                <span className="font-bold">Equivalente al T.C. Oficial:</span>
                <p className="text-[11px] text-blue-700">
                  {formatCurrency(amount, paymentCurrency)} ≈ {formatCurrency(convertedSimpleAmount, params.currency)}{' '}
                  {paymentCurrency === 'VES' || params.currency === 'VES'
                    ? `(Tasa BCV: Bs. ${bcvRate})`
                    : `(T.C.: ${params.exchangeRate})`}
                </p>
              </div>
              <Coins className="w-5 h-5 text-blue-600" />
            </div>
          )}
        </div>
      ) : (
        /* ============================================================== */
        /* OPCION B: PAGO MIXTO / COMBINADO (USD + OTRA DIVISA)           */
        /* ============================================================== */
        <div className="space-y-3 bg-gradient-to-br from-slate-50 to-emerald-50/40 p-4 rounded-2xl border border-emerald-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-950 flex items-center">
              <Sparkles className="w-4 h-4 mr-1 text-emerald-600" />
              Desglose de Pago Combinado
            </span>
            <button
              type="button"
              onClick={handleAutoCompleteSplit}
              className="text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-white px-2 py-0.5 rounded border border-blue-200 shadow-2xs"
              title="Calcular cuánto falta en moneda local para pagar exactamente la cuota"
            >
              Calcular restante exacto
            </button>
          </div>

          {/* Tramo 1: Dólares (USD) */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center">
                <span className="mr-1">🇺🇸</span> Tramo 1: Dólares (USD)
              </span>
              <span className="text-[10px] text-slate-500 font-semibold">Divisa Extranjera</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 font-bold text-xs">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={splitUsdAmount || ''}
                  onChange={(e) => setSplitUsdAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00 USD"
                  className="w-full pl-7 pr-2 py-1.5 text-sm font-bold rounded-lg border border-slate-300 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex space-x-1">
                <button
                  type="button"
                  onClick={() => setSplitUsdChannel('cash')}
                  className={`flex-1 py-1 px-1.5 rounded-lg text-xs font-semibold border transition-all text-center ${
                    splitUsdChannel === 'cash'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold'
                      : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  💵 Efectivo
                </button>
                <button
                  type="button"
                  onClick={() => setSplitUsdChannel('bank_transfer')}
                  className={`flex-1 py-1 px-1.5 rounded-lg text-xs font-semibold border transition-all text-center ${
                    splitUsdChannel === 'bank_transfer'
                      ? 'border-blue-600 bg-blue-50 text-blue-800 font-bold'
                      : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  🏦 Depósito
                </button>
              </div>
            </div>
          </div>

          {/* Tramo 2: Moneda Local (VES, PEN, MXN, COP) */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-bold text-slate-800">
                  Tramo 2: Moneda Local
                </span>
                <select
                  value={splitLocalCurrency}
                  onChange={(e) => setSplitLocalCurrency(e.target.value as Currency)}
                  className="py-0.5 px-1.5 text-xs font-bold rounded border border-slate-300 bg-white"
                >
                  {currencies
                    .filter((c) => c !== 'USD')
                    .map((c) => (
                      <option key={c} value={c}>
                        {CURRENCY_CONFIGS[c].flag} {c}
                      </option>
                    ))}
                </select>
              </div>
              <span className="text-[10px] text-slate-500 font-semibold">
                {splitLocalCurrency === 'VES' ? `T.C. BCV: ${bcvRate}` : `T.C.: ${params.exchangeRate}`}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="relative sm:col-span-1">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 font-bold text-xs">
                  {CURRENCY_CONFIGS[splitLocalCurrency].symbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={splitLocalAmount || ''}
                  onChange={(e) => setSplitLocalAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-2 py-1.5 text-sm font-bold rounded-lg border border-slate-300 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex space-x-1 sm:col-span-1">
                <button
                  type="button"
                  onClick={() => setSplitLocalChannel('cash')}
                  className={`flex-1 py-1 px-1 rounded-lg text-xs font-semibold border transition-all text-center ${
                    splitLocalChannel === 'cash'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold'
                      : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  💵 Efectivo
                </button>
                <button
                  type="button"
                  onClick={() => setSplitLocalChannel('bank_transfer')}
                  className={`flex-1 py-1 px-1 rounded-lg text-xs font-semibold border transition-all text-center ${
                    splitLocalChannel === 'bank_transfer'
                      ? 'border-blue-600 bg-blue-50 text-blue-800 font-bold'
                      : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  🏦 Depósito
                </button>
              </div>

              <div className="sm:col-span-1">
                <input
                  type="text"
                  value={splitReferenceNumber}
                  onChange={(e) => setSplitReferenceNumber(e.target.value)}
                  placeholder="N° Referencia / Depósito"
                  className="w-full px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Consolidado del Pago Mixto */}
          <div className="bg-emerald-900 text-white p-3 rounded-xl flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider block">
                Total Consolidado a Amortizar
              </span>
              <div className="text-base font-black">
                {formatCurrency(totalEffectiveAmount, params.currency)}
              </div>
              <p className="text-[10px] text-emerald-200">
                (${splitUsdAmount || 0} USD = {formatCurrency(splitCalculation.usdConverted, params.currency)}) + ({formatCurrency(splitLocalAmount || 0, splitLocalCurrency)} = {formatCurrency(splitCalculation.localConverted, params.currency)})
              </p>
            </div>
            <Receipt className="w-6 h-6 text-emerald-300 opacity-80" />
          </div>
        </div>
      )}

      {/* Quick Amount Suggestion Pills */}
      {targetInstallment && !isSplitMode && (
        <div className="flex flex-wrap gap-2 pt-0.5">
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
            className="w-full px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <p className="text-[11px] text-slate-500">
          Si la fecha supera los días de tolerancia de mora, se aplican automáticamente los intereses moratorios.
        </p>
      </div>

      {/* Prepayment Strategy */}
      <div className="space-y-1.5 pt-1">
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
            className={`p-2 text-left rounded-xl border text-xs transition-all ${
              prepaymentStrategy === 'reduce_installment'
                ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-bold'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div>Reducir Cuota</div>
            <span className="text-[10px] text-slate-500 font-normal block leading-tight">
              Disminuye las cuotas futuras calculando intereses sobre el saldo menor.
            </span>
          </button>
          <button
            type="button"
            onClick={() => setPrepaymentStrategy('reduce_term')}
            className={`p-2 text-left rounded-xl border text-xs transition-all ${
              prepaymentStrategy === 'reduce_term'
                ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-bold'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div>Reducir Plazo</div>
            <span className="text-[10px] text-slate-500 font-normal block leading-tight">
              Cancela cuotas finales de capital y elimina por completo sus intereses.
            </span>
          </button>
        </div>
      </div>

      {/* Microfinance Waterfall Explainer */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-600 space-y-1">
        <div className="font-bold text-slate-800 text-[11px] flex items-center">
          <Sparkles className="w-3.5 h-3.5 mr-1 text-blue-600" />
          Regla de Prelación de Pagos (Payment Waterfall):
        </div>
        <p className="text-[10px] text-slate-500">
          1° Mora &rarr; 2° Comisiones & Gastos &rarr; 3° Seguros &rarr; 4° Interés Compensatorio &rarr; 5° Capital Exigible &rarr; 6° Abono Extra a Saldo.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2 px-4 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 py-2 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center space-x-1.5"
        >
          <span>Confirmar Abono ({formatCurrency(totalEffectiveAmount, params.currency)})</span>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Simulador de Abonos & Pagos
              </h3>
              <p className="text-xs text-slate-500">
                Soporta pagos simples o combinados (USD + Moneda Local), efectivo o depósito bancario
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
