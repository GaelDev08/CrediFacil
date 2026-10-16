import React from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useCreditStore } from '../../store/useCreditStore';
import { CURRENCY_CONFIGS } from '../../engine/currency';

export const AmortizationCharts: React.FC = () => {
  const { schedule, params, displayCurrency } = useCreditStore();
  const currentSymbol = CURRENCY_CONFIGS[displayCurrency].symbol;

  const chartData = schedule.map((item) => ({
    name: `C${item.number}`,
    periodNumber: item.number,
    dueDate: item.dueDate,
    capital: item.principal,
    interes: item.interest,
    seguros: item.insurance + item.adminFee,
    cuotaTotal: item.totalInstallment,
    saldoDeudor: item.endingBalance,
  }));

  const customTooltipFormatter = (value: any, name: any) => {
    const num = Number(value) || 0;
    const labels: Record<string, string> = {
      capital: 'Capital Amortizado',
      interes: 'Interés Compensatorio',
      seguros: 'Seguros y Gastos',
      cuotaTotal: 'Cuota Total',
      saldoDeudor: 'Saldo Pendiente',
    };
    return [`${currentSymbol} ${num.toFixed(2)}`, labels[name] || name];
  };

  return (
    <div className="space-y-6">
      {/* Chart 1: Debt Balance Evolution */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Evolución del Saldo Deudor
            </h4>
            <p className="text-xs text-slate-500">
              Trayectoria de amortización de capital a lo largo de las {params.term} cuotas
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
            {params.method === 'french'
              ? 'Sistema Francés'
              : params.method === 'german'
              ? 'Sistema Alemán'
              : 'Tasa Plana'}
          </span>
        </div>

        <div className="h-64 sm:h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(val) => `${val}`} />
              <Tooltip formatter={customTooltipFormatter} />
              <Area
                type="monotone"
                dataKey="saldoDeudor"
                stroke="#2563eb"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#balanceGrad)"
                name="saldoDeudor"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Stacked Installment Composition */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
        <div>
          <h4 className="text-sm font-bold text-slate-900">
            Composición de la Cuota por Período
          </h4>
          <p className="text-xs text-slate-500">
            Distribución proporcional entre Capital (amortización), Interés y Gastos/Seguros
          </p>
        </div>

        <div className="h-64 sm:h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip formatter={customTooltipFormatter} />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                formatter={(val) => {
                  const map: Record<string, string> = {
                    capital: 'Capital',
                    interes: 'Interés',
                    seguros: 'Seguros y Cargos',
                  };
                  return map[val] || val;
                }}
              />
              <Bar dataKey="capital" stackId="a" fill="#2563eb" radius={[0, 0, 0, 0]} />
              <Bar dataKey="interes" stackId="a" fill="#10b981" />
              <Bar dataKey="seguros" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
