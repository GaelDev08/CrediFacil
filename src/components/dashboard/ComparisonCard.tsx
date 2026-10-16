import React from 'react';
import { Layers, ArrowRight, Check, TrendingDown } from 'lucide-react';
import { useCreditStore } from '../../store/useCreditStore';
import { CurrencyDisplay } from '../common/CurrencyDisplay';
import type { AmortizationMethod } from '../../types';

export const ComparisonCard: React.FC = () => {
  const { comparison, params, setLoanParam } = useCreditStore();

  const getMethodBadge = (m: AmortizationMethod) => {
    switch (m) {
      case 'french':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'german':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'flat':
        return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Comparativa de Métodos de Amortización
            </h3>
            <p className="text-xs text-slate-500">
              Evaluación simultánea para el mismo capital ({params.principal}) y plazo ({params.term} cuotas)
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {comparison.map((item) => {
          const isCurrent = params.method === item.method;
          const isSavings = item.differenceVsFrench < 0;

          return (
            <div
              key={item.method}
              className={`rounded-xl p-4 border-2 transition-all flex flex-col justify-between ${
                isCurrent
                  ? 'border-blue-600 bg-blue-50/40 shadow-sm ring-1 ring-blue-600/30'
                  : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getMethodBadge(
                      item.method
                    )}`}
                  >
                    {item.name}
                  </span>
                  {isCurrent && (
                    <span className="flex items-center text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                      <Check className="w-3 h-3 mr-1" /> Activo
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                    <span className="text-slate-600">Total Intereses:</span>
                    <span className="font-bold text-slate-900">
                      <CurrencyDisplay amount={item.totalInterest} />
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                    <span className="text-slate-600">Total a Devolver:</span>
                    <span className="font-bold text-slate-900">
                      <CurrencyDisplay amount={item.totalRepayment} />
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                    <span className="text-slate-600">Cuota Inicial:</span>
                    <span className="font-semibold text-slate-800">
                      <CurrencyDisplay amount={item.initialInstallment} />
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                    <span className="text-slate-600">Cuota Final:</span>
                    <span className="font-semibold text-slate-800">
                      <CurrencyDisplay amount={item.finalInstallment} />
                    </span>
                  </div>

                  <div className="pt-2">
                    {item.method === 'french' ? (
                      <span className="text-[11px] font-medium text-slate-500">
                        Base de comparación (cuotas constantes)
                      </span>
                    ) : isSavings ? (
                      <span className="inline-flex items-center text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <TrendingDown className="w-3 h-3 mr-1" />
                        Ahorras <CurrencyDisplay amount={Math.abs(item.differenceVsFrench)} className="ml-1 inline" /> en intereses
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        +<CurrencyDisplay amount={item.differenceVsFrench} className="mx-1 inline" /> más en intereses
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {!isCurrent && (
                <button
                  type="button"
                  onClick={() => setLoanParam('method', item.method)}
                  className="mt-4 w-full py-2 px-3 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors flex items-center justify-center space-x-1.5"
                >
                  <span>Seleccionar método</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
