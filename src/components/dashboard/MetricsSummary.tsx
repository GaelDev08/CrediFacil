import React from 'react';
import {
  DollarSign,
  TrendingUp,
  Percent,
  Calendar,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { useCreditStore } from '../../store/useCreditStore';
import { CurrencyDisplay } from '../common/CurrencyDisplay';
import { round } from '../../engine/formulas';
import { CURRENCY_CONFIGS } from '../../engine/currency';

export const MetricsSummary: React.FC = () => {
  const { summary, params, displayCurrency, setDisplayCurrency } = useCreditStore();

  const totalPrincipal = params.principal;
  const repaymentRatio =
    totalPrincipal > 0
      ? round((summary.totalRepayment / totalPrincipal - 1) * 100, 1)
      : 0;

  const paidRatio =
    summary.totalRepayment > 0
      ? Math.min(100, round((summary.totalPaid / summary.totalRepayment) * 100, 1))
      : 0;

  const isDualCurrency = params.currency !== displayCurrency;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Banner de Moneda Dual / Contravalor */}
      {isDualCurrency && (
        <div className="col-span-2 lg:col-span-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-md border border-blue-700/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 rounded-xl text-blue-300 font-bold text-lg">
              💱
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-300">
                Visualización Multimoneda Activa
              </p>
              <p className="text-sm text-slate-100 font-medium">
                Crédito otorgado en <strong className="text-white">{params.currency}</strong> ({CURRENCY_CONFIGS[params.currency]?.name}) —
                Visualizando cuotas y métricas en <strong className="text-emerald-300">{displayCurrency}</strong> al T.C. oficial.
              </p>
            </div>
          </div>
          <button
            onClick={() => setDisplayCurrency(params.currency)}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-semibold text-white transition-all shadow-sm hover:scale-105"
          >
            Ver en Moneda Original ({params.currency})
          </button>
        </div>
      )}

      {/* Total Repayment Card */}
      <div className="bg-gradient-to-br from-blue-900 to-indigo-900 rounded-2xl p-4 sm:p-5 text-white shadow-md shadow-blue-950/20 col-span-2 sm:col-span-1">
        <div className="flex items-center justify-between text-blue-200 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">
            Total a Devolver
          </span>
          <div className="p-1.5 bg-blue-800/60 rounded-lg">
            <DollarSign className="w-4 h-4 text-blue-300" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-black tracking-tight">
          <CurrencyDisplay amount={summary.totalRepayment} showEquivalent />
        </div>
        <div className="mt-2.5 flex items-center text-xs text-blue-200">
          <span className="bg-blue-800/80 px-2 py-0.5 rounded font-semibold text-emerald-300 mr-2">
            +{repaymentRatio}% sobre capital
          </span>
        </div>
      </div>

      {/* Total Interest Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">
            Total Intereses
          </span>
          <div className="p-1.5 bg-emerald-50 rounded-lg">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          <CurrencyDisplay amount={summary.totalInterest} showEquivalent />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Costo financiero puro del préstamo
        </p>
      </div>

      {/* Initial / Average Installment */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">
            {params.method === 'german' ? 'Primera Cuota' : 'Cuota Periódica'}
          </span>
          <div className="p-1.5 bg-indigo-50 rounded-lg">
            <Calendar className="w-4 h-4 text-indigo-600" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          <CurrencyDisplay amount={summary.initialInstallment} showEquivalent />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {params.method === 'german'
            ? `Última cuota: ${summary.finalInstallment.toFixed(2)}`
            : `${params.term} cuotas iguales`}
        </p>
      </div>

      {/* TCEA / Costo Financiero Total */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">
            TCEA (Costo Efectivo)
          </span>
          <div className="p-1.5 bg-amber-50 rounded-lg">
            <Percent className="w-4 h-4 text-amber-600" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          {summary.tcea > 0 ? `${summary.tcea.toFixed(2)}%` : `${params.interestRate}%`}
        </div>
        <div className="mt-2 flex items-center space-x-1.5">
          <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            TIR Anualizada
          </span>
          <span className="text-[11px] text-slate-400">Incluye seguros</span>
        </div>
      </div>

      {/* Repayment Progress and Mora Alert Banner (if payments or late fees occur) */}
      {(summary.totalPaid > 0 || summary.totalLateFees > 0) && (
        <div className="col-span-2 lg:col-span-4 bg-slate-900 text-white rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Progreso de Amortización</p>
              <p className="text-sm font-bold text-white">
                Pagado: <CurrencyDisplay amount={summary.totalPaid} showEquivalent /> de{' '}
                <CurrencyDisplay amount={summary.totalRepayment + summary.totalLateFees} showEquivalent />
              </p>
            </div>
          </div>

          <div className="w-full sm:w-1/3">
            <div className="flex justify-between text-xs mb-1 font-semibold">
              <span className="text-slate-400">Amortizado</span>
              <span className="text-emerald-400">{paidRatio}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${paidRatio}%` }}
              ></div>
            </div>
          </div>

          {summary.totalLateFees > 0 && (
            <div className="flex items-center space-x-2 bg-rose-500/20 border border-rose-500/40 px-3 py-1.5 rounded-xl text-rose-300 text-xs font-bold">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>
                Mora Acumulada: <CurrencyDisplay amount={summary.totalLateFees} />
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
