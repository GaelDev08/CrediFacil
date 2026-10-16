import React, { useState } from 'react';
import {
  Download,
  Printer,
  CreditCard,
  CheckCircle2,
} from 'lucide-react';
import { useCreditStore } from '../../store/useCreditStore';
import { CurrencyDisplay } from '../common/CurrencyDisplay';
import { StatusBadge } from '../common/Badge';

interface AmortizationTableProps {
  onOpenPaymentModal: (installmentNumber?: number) => void;
}

export const AmortizationTable: React.FC<AmortizationTableProps> = ({
  onOpenPaymentModal,
}) => {
  const { schedule, params, summary } = useCreditStore();
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'overdue'>('all');

  const filteredSchedule = schedule.filter((item) => {
    if (filter === 'unpaid') return item.status !== 'paid';
    if (filter === 'overdue') return item.status === 'overdue';
    return true;
  });

  // Export Amortization Table to CSV
  const handleExportCSV = () => {
    const headers = [
      'Cuota',
      'Fecha Vencimiento',
      'Saldo Inicial',
      'Amortizacion Capital',
      'Interes',
      'Seguro Desgravamen',
      'Comision Admin',
      'Cuota Total',
      'Mora',
      'Saldo Final',
      'Estado',
      'Monto Pagado',
    ];

    const rows = schedule.map((item) => [
      item.number,
      item.dueDate,
      item.beginningBalance.toFixed(2),
      item.principal.toFixed(2),
      item.interest.toFixed(2),
      item.insurance.toFixed(2),
      item.adminFee.toFixed(2),
      item.totalInstallment.toFixed(2),
      item.lateFee.toFixed(2),
      item.endingBalance.toFixed(2),
      item.status,
      item.amountPaid.toFixed(2),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Cronograma_CrediFacil_${params.method}_${params.principal}_${params.currency}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Table Top Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <span>Tabla de Amortización Completa</span>
            <span className="text-xs font-normal text-slate-500">
              ({schedule.length} cuotas generadas)
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Detalle cronológico de capital, intereses, comisiones y estado de cobranza
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Filters */}
          <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs font-semibold">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                filter === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter('unpaid')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                filter === 'unpaid'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pendientes
            </button>
            <button
              onClick={() => setFilter('overdue')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                filter === 'overdue'
                  ? 'bg-white text-rose-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Vencidas
            </button>
          </div>

          {/* Action buttons */}
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-sm"
            title="Exportar cronograma a CSV (Excel)"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-sm"
            title="Imprimir o guardar como PDF"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Imprimir</span>
          </button>

          <button
            onClick={() => onOpenPaymentModal()}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Simular Pago</span>
          </button>
        </div>
      </div>

      {/* Table responsive container */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 text-slate-700 border-b border-slate-200 uppercase font-bold tracking-wider text-[11px]">
              <th className="py-3 px-3.5 text-center">N°</th>
              <th className="py-3 px-3.5">Vencimiento</th>
              <th className="py-3 px-3.5 text-right">Saldo Inicial</th>
              <th className="py-3 px-3.5 text-right">Capital</th>
              <th className="py-3 px-3.5 text-right">Interés</th>
              <th className="py-3 px-3.5 text-right">Seguros/Cargos</th>
              <th className="py-3 px-3.5 text-right font-black text-slate-900 bg-slate-100/50">
                Cuota Total
              </th>
              <th className="py-3 px-3.5 text-right">Mora</th>
              <th className="py-3 px-3.5 text-right">Saldo Final</th>
              <th className="py-3 px-3.5 text-center">Estado</th>
              <th className="py-3 px-3.5 text-center">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredSchedule.map((item) => {
              const isOverdue = item.status === 'overdue';
              const isPaid = item.status === 'paid';
              const isGrace = item.isGracePeriod;

              return (
                <tr
                  key={item.number}
                  className={`hover:bg-blue-50/40 transition-colors ${
                    isOverdue
                      ? 'bg-rose-50/30'
                      : isGrace
                      ? 'bg-purple-50/20'
                      : isPaid
                      ? 'bg-emerald-50/20'
                      : ''
                  }`}
                >
                  <td className="py-3 px-3.5 text-center font-bold text-slate-900">
                    {item.number}
                  </td>
                  <td className="py-3 px-3.5 whitespace-nowrap font-medium text-slate-800">
                    {item.dueDate}
                  </td>
                  <td className="py-3 px-3.5 text-right font-medium text-slate-600">
                    <CurrencyDisplay amount={item.beginningBalance} />
                  </td>
                  <td className="py-3 px-3.5 text-right font-semibold text-blue-700">
                    <CurrencyDisplay amount={item.principal} />
                  </td>
                  <td className="py-3 px-3.5 text-right font-semibold text-emerald-700">
                    <CurrencyDisplay amount={item.interest} />
                  </td>
                  <td className="py-3 px-3.5 text-right font-medium text-slate-600">
                    <CurrencyDisplay amount={item.insurance + item.adminFee} />
                  </td>
                  <td className="py-3 px-3.5 text-right font-bold text-slate-900 bg-slate-100/40">
                    <CurrencyDisplay amount={item.totalInstallment} />
                  </td>
                  <td className="py-3 px-3.5 text-right font-bold">
                    {item.lateFee > 0 ? (
                      <span className="text-rose-600">
                        +<CurrencyDisplay amount={item.lateFee} className="inline" />
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="py-3 px-3.5 text-right font-medium text-slate-600">
                    <CurrencyDisplay amount={item.endingBalance} />
                  </td>
                  <td className="py-3 px-3.5 text-center">
                    <StatusBadge
                      status={item.status}
                      daysPastDue={item.daysPastDue}
                    />
                  </td>
                  <td className="py-3 px-3.5 text-center">
                    {!isPaid ? (
                      <button
                        onClick={() => onOpenPaymentModal(item.number)}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition-all border border-blue-200"
                        title="Simular pago para esta cuota"
                      >
                        Pagar
                      </button>
                    ) : (
                      <span className="inline-flex items-center text-emerald-600 text-[11px] font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Completado
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          {/* Table Footer Totals */}
          <tfoot>
            <tr className="bg-slate-100 text-slate-900 font-bold border-t-2 border-slate-300">
              <td colSpan={2} className="py-3 px-3.5 text-left uppercase text-[11px]">
                Totales Acumulados
              </td>
              <td className="py-3 px-3.5 text-right text-slate-500">-</td>
              <td className="py-3 px-3.5 text-right text-blue-700">
                <CurrencyDisplay amount={summary.totalPrincipal} />
              </td>
              <td className="py-3 px-3.5 text-right text-emerald-700">
                <CurrencyDisplay amount={summary.totalInterest} />
              </td>
              <td className="py-3 px-3.5 text-right text-slate-700">
                <CurrencyDisplay
                  amount={summary.totalInsurance + summary.totalAdminFee}
                />
              </td>
              <td className="py-3 px-3.5 text-right text-slate-900 bg-slate-200/50 text-sm font-black">
                <CurrencyDisplay amount={summary.totalRepayment} />
              </td>
              <td className="py-3 px-3.5 text-right text-rose-700">
                {summary.totalLateFees > 0 ? (
                  <CurrencyDisplay amount={summary.totalLateFees} />
                ) : (
                  '-'
                )}
              </td>
              <td className="py-3 px-3.5 text-right text-slate-900">0.00</td>
              <td colSpan={2} className="py-3 px-3.5 text-center text-slate-500">
                TCEA: {summary.tcea.toFixed(2)}%
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
