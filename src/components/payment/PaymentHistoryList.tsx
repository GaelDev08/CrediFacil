import React from 'react';
import { History, Trash2 } from 'lucide-react';
import { useCreditStore } from '../../store/useCreditStore';
import { formatCurrency, CURRENCY_CONFIGS } from '../../engine/currency';

export const PaymentHistoryList: React.FC = () => {
  const { payments, resetPayments, params } = useCreditStore();

  if (payments.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <History className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-800">
          Sin Pagos Simulados Aún
        </h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Utiliza el botón "Simular Pago" en la tabla de amortización para registrar abonos parciales, puntuales, tardíos con mora o adelanto de cuotas.
        </p>
      </div>
    );
  }

  const loanSymbol = CURRENCY_CONFIGS[params.currency].symbol;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Historial de Pagos Simulados
            </h4>
            <p className="text-xs text-slate-500">
              {payments.length} transacción(es) registrada(s) con aplicación de prelación bancaria
            </p>
          </div>
        </div>

        <button
          onClick={resetPayments}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors border border-rose-200"
          title="Eliminar todos los pagos y restaurar cronograma original"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Restablecer Pagos</span>
        </button>
      </div>

      <div className="space-y-3">
        {payments.map((p, index) => (
          <div
            key={p.id}
            className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors text-xs space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">
                  {index + 1}
                </span>
                <span className="font-bold text-slate-900">
                  {p.paymentDate}
                </span>
                {p.targetInstallmentNumber && (
                  <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                    Cuota #{p.targetInstallmentNumber}
                  </span>
                )}
                {/* Canal y Referencia */}
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                    p.channel === 'cash'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}
                >
                  {p.channel === 'cash' ? '💵 Efectivo' : '🏦 Depósito'}
                  {p.referenceNumber ? ` (${p.referenceNumber})` : ''}
                </span>
                {p.isSplitPayment && (
                  <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                    ⚡ Pago Mixto
                  </span>
                )}
              </div>
              <div className="text-sm font-black text-slate-900">
                {formatCurrency(p.amount, p.currency)}
                {p.currency !== params.currency && (
                  <span className="text-xs text-slate-500 font-normal ml-1">
                    (≈ {loanSymbol} {p.convertedAmount.toFixed(2)})
                  </span>
                )}
              </div>
            </div>

            {/* Si es un pago mixto, mostrar desglose visual de ambos tramos */}
            {p.isSplitPayment && p.splitDetails && (
              <div className="bg-white p-2 rounded-lg border border-slate-200 text-[11px] text-slate-700 flex flex-wrap items-center justify-between gap-1.5">
                <div>
                  <span className="font-bold text-slate-900">Tramo USD: </span>
                  ${p.splitDetails.usdAmount.toFixed(2)} USD ({p.splitDetails.usdChannel === 'cash' ? 'Efectivo' : 'Depósito'})
                </div>
                <div>
                  <span className="font-bold text-slate-900">Tramo Local: </span>
                  {CURRENCY_CONFIGS[p.splitDetails.localCurrency]?.symbol} {p.splitDetails.localAmount.toFixed(2)} {p.splitDetails.localCurrency} ({p.splitDetails.localChannel === 'cash' ? 'Efectivo' : 'Depósito'})
                </div>
                {p.splitDetails.referenceNumber && (
                  <div className="text-slate-500 font-medium">
                    Ref: {p.splitDetails.referenceNumber}
                  </div>
                )}
              </div>
            )}

            {/* Waterfall breakdown badges */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {p.allocation.lateFeePaid > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">
                  Mora: {loanSymbol} {p.allocation.lateFeePaid.toFixed(2)}
                </span>
              )}
              {p.allocation.insurancePaid > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">
                  Seguro: {loanSymbol} {p.allocation.insurancePaid.toFixed(2)}
                </span>
              )}
              {p.allocation.adminFeePaid > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-200 text-slate-800 text-[10px] font-bold">
                  Comisión: {loanSymbol} {p.allocation.adminFeePaid.toFixed(2)}
                </span>
              )}
              {p.allocation.interestPaid > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Interés: {loanSymbol} {p.allocation.interestPaid.toFixed(2)}
                </span>
              )}
              {p.allocation.principalPaid > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                  Capital: {loanSymbol} {p.allocation.principalPaid.toFixed(2)}
                </span>
              )}
              {p.allocation.extraPrepayment > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                  Prepago Extra: {loanSymbol} {p.allocation.extraPrepayment.toFixed(2)}
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-600 italic">
              {p.impactSummary}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
