/**
 * Generador de Reportes Financieros Oficiales para CrediFacil.
 * Permite exportar:
 * 1. Reporte Ejecutivo para Excel (.xls) con diseño corporativo, celdas formateadas y colores.
 * 2. Reporte CSV estructurado y delimitado con compatibilidad nativa para Windows y Excel en español.
 */

import type { LoanParams, LoanSummary, Installment } from '../types';
import { CURRENCY_CONFIGS, formatCurrency } from '../engine/currency';

function getMethodName(method: string): string {
  switch (method) {
    case 'french':
      return 'Francesa (Cuota Fija Periódica)';
    case 'german':
      return 'Alemana (Amortización de Capital Constante)';
    case 'interest_balance':
      return 'Interés sobre Saldo Deudor (Recalculable)';
    case 'flat':
      return 'Tasa Plana (Interés Simple Fijo)';
    default:
      return method;
  }
}

function getFrequencyName(freq: string): string {
  switch (freq) {
    case 'annual':
      return 'Anual (360 días)';
    case 'monthly':
      return 'Mensual (30 días)';
    case 'biweekly':
      return 'Quincenal (15 días)';
    case 'weekly':
      return 'Semanal (7 días)';
    case 'daily':
      return 'Diario (1 día)';
    default:
      return freq;
  }
}

/**
 * Genera y descarga un Reporte Ejecutivo de Excel (.xls) con estilo corporativo.
 */
export function exportToExcelFile(
  params: LoanParams,
  summary: LoanSummary,
  schedule: Installment[]
): void {
  const currencyConf = CURRENCY_CONFIGS[params.currency];
  const methodName = getMethodName(params.method);
  const freqName = getFrequencyName(params.frequency);
  const now = new Date();
  const issueDate = now.toLocaleDateString('es-LA') + ' ' + now.toLocaleTimeString('es-LA');
  const folio = `CF-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate()
  ).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

  const adminFeeDesc =
    params.adminFeeType === 'percentage'
      ? `${params.adminFeePercent || 0}% sobre saldo insoluto`
      : `${currencyConf.symbol} ${(params.adminFee || 0).toFixed(2)} fijo por cuota`;

  const disbursementFeeDesc =
    params.disbursementFeePercent && params.disbursementFeePercent > 0
      ? `${params.disbursementFeePercent}% (${currencyConf.symbol} ${summary.disbursementFee.toFixed(2)})`
      : 'Sin gastos de desembolso (0%)';

  const html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <style>
    body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; font-size: 10pt; color: #1e293b; }
    .title-banner { background-color: #0f172a; color: #ffffff; padding: 12px; font-size: 14pt; font-weight: bold; }
    .section-title { background-color: #e2e8f0; color: #0f172a; font-weight: bold; font-size: 10pt; padding: 6px 8px; border: 1px solid #cbd5e1; }
    .meta-label { color: #64748b; font-weight: 600; font-size: 9pt; }
    .meta-value { font-weight: bold; font-size: 9.5pt; color: #0f172a; }
    .table-header th { background-color: #1e40af; color: #ffffff; font-weight: bold; font-size: 9pt; padding: 8px 6px; border: 1px solid #1e3a8a; text-align: right; }
    .table-header th.text-center { text-align: center; }
    .table-row td { padding: 5px 6px; border: 1px solid #cbd5e1; font-size: 9pt; text-align: right; }
    .table-row td.text-center { text-align: center; }
    .table-row.alt { background-color: #f8fafc; }
    .table-row.overdue { background-color: #fef2f2; color: #991b1b; }
    .table-row.paid { background-color: #f0fdf4; color: #166534; }
    .table-footer td { background-color: #e2e8f0; font-weight: bold; font-size: 9.5pt; border-top: 2px solid #0f172a; border-bottom: 2px solid #0f172a; padding: 7px 6px; text-align: right; }
    .table-footer td.text-center { text-align: center; }
    .table-footer td.text-left { text-align: left; }
    .badge-paid { color: #166534; font-weight: bold; }
    .badge-pending { color: #475569; }
    .badge-overdue { color: #dc2626; font-weight: bold; }
  </style>
</head>
<body>
  <!-- ENCABEZADO INSTITUCIONAL -->
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 12px;">
    <tr>
      <td colspan="12" class="title-banner" style="text-align: left;">
        CREDIFACIL &bull; MOTOR FINANCIERO DE CRÉDITO Y MICROFINANZAS
      </td>
    </tr>
    <tr>
      <td colspan="6" style="padding: 6px 0; font-size: 11pt; font-weight: bold; color: #1e3a8a;">
        REPORTE OFICIAL DE SIMULACIÓN Y TABLA DE AMORTIZACIÓN
      </td>
      <td colspan="6" style="padding: 6px 0; font-size: 9pt; color: #64748b; text-align: right;">
        Folio: <strong>${folio}</strong> &bull; Emisión: ${issueDate}
      </td>
    </tr>
  </table>

  <!-- SECCIÓN 1: DATOS GENERALES DE LA OPERACIÓN -->
  <table width="100%" cellpadding="4" cellspacing="0" style="margin-bottom: 14px; border-collapse: collapse;">
    <tr>
      <td colspan="12" class="section-title">1. CONDICIONES GENERALES DEL CRÉDITO</td>
    </tr>
    <tr>
      <td colspan="3" class="meta-label" style="border: 1px solid #cbd5e1;">Capital Solicitado (Monto):</td>
      <td colspan="3" class="meta-value" style="border: 1px solid #cbd5e1;">${formatCurrency(params.principal, params.currency)}</td>
      <td colspan="3" class="meta-label" style="border: 1px solid #cbd5e1;">Moneda:</td>
      <td colspan="3" class="meta-value" style="border: 1px solid #cbd5e1;">${params.currency} - ${currencyConf.name}</td>
    </tr>
    <tr>
      <td colspan="3" class="meta-label" style="border: 1px solid #cbd5e1;">Método de Amortización:</td>
      <td colspan="3" class="meta-value" style="border: 1px solid #cbd5e1;">${methodName}</td>
      <td colspan="3" class="meta-label" style="border: 1px solid #cbd5e1;">Plazo y Frecuencia:</td>
      <td colspan="3" class="meta-value" style="border: 1px solid #cbd5e1;">${params.term} cuotas &bull; ${freqName}</td>
    </tr>
    <tr>
      <td colspan="3" class="meta-label" style="border: 1px solid #cbd5e1;">Tasa de Interés Pactada:</td>
      <td colspan="3" class="meta-value" style="border: 1px solid #cbd5e1;">${params.interestRate}% (${params.rateType})</td>
      <td colspan="3" class="meta-label" style="border: 1px solid #cbd5e1;">Fecha de Desembolso:</td>
      <td colspan="3" class="meta-value" style="border: 1px solid #cbd5e1;">${params.disbursementDate}</td>
    </tr>
    <tr>
      <td colspan="3" class="meta-label" style="border: 1px solid #cbd5e1;">Gastos de Desembolso:</td>
      <td colspan="3" class="meta-value" style="border: 1px solid #cbd5e1;">${disbursementFeeDesc}</td>
      <td colspan="3" class="meta-label" style="border: 1px solid #cbd5e1;">Capital Neto Entregado:</td>
      <td colspan="3" class="meta-value" style="border: 1px solid #cbd5e1; color: #1e40af;">${formatCurrency(summary.netDisbursement, params.currency)}</td>
    </tr>
    <tr>
      <td colspan="3" class="meta-label" style="border: 1px solid #cbd5e1;">Gastos Administrativos:</td>
      <td colspan="3" class="meta-value" style="border: 1px solid #cbd5e1;">${adminFeeDesc}</td>
      <td colspan="3" class="meta-label" style="border: 1px solid #cbd5e1;">Seguro Desgravamen:</td>
      <td colspan="3" class="meta-value" style="border: 1px solid #cbd5e1;">${params.desgravamenRate}% mensual</td>
    </tr>
    <tr>
      <td colspan="3" class="meta-label" style="border: 1px solid #cbd5e1;">Tasa Moratoria Diaria:</td>
      <td colspan="3" class="meta-value" style="border: 1px solid #cbd5e1;">${params.dailyLateRate}% / día</td>
      <td colspan="3" class="meta-label" style="border: 1px solid #cbd5e1;">Tolerancia de Mora:</td>
      <td colspan="3" class="meta-value" style="border: 1px solid #cbd5e1;">${params.graceDaysLate} días de gracia</td>
    </tr>
    <tr>
      <td colspan="3" class="meta-label" style="border: 1px solid #cbd5e1;">Total Intereses a Pagar:</td>
      <td colspan="3" class="meta-value" style="border: 1px solid #cbd5e1; color: #047857;">${formatCurrency(summary.totalInterest, params.currency)}</td>
      <td colspan="3" class="meta-label" style="border: 1px solid #cbd5e1;">Liquidación Total del Crédito:</td>
      <td colspan="3" class="meta-value" style="border: 1px solid #cbd5e1; color: #1e3a8a; font-size: 11pt;">${formatCurrency(summary.totalRepayment, params.currency)}</td>
    </tr>
    <tr>
      <td colspan="3" class="meta-label" style="border: 1px solid #cbd5e1;">Costo Efectivo Anual (TCEA):</td>
      <td colspan="9" class="meta-value" style="border: 1px solid #cbd5e1; color: #b45309; font-size: 10.5pt;">
        ${summary.tcea.toFixed(2)}% (TIR anualizada que incluye intereses, seguros y cargos de desembolso)
      </td>
    </tr>
  </table>

  <!-- SECCIÓN 2: CRONOGRAMA DETALLADO DE AMORTIZACIÓN -->
  <table width="100%" cellpadding="5" cellspacing="0" style="margin-bottom: 14px; border-collapse: collapse;">
    <thead>
      <tr>
        <td colspan="12" class="section-title">2. TABLA CRONOLÓGICA DE AMORTIZACIÓN</td>
      </tr>
      <tr class="table-header">
        <th class="text-center" width="40">N°</th>
        <th class="text-center" width="90">Vencimiento</th>
        <th width="110">Saldo Inicial</th>
        <th width="110">Capital</th>
        <th width="110">Interés</th>
        <th width="100">Seguro</th>
        <th width="100">Gasto Admin</th>
        <th width="110">Cuota Exigible</th>
        <th width="90">Mora</th>
        <th width="110">Saldo Deudor</th>
        <th class="text-center" width="90">Estado</th>
        <th width="100">Monto Pagado</th>
      </tr>
    </thead>
    <tbody>
      ${schedule
        .map((item, idx) => {
          const isOverdue = item.status === 'overdue';
          const isPaid = item.status === 'paid';
          const rowClass = isOverdue
            ? 'table-row overdue'
            : isPaid
            ? 'table-row paid'
            : idx % 2 === 1
            ? 'table-row alt'
            : 'table-row';

          const statusBadge = isPaid
            ? '<span class="badge-paid">PAGADO</span>'
            : isOverdue
            ? `<span class="badge-overdue">VENCIDO (${item.daysPastDue}d)</span>`
            : '<span class="badge-pending">PENDIENTE</span>';

          return `
      <tr class="${rowClass}">
        <td class="text-center"><strong>${item.number}</strong></td>
        <td class="text-center">${item.dueDate}</td>
        <td>${item.beginningBalance.toFixed(2)}</td>
        <td style="color: #1e40af; font-weight: 600;">${item.principal.toFixed(2)}</td>
        <td style="color: #047857; font-weight: 600;">${item.interest.toFixed(2)}</td>
        <td>${item.insurance.toFixed(2)}</td>
        <td>${item.adminFee.toFixed(2)}</td>
        <td style="font-weight: bold; color: #0f172a;">${item.totalInstallment.toFixed(2)}</td>
        <td style="color: #dc2626;">${item.lateFee > 0 ? item.lateFee.toFixed(2) : '-'}</td>
        <td>${item.endingBalance.toFixed(2)}</td>
        <td class="text-center">${statusBadge}</td>
        <td>${item.amountPaid > 0 ? item.amountPaid.toFixed(2) : '-'}</td>
      </tr>`;
        })
        .join('')}
    </tbody>
    <tfoot>
      <tr class="table-footer">
        <td colspan="2" class="text-left">TOTALES ACUMULADOS (${params.currency})</td>
        <td>-</td>
        <td style="color: #1e40af;">${summary.totalPrincipal.toFixed(2)}</td>
        <td style="color: #047857;">${summary.totalInterest.toFixed(2)}</td>
        <td>${summary.totalInsurance.toFixed(2)}</td>
        <td>${summary.totalAdminFee.toFixed(2)}</td>
        <td style="font-size: 10.5pt; color: #0f172a;">${summary.totalRepayment.toFixed(2)}</td>
        <td style="color: #dc2626;">${summary.totalLateFees > 0 ? summary.totalLateFees.toFixed(2) : '-'}</td>
        <td>0.00</td>
        <td class="text-center">TCEA: ${summary.tcea.toFixed(2)}%</td>
        <td>${summary.totalPaid.toFixed(2)}</td>
      </tr>
    </tfoot>
  </table>

  <!-- SECCIÓN 3: TÉRMINOS Y POLÍTICAS DEL CRÉDITO -->
  <table width="100%" cellpadding="4" cellspacing="0" style="border-collapse: collapse; font-size: 8.5pt; color: #64748b;">
    <tr>
      <td colspan="12" class="section-title" style="font-size: 9pt;">3. NOTAS TÉCNICAS Y REGLAS DE LIQUIDACIÓN</td>
    </tr>
    <tr>
      <td colspan="12" style="border: 1px solid #cbd5e1; padding: 6px 8px;">
        &bull; <strong>Interés sobre Saldo Deudor:</strong> Los intereses compensatorios se calculan sobre el saldo insoluto en cada fecha de corte. Si el cliente abona de más, el excedente amortiza directamente el capital reduciendo la cuota o el plazo.<br />
        &bull; <strong>Interés Moratorio:</strong> Aplica sobre el capital exigible vencido superada la tolerancia (${params.graceDaysLate} días) a razón de ${params.dailyLateRate}% diario.<br />
        &bull; <strong>Prelación de Pagos:</strong> 1° Mora y Gastos de Cobranza &rarr; 2° Comisiones & Seguros &rarr; 3° Interés Compensatorio &rarr; 4° Capital Exigible &rarr; 5° Amortización Anticipada.
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute(
    'download',
    `Reporte_Credito_${params.currency}_${params.principal}_${params.method}.xls`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Genera y descarga un Reporte CSV Estructurado y compatible con Excel en Español (sep=;).
 * Esto evita que las líneas salgan como una sola división o texto amontonado.
 */
export function exportToCSVFile(
  params: LoanParams,
  summary: LoanSummary,
  schedule: Installment[],
  delimiter: ';' | ',' = ';'
): void {
  const currencyConf = CURRENCY_CONFIGS[params.currency];
  const methodName = getMethodName(params.method);
  const freqName = getFrequencyName(params.frequency);
  const issueDate = new Date().toLocaleString('es-LA');

  const adminFeeDesc =
    params.adminFeeType === 'percentage'
      ? `${params.adminFeePercent || 0}% sobre saldo insoluto`
      : `${currencyConf.symbol} ${(params.adminFee || 0).toFixed(2)} fijo por cuota`;

  const d = delimiter;

  const lines: string[] = [
    `"REPORTE OFICIAL DE SIMULACION DE CREDITO - CREDIFACIL"`,
    `"Fecha y Hora de Emisión"${d}"${issueDate}"`,
    `"Moneda"${d}"${params.currency} (${currencyConf.name})"`,
    `"Monto del Crédito (Capital)"${d}"${params.principal.toFixed(2)}"`,
    `"Método de Amortización"${d}"${methodName}"`,
    `"Plazo"${d}"${params.term} cuotas"`,
    `"Frecuencia de Pago"${d}"${freqName}"`,
    `"Tasa de Interés Nominal/Efectiva"${d}"${params.interestRate}% (${params.rateType})"`,
    `"Comisión de Desembolso"${d}"${summary.disbursementFee.toFixed(2)} (${params.disbursementFeePercent || 0}%)"`,
    `"Capital Neto Desembolsado"${d}"${summary.netDisbursement.toFixed(2)}"`,
    `"Gastos Administrativos"${d}"${adminFeeDesc}"`,
    `"Seguro de Desgravamen"${d}"${params.desgravamenRate}% mensual"`,
    `"Tasa Moratoria Diaria"${d}"${params.dailyLateRate}% / día"`,
    `"Días de Tolerancia de Mora"${d}"${params.graceDaysLate} días"`,
    `"Tasa de Costo Efectivo Anual (TCEA)"${d}"${summary.tcea.toFixed(2)}%"`,
    `"Total Intereses a Pagar"${d}"${summary.totalInterest.toFixed(2)}"`,
    `"Total a Liquidar (Capital + Intereses + Gastos)"${d}"${summary.totalRepayment.toFixed(2)}"`,
    `""`,
    `"TABLA DE AMORTIZACIÓN DETALLADA"`,
    [
      `"Cuota N°"`,
      `"Fecha Vencimiento"`,
      `"Saldo Deudor Inicial"`,
      `"Amortización Capital"`,
      `"Interés Compensatorio"`,
      `"Seguro Desgravamen"`,
      `"Gastos Administrativos"`,
      `"Cuota Total Exigible"`,
      `"Mora Devengada"`,
      `"Saldo Deudor Final"`,
      `"Estado"`,
      `"Monto Pagado"`,
      `"Fecha de Pago"`,
    ].join(d),
  ];

  for (const item of schedule) {
    const row = [
      item.number,
      `"${item.dueDate}"`,
      item.beginningBalance.toFixed(2),
      item.principal.toFixed(2),
      item.interest.toFixed(2),
      item.insurance.toFixed(2),
      item.adminFee.toFixed(2),
      item.totalInstallment.toFixed(2),
      item.lateFee.toFixed(2),
      item.endingBalance.toFixed(2),
      `"${item.status.toUpperCase()}"`,
      item.amountPaid.toFixed(2),
      item.paidDate ? `"${item.paidDate}"` : `""`,
    ];
    lines.push(row.join(d));
  }

  // Fila de Totales
  lines.push(
    [
      `"TOTALES (${params.currency})"`,
      `""`,
      `"-"`,
      summary.totalPrincipal.toFixed(2),
      summary.totalInterest.toFixed(2),
      summary.totalInsurance.toFixed(2),
      summary.totalAdminFee.toFixed(2),
      summary.totalRepayment.toFixed(2),
      summary.totalLateFees.toFixed(2),
      `"0.00"`,
      `"TCEA: ${summary.tcea.toFixed(2)}%"`,
      summary.totalPaid.toFixed(2),
      `""`,
    ].join(d)
  );

  // Generar con BOM UTF-8 exacto en bytes (EF BB BF) para que Microsoft Excel lo abra con acentos limpios
  const bomBytes = new Uint8Array([0xef, 0xbb, 0xbf]);
  const textBytes = new TextEncoder().encode(lines.join('\r\n'));
  const blob = new Blob([bomBytes, textBytes], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute(
    'download',
    `Reporte_CrediFacil_${params.currency}_${params.principal}_${params.method}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
