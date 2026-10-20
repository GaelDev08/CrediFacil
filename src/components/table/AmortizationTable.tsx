import React, { useState } from 'react';
import {
  Download,
  Printer,
  CreditCard,
  CheckCircle2,
  Info,
  X,
  ShieldAlert,
  Maximize2,
  Minimize2,
  FileSpreadsheet,
} from 'lucide-react';
import { useCreditStore } from '../../store/useCreditStore';
import { CurrencyDisplay } from '../common/CurrencyDisplay';
import { StatusBadge } from '../common/Badge';
import { formatCurrency, CURRENCY_CONFIGS } from '../../engine/currency';
import { calculateLateFee, type LateFeeCalculationResult } from '../../engine/lateFees';
import { exportToExcelFile, exportToCSVFile } from '../../utils/reportExporter';
import type { Installment } from '../../types';

const currentYear = new Date().getFullYear();
const currentFormattedDate = new Date().toLocaleString('es-LA');

interface AmortizationTableProps {
  onOpenPaymentModal: (installmentNumber?: number) => void;
}

export const AmortizationTable: React.FC<AmortizationTableProps> = ({
  onOpenPaymentModal,
}) => {
  const {
    schedule,
    params,
    summary,
    evaluationDate,
    isTableExpanded,
    toggleTableExpanded,
  } = useCreditStore();
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'overdue'>('all');
  const [selectedLateFeeInfo, setSelectedLateFeeInfo] = useState<{
    installment: Installment;
    calculation: LateFeeCalculationResult;
  } | null>(null);

  const filteredSchedule = schedule.filter((item) => {
    if (filter === 'unpaid') return item.status !== 'paid';
    if (filter === 'overdue') return item.status === 'overdue';
    return true;
  });

  const getMethodTitle = (method: string) => {
    switch (method) {
      case 'french':
        return 'Francesa (Cuota Fija)';
      case 'german':
        return 'Alemana (Capital Fijo)';
      case 'interest_balance':
        return 'Interés sobre Saldo Deudor';
      case 'flat':
        return 'Tasa Plana (Interés Simple)';
      default:
        return method;
    }
  };

  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case 'monthly':
        return 'Mensual';
      case 'biweekly':
        return 'Quincenal';
      case 'weekly':
        return 'Semanal';
      default:
        return freq;
    }
  };

  const handleExportExcel = () => {
    exportToExcelFile(params, summary, schedule);
  };

  const handleExportCSV = () => {
    exportToCSVFile(params, summary, schedule, ';');
  };

  const handlePrint = () => {
    window.print();
  };

  const openLateFeeModal = (item: Installment) => {
    const calc = calculateLateFee(
      item.dueDate,
      evaluationDate,
      item.principal + item.interest,
      params.dailyLateRate,
      params.fixedLateFee,
      params.graceDaysLate
    );
    setSelectedLateFeeInfo({ installment: item, calculation: calc });
  };

  return (
    <>
      {/* ============================================================== */}
      {/* 1. VISTA DE PANTALLA: Tabla Interactiva con Toolbar y Filtros */}
      {/* ============================================================== */}
      <div className="no-print bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Top Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <span>Tabla de Amortización Limpia</span>
              <span className="text-xs font-normal text-slate-500">
                ({schedule.length} cuotas generadas)
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cronograma detallado con desglose de capital, intereses, comisiones y validación de mora
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
              onClick={toggleTableExpanded}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-sm"
              title={isTableExpanded ? "Volver a vista dividida con formulario al lado" : "Expandir tabla a pantalla completa sin desplazamiento"}
            >
              {isTableExpanded ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-blue-600" />
                  <span className="hidden sm:inline">Vista Dividida</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
                  <span className="hidden sm:inline">Vista Completa</span>
                </>
              )}
            </button>

            {/* Exportar a Excel Formateado (.xls) */}
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition-colors shadow-sm"
              title="Descargar Reporte Ejecutivo Oficial para Microsoft Excel (con formato, celdas de moneda, colores y totales)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Reporte Excel</span>
            </button>

            {/* Exportar a CSV Estructurado (.csv) */}
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-sm"
              title="Descargar Reporte CSV delimitado por punto y coma (nativo para Excel en español)"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Reporte CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-sm"
              title="Imprimir solo datos generales del crédito y la tabla de amortización limpia"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Imprimir</span>
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
              <tr className="bg-slate-50/90 text-slate-700 border-b border-slate-200 uppercase font-bold tracking-wider text-[11px]">
                <th className="py-2.5 px-3 text-center">N°</th>
                <th className="py-2.5 px-3">Vencimiento</th>
                <th className="py-2.5 px-3 text-right">Saldo Inicial</th>
                <th className="py-2.5 px-3 text-right">Capital</th>
                <th className="py-2.5 px-3 text-right">Interés</th>
                <th className="py-2.5 px-3 text-right">Cargos/Admin</th>
                <th className="py-2.5 px-3 text-right font-black text-slate-900 bg-slate-100/60">
                  Cuota Total
                </th>
                <th className="py-2.5 px-3 text-right">Mora</th>
                <th className="py-2.5 px-3 text-right">Saldo Final</th>
                <th className="py-2.5 px-3 text-center">Estado</th>
                <th className="py-2.5 px-3 text-center sticky right-0 bg-slate-100/95 backdrop-blur-xs z-10 shadow-[-3px_0_5px_-1px_rgba(0,0,0,0.06)]">
                  Acción
                </th>
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
                    onClick={() => !isPaid && onOpenPaymentModal(item.number)}
                    className={`hover:bg-blue-50/50 transition-colors cursor-pointer ${
                      isOverdue
                        ? 'bg-rose-50/40'
                        : isGrace
                        ? 'bg-purple-50/20'
                        : isPaid
                        ? 'bg-emerald-50/20 cursor-default'
                        : ''
                    }`}
                    title={!isPaid ? `Haga clic para abonar o pagar la cuota #${item.number}` : `Cuota #${item.number} pagada`}
                  >
                    <td className="py-2.5 px-3 text-center font-bold text-slate-900">
                      {item.number}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap font-medium text-slate-800">
                      {item.dueDate}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-600">
                      <CurrencyDisplay amount={item.beginningBalance} />
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-blue-700">
                      <CurrencyDisplay amount={item.principal} />
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-emerald-700">
                      <CurrencyDisplay amount={item.interest} />
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-600" title={`Seguro: ${item.insurance} | Admin: ${item.adminFee}`}>
                      <CurrencyDisplay amount={item.insurance + item.adminFee} />
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 bg-slate-100/40">
                      <CurrencyDisplay amount={item.totalInstallment} />
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold" onClick={(e) => e.stopPropagation()}>
                      {item.lateFee > 0 ? (
                        <button
                          onClick={() => openLateFeeModal(item)}
                          className="inline-flex items-center text-rose-600 hover:text-rose-800 hover:underline"
                          title="Haga clic para validar el desglose del interés sobre mora"
                        >
                          <span>+<CurrencyDisplay amount={item.lateFee} className="inline" /></span>
                          <Info className="w-3 h-3 ml-1 text-rose-500" />
                        </button>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-600">
                      <CurrencyDisplay amount={item.endingBalance} />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <StatusBadge
                        status={item.status}
                        daysPastDue={item.daysPastDue}
                      />
                    </td>
                    <td
                      className={`py-2.5 px-3 text-center sticky right-0 z-10 backdrop-blur-xs shadow-[-3px_0_5px_-1px_rgba(0,0,0,0.06)] ${
                        isOverdue
                          ? 'bg-rose-50/95'
                          : isGrace
                          ? 'bg-purple-50/95'
                          : isPaid
                          ? 'bg-emerald-50/95'
                          : 'bg-white/95'
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {!isPaid ? (
                        <button
                          onClick={() => onOpenPaymentModal(item.number)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-xs"
                          title="Simular pago o abono extraordinario para esta cuota"
                        >
                          Pagar
                        </button>
                      ) : (
                        <span className="inline-flex items-center text-emerald-600 text-[11px] font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Pagado
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
                <td colSpan={2} className="py-3 px-3 text-left uppercase text-[11px]">
                  Totales Acumulados
                </td>
                <td className="py-3 px-3 text-right text-slate-500">-</td>
                <td className="py-3 px-3 text-right text-blue-700">
                  <CurrencyDisplay amount={summary.totalPrincipal} />
                </td>
                <td className="py-3 px-3 text-right text-emerald-700">
                  <CurrencyDisplay amount={summary.totalInterest} />
                </td>
                <td className="py-3 px-3 text-right text-slate-700">
                  <CurrencyDisplay
                    amount={summary.totalInsurance + summary.totalAdminFee}
                  />
                </td>
                <td className="py-3 px-3 text-right text-slate-900 bg-slate-200/50 text-sm font-black">
                  <CurrencyDisplay amount={summary.totalRepayment} />
                </td>
                <td className="py-3 px-3 text-right text-rose-700">
                  {summary.totalLateFees > 0 ? (
                    <CurrencyDisplay amount={summary.totalLateFees} />
                  ) : (
                    '-'
                  )}
                </td>
                <td className="py-3 px-3 text-right text-slate-900">0.00</td>
                <td className="py-3 px-3 text-center text-slate-500 text-[11px]">
                  TCEA: {summary.tcea.toFixed(2)}%
                </td>
                <td className="py-3 px-3 text-center sticky right-0 bg-slate-100/95 z-10 shadow-[-3px_0_5px_-1px_rgba(0,0,0,0.06)] text-slate-400">
                  -
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. VISTA DE IMPRESIÓN EXCLUSIVA (PRINT-ONLY)                   */}
      {/* Al pulsar Imprimir, SOLO se imprime esta vista limpia           */}
      {/* ============================================================== */}
      <div className="print-only">
        {/* Encabezado Institucional del Reporte */}
        <div style={{ borderBottom: '2px solid #1e293b', paddingBottom: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '20pt', fontWeight: 'bold', margin: 0, color: '#0f172a' }}>
                CrediFacil
              </h1>
              <p style={{ fontSize: '9pt', color: '#64748b', margin: '2px 0 0 0' }}>
                Simulador Avanzado de Créditos y Microfinanzas
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2 style={{ fontSize: '12pt', fontWeight: 'bold', margin: 0, color: '#1e3a8a' }}>
                REPORTE DE SIMULACIÓN DE CRÉDITO
              </h2>
              <p style={{ fontSize: '8pt', color: '#64748b', margin: '2px 0 0 0' }}>
                Fecha de Emisión: {currentFormattedDate}
              </p>
            </div>
          </div>
        </div>

        {/* Ficha de Datos Generales del Crédito Simulado */}
        <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '12px', marginBottom: '18px', background: '#f8fafc' }}>
          <h3 style={{ fontSize: '10pt', fontWeight: 'bold', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '8px', color: '#334155' }}>
            DATOS GENERALES DE LA OPERACIÓN CREDITICIA
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', fontSize: '9pt' }}>
            <div>
              <span style={{ color: '#64748b', display: 'block' }}>Monto Solicitado:</span>
              <strong style={{ fontSize: '10pt' }}>{formatCurrency(params.principal, params.currency)}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block' }}>Moneda:</span>
              <strong>{params.currency} ({CURRENCY_CONFIGS[params.currency].name})</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block' }}>Método Amortización:</span>
              <strong>{getMethodTitle(params.method)}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block' }}>Plazo y Frecuencia:</span>
              <strong>{params.term} cuotas ({getFrequencyLabel(params.frequency)})</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block' }}>Tasa de Interés:</span>
              <strong>{params.interestRate}% ({params.rateType})</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block' }}>Gastos de Desembolso:</span>
              <strong>
                {params.disbursementFeePercent && params.disbursementFeePercent > 0
                  ? `${params.disbursementFeePercent}% (${formatCurrency(summary.disbursementFee, params.currency)})`
                  : 'Sin gastos (0%)'}
              </strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block' }}>Neto Desembolsado:</span>
              <strong>{formatCurrency(summary.netDisbursement, params.currency)}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block' }}>Gastos Administrativos:</span>
              <strong>
                {params.adminFeeType === 'percentage'
                  ? `${params.adminFeePercent || 0}% sobre saldo`
                  : params.adminFee > 0
                  ? `${formatCurrency(params.adminFee, params.currency)} fija`
                  : 'Sin gastos (0)'}
              </strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block' }}>Seguro Desgravamen:</span>
              <strong>{params.desgravamenRate}% mensual</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block' }}>Tasa Mora Diaria:</span>
              <strong>{params.dailyLateRate}% / día (Tol.: {params.graceDaysLate}d)</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block' }}>TCEA Regulatoria:</span>
              <strong style={{ color: '#b45309' }}>{summary.tcea.toFixed(2)}%</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block' }}>Total a Devolver:</span>
              <strong style={{ color: '#1e3a8a', fontSize: '10pt' }}>{formatCurrency(summary.totalRepayment, params.currency)}</strong>
            </div>
          </div>
        </div>

        {/* Tabla de Amortización Limpia para Impresión */}
        <table style={{ width: '100%', fontSize: '8pt', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', borderTop: '1px solid #94a3b8', borderBottom: '1.5px solid #475569' }}>
              <th style={{ padding: '6px 4px', textAlign: 'center' }}>N°</th>
              <th style={{ padding: '6px 4px' }}>Vencimiento</th>
              <th style={{ padding: '6px 4px', textAlign: 'right' }}>Saldo Inicial</th>
              <th style={{ padding: '6px 4px', textAlign: 'right' }}>Capital</th>
              <th style={{ padding: '6px 4px', textAlign: 'right' }}>Interés</th>
              <th style={{ padding: '6px 4px', textAlign: 'right' }}>Seguros/Admin</th>
              <th style={{ padding: '6px 4px', textAlign: 'right', fontWeight: 'bold' }}>Cuota Total</th>
              <th style={{ padding: '6px 4px', textAlign: 'right' }}>Mora</th>
              <th style={{ padding: '6px 4px', textAlign: 'right' }}>Saldo Final</th>
              <th style={{ padding: '6px 4px', textAlign: 'center' }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {schedule.map((item) => (
              <tr key={item.number} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '4px', textAlign: 'center', fontWeight: 'bold' }}>{item.number}</td>
                <td style={{ padding: '4px' }}>{item.dueDate}</td>
                <td style={{ padding: '4px', textAlign: 'right' }}>{formatCurrency(item.beginningBalance, params.currency, false)}</td>
                <td style={{ padding: '4px', textAlign: 'right', fontWeight: '600' }}>{formatCurrency(item.principal, params.currency, false)}</td>
                <td style={{ padding: '4px', textAlign: 'right' }}>{formatCurrency(item.interest, params.currency, false)}</td>
                <td style={{ padding: '4px', textAlign: 'right' }}>{formatCurrency(item.insurance + item.adminFee, params.currency, false)}</td>
                <td style={{ padding: '4px', textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(item.totalInstallment, params.currency, false)}</td>
                <td style={{ padding: '4px', textAlign: 'right' }}>{item.lateFee > 0 ? formatCurrency(item.lateFee, params.currency, false) : '-'}</td>
                <td style={{ padding: '4px', textAlign: 'right' }}>{formatCurrency(item.endingBalance, params.currency, false)}</td>
                <td style={{ padding: '4px', textAlign: 'center', fontSize: '7pt' }}>{item.status.toUpperCase()}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: '#f8fafc', borderTop: '2px solid #475569', fontWeight: 'bold' }}>
              <td colSpan={2} style={{ padding: '6px 4px' }}>TOTALES ({params.currency})</td>
              <td style={{ padding: '6px 4px', textAlign: 'right' }}>-</td>
              <td style={{ padding: '6px 4px', textAlign: 'right' }}>{formatCurrency(summary.totalPrincipal, params.currency, false)}</td>
              <td style={{ padding: '6px 4px', textAlign: 'right' }}>{formatCurrency(summary.totalInterest, params.currency, false)}</td>
              <td style={{ padding: '6px 4px', textAlign: 'right' }}>{formatCurrency(summary.totalInsurance + summary.totalAdminFee, params.currency, false)}</td>
              <td style={{ padding: '6px 4px', textAlign: 'right', fontWeight: '900' }}>{formatCurrency(summary.totalRepayment, params.currency, false)}</td>
              <td style={{ padding: '6px 4px', textAlign: 'right' }}>{summary.totalLateFees > 0 ? formatCurrency(summary.totalLateFees, params.currency, false) : '-'}</td>
              <td style={{ padding: '6px 4px', textAlign: 'right' }}>0.00</td>
              <td style={{ padding: '6px 4px', textAlign: 'center' }}>TCEA: {summary.tcea.toFixed(2)}%</td>
            </tr>
          </tfoot>
        </table>

        {/* Pie de Página del Reporte Impreso */}
        <div style={{ marginTop: '24px', paddingTop: '10px', borderTop: '1px solid #cbd5e1', fontSize: '8pt', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
          <span>CrediFacil © {currentYear} - Documento generado para fines de cotización y evaluación crediticia.</span>
          <span>Página 1 de 1</span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. MODAL DE VALIDACIÓN DE INTERÉS SOBRE MORA                   */}
      {/* ============================================================== */}
      {selectedLateFeeInfo && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-rose-50 border-b border-rose-100 p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-rose-800 font-bold text-sm">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <span>Validación de Interés sobre Mora</span>
              </div>
              <button
                onClick={() => setSelectedLateFeeInfo(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="text-slate-500 font-semibold block">Cuota N° {selectedLateFeeInfo.installment.number}</span>
                  <span className="text-slate-800 font-bold">Vencimiento: {selectedLateFeeInfo.installment.dueDate}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 font-semibold block">Evaluado a:</span>
                  <span className="text-blue-700 font-bold">{evaluationDate}</span>
                </div>
              </div>

              <div className="space-y-2.5 border-t border-b border-slate-100 py-3 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-600">Días transcurridos de atraso (DPD):</span>
                  <strong className="text-rose-700 font-bold">{selectedLateFeeInfo.calculation.daysPastDue} días</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Días de tolerancia otorgados:</span>
                  <span>{selectedLateFeeInfo.calculation.graceDaysLate} días</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Base exigible sujeta a mora:</span>
                  <strong>{formatCurrency(selectedLateFeeInfo.calculation.baseOverdueAmount, params.currency)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Tasa moratoria diaria pactada:</span>
                  <span>{selectedLateFeeInfo.calculation.dailyLateRate}% / día</span>
                </div>
                <div className="flex justify-between text-rose-800 font-semibold pt-1">
                  <span>Interés moratorio devengado (Base × Tasa × Días):</span>
                  <strong>+{formatCurrency(selectedLateFeeInfo.calculation.dailyLateInterest, params.currency)}</strong>
                </div>
                <div className="flex justify-between text-amber-800 font-semibold">
                  <span>Comisión fija de gestión de cobranza:</span>
                  <strong>+{formatCurrency(selectedLateFeeInfo.calculation.fixedLateFee, params.currency)}</strong>
                </div>
              </div>

              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex justify-between items-center">
                <span className="text-rose-900 font-bold text-xs">Total Mora Exigible:</span>
                <span className="text-base font-black text-rose-700">
                  {formatCurrency(selectedLateFeeInfo.calculation.totalLateFee, params.currency)}
                </span>
              </div>

              <div className="text-[11px] text-slate-500">
                Fórmula aplicada: <code>Mora = (Base × TasaDiaria × DíasAtraso) + ComisiónFija</code>
              </div>

              <button
                onClick={() => setSelectedLateFeeInfo(null)}
                className="w-full py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
              >
                Cerrar Validación
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
