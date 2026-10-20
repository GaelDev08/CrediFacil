import React from 'react';
import {
  Calculator,
  Sliders,
  ChevronDown,
  ChevronUp,
  Percent,
  Clock,
} from 'lucide-react';
import { useCreditStore } from '../../store/useCreditStore';
import { CURRENCY_CONFIGS, formatCurrency } from '../../engine/currency';
import { calculatePeriodicRate, round } from '../../engine/formulas';
import type {
  AmortizationMethod,
  Currency,
  GracePeriodType,
  PaymentFrequency,
  RateType,
} from '../../types';

export const LoanForm: React.FC = () => {
  const {
    params,
    setLoanParam,
    isAdvancedOpen,
    setIsAdvancedOpen,
    summary,
    displayCurrency,
    setDisplayCurrency,
  } = useCreditStore();

  const periodicRateDecimal = calculatePeriodicRate(
    params.interestRate,
    params.rateType,
    params.frequency
  );
  const periodicRatePercent = round(periodicRateDecimal * 100, 3);

  const methods: { id: AmortizationMethod; title: string; subtitle: string }[] = [
    {
      id: 'french',
      title: 'Francesa',
      subtitle: 'Cuota fija periódica',
    },
    {
      id: 'german',
      title: 'Alemana',
      subtitle: 'Amortización de capital constante',
    },
    {
      id: 'interest_balance',
      title: 'Interés sobre Saldo',
      subtitle: 'Interés sobre saldo insoluto y recálculo con pagos de más',
    },
    {
      id: 'flat',
      title: 'Tasa Plana',
      subtitle: 'Interés simple fijo',
    },
  ];

  const frequencies: { id: PaymentFrequency; label: string; sub: string }[] = [
    { id: 'annual', label: 'Anual', sub: '360d' },
    { id: 'monthly', label: 'Mensual', sub: '30d' },
    { id: 'biweekly', label: 'Quincenal', sub: '15d' },
    { id: 'weekly', label: 'Semanal', sub: '7d' },
    { id: 'daily', label: 'Diario', sub: '1d' },
  ];

  const rateTypes: { id: RateType; label: string; desc: string }[] = [
    { id: 'TEA', label: 'TEA', desc: 'Efectiva Anual' },
    { id: 'TEM', label: 'TEM', desc: 'Efectiva Mensual' },
    { id: 'TNA', label: 'TNA', desc: 'Nominal Anual' },
  ];

  const currentCurrency = CURRENCY_CONFIGS[params.currency];
  const currencies: Currency[] = ['PEN', 'USD', 'MXN', 'COP', 'VES'];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Configuración del Crédito</h2>
            <p className="text-xs text-slate-500">
              Moneda base: <span className="font-semibold text-slate-800">{currentCurrency.name} ({params.currency})</span>
            </p>
          </div>
        </div>

        {/* Selector de Moneda del Crédito (Desembolso y Contrato) */}
        <div className="flex flex-col items-end space-y-1">
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg">
            {currencies.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setLoanParam('currency', c)}
                className={`px-2 py-1 text-xs font-bold rounded-md transition-all ${
                  params.currency === c
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title={`Configurar y desembolsar crédito en ${CURRENCY_CONFIGS[c].name}`}
              >
                {CURRENCY_CONFIGS[c].flag} {c}
              </button>
            ))}
          </div>
          {params.currency !== displayCurrency && (
            <button
              type="button"
              onClick={() => setDisplayCurrency(params.currency)}
              className="text-[10px] text-blue-600 hover:underline font-semibold"
            >
              Restablecer visualización a {params.currency}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Principal / Capital */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            Monto a Prestar (Capital)
          </label>
          <div className="relative rounded-xl shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <span className="text-slate-500 font-bold text-sm">
                {currentCurrency.symbol}
              </span>
            </div>
            <input
              type="number"
              min="100"
              step="500"
              value={params.principal || ''}
              onChange={(e) => setLoanParam('principal', parseFloat(e.target.value) || 0)}
              className="block w-full pl-10 pr-3 py-2.5 text-base font-bold text-slate-900 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="10000"
            />
          </div>
          <div className="flex gap-1.5 pt-1">
            {[1000, 5000, 10000, 25000, 50000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setLoanParam('principal', amt)}
                className="text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded transition-colors"
              >
                +{amt.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* Interest Rate & Rate Type */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-700">
              Tasa de Interés
            </label>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              Tasa periódica: {periodicRatePercent}%
            </span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            <div className="col-span-3 relative rounded-xl shadow-sm">
              <input
                type="number"
                min="0"
                step="0.1"
                value={params.interestRate || ''}
                onChange={(e) => setLoanParam('interestRate', parseFloat(e.target.value) || 0)}
                className="block w-full px-3 py-2.5 text-base font-bold text-slate-900 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="24"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Percent className="w-4 h-4 text-slate-400" />
              </div>
            </div>
            <div className="col-span-2 flex bg-slate-100 p-1 rounded-xl">
              {rateTypes.map((rt) => (
                <button
                  key={rt.id}
                  type="button"
                  onClick={() => setLoanParam('rateType', rt.id)}
                  className={`flex-1 text-xs font-bold py-1.5 rounded-lg transition-all ${
                    params.rateType === rt.id
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title={rt.desc}
                >
                  {rt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Term & Frequency */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-700">
              Plazo (Número de Cuotas)
            </label>
            <span className="text-xs font-bold text-blue-600">
              {params.term} cuotas
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <input
              type="range"
              min="1"
              max="60"
              value={params.term}
              onChange={(e) => setLoanParam('term', parseInt(e.target.value) || 1)}
              className="col-span-3 accent-blue-600 h-2 my-auto bg-slate-200 rounded-lg cursor-pointer"
            />
            <input
              type="number"
              min="1"
              max="120"
              value={params.term}
              onChange={(e) => setLoanParam('term', parseInt(e.target.value) || 1)}
              className="col-span-1 text-center font-bold py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Payment Frequency */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-700">
              Frecuencia de Pago
            </label>
            <span className="text-[11px] font-semibold text-blue-600">
              {frequencies.find((f) => f.id === params.frequency)?.label} ({frequencies.find((f) => f.id === params.frequency)?.sub})
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
            {frequencies.map((freq) => (
              <button
                key={freq.id}
                type="button"
                onClick={() => setLoanParam('frequency', freq.id)}
                className={`py-2 px-1 rounded-xl text-center border transition-all ${
                  params.frequency === freq.id
                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-500 font-bold'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs font-bold leading-tight">{freq.label}</div>
                <div
                  className={`text-[10px] mt-0.5 ${
                    params.frequency === freq.id ? 'text-blue-600 font-semibold' : 'text-slate-400'
                  }`}
                >
                  {freq.sub}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Amortization Method Selector */}
      <div className="space-y-2 pt-1">
        <label className="block text-xs font-semibold text-slate-700">
          Método de Amortización
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {methods.map((m) => {
            const isSelected = params.method === m.id;
            return (
              <div
                key={m.id}
                onClick={() => setLoanParam('method', m.id)}
                className={`cursor-pointer p-3 rounded-xl border-2 transition-all relative ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/70 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                    {m.title}
                  </span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{m.subtitle}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grace Period Configuration */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-bold text-slate-900">Período de Gracia</span>
          </div>
          <span className="text-[11px] text-slate-500">
            {params.gracePeriods > 0
              ? `${params.gracePeriods} cuotas en gracia`
              : 'Sin período de gracia'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(
            [
              { id: 'none', label: 'Sin Gracia', desc: 'Amortiza desde cuota 1' },
              { id: 'partial', label: 'Gracia Parcial', desc: 'Paga sólo intereses' },
              { id: 'total', label: 'Gracia Total', desc: 'Intereses capitalizan' },
            ] as { id: GracePeriodType; label: string; desc: string }[]
          ).map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => {
                setLoanParam('graceType', g.id);
                if (g.id !== 'none' && params.gracePeriods === 0) {
                  setLoanParam('gracePeriods', 2);
                }
                if (g.id === 'none') {
                  setLoanParam('gracePeriods', 0);
                }
              }}
              className={`p-2.5 text-left rounded-lg border transition-all text-xs ${
                params.graceType === g.id
                  ? 'border-purple-600 bg-purple-50/70 text-purple-950 font-semibold'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="font-bold">{g.label}</div>
              <div className="text-[11px] text-slate-500">{g.desc}</div>
            </button>
          ))}
        </div>

        {params.graceType !== 'none' && (
          <div className="flex items-center space-x-3 pt-2">
            <label className="text-xs font-medium text-slate-700">
              Número de cuotas de gracia:
            </label>
            <input
              type="number"
              min="1"
              max={Math.max(1, params.term - 1)}
              value={params.gracePeriods}
              onChange={(e) => setLoanParam('gracePeriods', parseInt(e.target.value) || 1)}
              className="w-20 text-center font-bold py-1 px-2 rounded-lg border border-purple-300 text-xs focus:ring-2 focus:ring-purple-500"
            />
          </div>
        )}
      </div>

      {/* Advanced Parameters Toggle */}
      <div>
        <button
          type="button"
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          className="flex items-center justify-between w-full py-2.5 px-3 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-blue-600" />
            <span>Gastos de Desembolso, Comisiones Administrativas y Validación de Mora</span>
          </div>
          {isAdvancedOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {isAdvancedOpen && (
          <div className="mt-3 p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* Gastos de Desembolso (%) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    Gastos de Desembolso (%)
                  </label>
                  <span className="text-[10px] text-blue-600 font-medium">Comisión inicial</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="30"
                    value={params.disbursementFeePercent || ''}
                    onChange={(e) =>
                      setLoanParam('disbursementFeePercent', parseFloat(e.target.value) || 0)
                    }
                    placeholder="0"
                    className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 bg-white"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400">%</span>
                </div>
                {params.disbursementFeePercent && params.disbursementFeePercent > 0 ? (
                  <p className="text-[11px] text-amber-700 font-semibold bg-amber-50 p-1.5 rounded border border-amber-200/60">
                    Deducción: {formatCurrency(summary.disbursementFee, params.currency)} | Neto: {formatCurrency(summary.netDisbursement, params.currency)}
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-500">
                    Si es 0%, se desembolsa el 100% y aplica cálculo normal.
                  </p>
                )}
              </div>

              {/* Gastos Administrativos (% o Fijo) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    Gastos Administrativos
                  </label>
                  <div className="inline-flex rounded bg-slate-200 p-0.5 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setLoanParam('adminFeeType', 'percentage')}
                      className={`px-1.5 py-0.5 rounded ${
                        params.adminFeeType === 'percentage'
                          ? 'bg-white text-blue-700 shadow-xs'
                          : 'text-slate-600'
                      }`}
                    >
                      % Saldo
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoanParam('adminFeeType', 'fixed')}
                      className={`px-1.5 py-0.5 rounded ${
                        params.adminFeeType !== 'percentage'
                          ? 'bg-white text-blue-700 shadow-xs'
                          : 'text-slate-600'
                      }`}
                    >
                      Fijo
                    </button>
                  </div>
                </div>

                {params.adminFeeType === 'percentage' ? (
                  <div className="relative">
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      value={params.adminFeePercent || ''}
                      onChange={(e) =>
                        setLoanParam('adminFeePercent', parseFloat(e.target.value) || 0)
                      }
                      placeholder="0"
                      className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 bg-white"
                    />
                    <span className="absolute right-3 top-2 text-xs text-slate-400">% período</span>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={params.adminFee || ''}
                      onChange={(e) =>
                        setLoanParam('adminFee', parseFloat(e.target.value) || 0)
                      }
                      placeholder="0"
                      className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 bg-white"
                    />
                    <span className="absolute right-3 top-2 text-xs text-slate-400">
                      {currentCurrency.symbol}
                    </span>
                  </div>
                )}
                <p className="text-[10px] text-slate-500">
                  {params.adminFeeType === 'percentage'
                    ? '% sobre saldo deudor. Si es 0%, cálculo normal.'
                    : 'Monto fijo por cuota emitida. Si es 0, cálculo normal.'}
                </p>
              </div>

              {/* Seguro Desgravamen */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Seguro Desgravamen (% mensual)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={params.desgravamenRate || ''}
                    onChange={(e) =>
                      setLoanParam('desgravamenRate', parseFloat(e.target.value) || 0)
                    }
                    placeholder="0"
                    className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 bg-white"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400">%</span>
                </div>
                <p className="text-[10px] text-slate-500">Calculado sobre saldo insoluto</p>
              </div>

              {/* Tasa Moratoria Diaria */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Interés Moratorio Diario (% diario)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={params.dailyLateRate}
                    onChange={(e) =>
                      setLoanParam('dailyLateRate', parseFloat(e.target.value) || 0)
                    }
                    className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 bg-white"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400">% / día</span>
                </div>
                <p className="text-[10px] text-slate-500">Aplica sobre capital vencido tras tolerancia</p>
              </div>

              {/* Fixed Late Penalty */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Comisión Fija de Gestión de Mora
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={params.fixedLateFee}
                    onChange={(e) =>
                      setLoanParam('fixedLateFee', parseFloat(e.target.value) || 0)
                    }
                    className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 bg-white"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400">
                    {currentCurrency.symbol}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">Cobro único de cobranza por cuota vencida</p>
              </div>

              {/* Grace Days for Late Fees */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Días de Tolerancia de Mora
                </label>
                <input
                  type="number"
                  min="0"
                  max="15"
                  value={params.graceDaysLate}
                  onChange={(e) =>
                    setLoanParam('graceDaysLate', parseInt(e.target.value) || 0)
                  }
                  className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 bg-white"
                />
                <p className="text-[10px] text-slate-500">Días sin cobro de mora después del vencimiento</p>
              </div>

              {/* Disbursement Date */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Fecha de Desembolso
                </label>
                <input
                  type="date"
                  value={params.disbursementDate}
                  onChange={(e) => setLoanParam('disbursementDate', e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white"
                />
                <p className="text-[10px] text-slate-500">Fecha de entrega del dinero</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
