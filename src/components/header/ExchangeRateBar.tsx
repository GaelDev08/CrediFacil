import React from 'react';
import { ArrowLeftRight, Calendar, Globe2 } from 'lucide-react';
import { useCreditStore } from '../../store/useCreditStore';
import { CURRENCY_CONFIGS } from '../../engine/currency';
import type { Currency } from '../../types';

export const ExchangeRateBar: React.FC = () => {
  const {
    params,
    setExchangeRate,
    displayCurrency,
    setDisplayCurrency,
    evaluationDate,
    setEvaluationDate,
    payments,
  } = useCreditStore();

  const currencies: Currency[] = ['PEN', 'USD', 'MXN', 'COP'];

  return (
    <div className="w-full bg-slate-900 text-slate-100 border-b border-slate-800 text-xs py-2 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left side: Exchange Rate Config */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex items-center space-x-2">
            <span className="flex items-center text-emerald-400 font-semibold tracking-wide">
              <ArrowLeftRight className="w-3.5 h-3.5 mr-1 text-emerald-400 animate-pulse" />
              Tipo de Cambio:
            </span>
            <div className="flex items-center bg-slate-800 rounded-md px-2 py-1 border border-slate-700">
              <span className="text-slate-400 mr-1.5 font-medium">1 USD =</span>
              <span className="text-slate-300 font-bold mr-1">S/.</span>
              <input
                type="number"
                step="0.01"
                min="0.1"
                value={params.exchangeRate}
                onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 3.75)}
                className="w-16 bg-transparent text-white font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
                title="Modificar tipo de cambio oficial para conversión de divisas"
              />
            </div>
          </div>

          {/* Currency View Switcher */}
          <div className="flex items-center space-x-2">
            <span className="flex items-center text-slate-400 font-medium">
              <Globe2 className="w-3.5 h-3.5 mr-1 text-blue-400" />
              Visualizar en:
            </span>
            <div className="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
              {currencies.map((curr) => {
                const conf = CURRENCY_CONFIGS[curr];
                const isActive = displayCurrency === curr;
                return (
                  <button
                    key={curr}
                    onClick={() => setDisplayCurrency(curr)}
                    className={`px-2.5 py-0.5 rounded-md font-medium text-xs transition-colors flex items-center space-x-1 ${
                      isActive
                        ? 'bg-blue-600 text-white font-bold shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>{conf.flag}</span>
                    <span>{curr}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right side: Simulation Date & Status info */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400 font-medium">Fecha de Corte:</span>
            <input
              type="date"
              value={evaluationDate}
              onChange={(e) => setEvaluationDate(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
              title="Cambiar fecha para evaluar morosidad y cálculo de mora"
            />
          </div>

          {payments.length > 0 && (
            <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
              {payments.length} pago(s) simulado(s)
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
