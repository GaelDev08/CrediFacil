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
      case 'interest_balance':
        return 'bg-purple-100 text-purple-800 border-purple-200';
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                        Método base de comparación
                      </span>
                    ) : (
                      <div
                        className={`text-[11px] font-bold flex items-center ${
                          isSavings ? 'text-emerald-600' : 'text-amber-600'
                        }`}
                      >
                        {isSavings && <TrendingDown className="w-3.5 h-3.5 mr-1" />}
                        <span>
                          {isSavings ? 'Ahorro' : 'Costo extra'}:{' '}
                          <CurrencyDisplay amount={Math.abs(item.differenceVsFrench)} />
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {!isCurrent && (
                <button
                  onClick={() => setLoanParam('method', item.method)}
                  className="mt-4 w-full py-1.5 px-3 bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 rounded-lg text-xs font-bold transition-colors flex items-center justify-center space-x-1"
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
