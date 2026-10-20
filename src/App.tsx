import React, { useState } from 'react';
import {
  Table,
  BarChart3,
  Layers,
  History,
  BookOpen,
  Sliders,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { useCreditStore } from './store/useCreditStore';
import { Navbar } from './components/header/Navbar';
import { ExchangeRateBar } from './components/header/ExchangeRateBar';
import { MetricsSummary } from './components/dashboard/MetricsSummary';
import { LoanForm } from './components/form/LoanForm';
import { AmortizationTable } from './components/table/AmortizationTable';
import { AmortizationCharts } from './components/charts/AmortizationCharts';
import { ComparisonCard } from './components/dashboard/ComparisonCard';
import { PaymentHistoryList } from './components/payment/PaymentHistoryList';
import { PaymentSimulatorModal } from './components/payment/PaymentSimulatorModal';

const currentYear = new Date().getFullYear();

export const App: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    payments,
    isTableExpanded,
    toggleTableExpanded,
  } = useCreditStore();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [targetInstallmentForModal, setTargetInstallmentForModal] = useState<
    number | undefined
  >(undefined);
  const [isFormVisibleInExpanded, setIsFormVisibleInExpanded] = useState(false);

  const handleOpenPaymentModal = (installmentNumber?: number) => {
    setTargetInstallmentForModal(installmentNumber);
    setIsPaymentModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navbar (Hidden on print) */}
      <div className="no-print">
        <Navbar />
      </div>

      {/* Exchange Rate & Cutoff Date Ticker Bar (Hidden on print) */}
      <div className="no-print">
        <ExchangeRateBar />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Executive Metrics Dashboard (Hidden on print) */}
        <section aria-label="Resumen Ejecutivo" className="no-print">
          <MetricsSummary />
        </section>

        {/* Primary Workspace: Supports Full Width Mode so Table never overflows */}
        <div
          className={`grid gap-6 items-start ${
            isTableExpanded
              ? 'grid-cols-1'
              : 'grid-cols-1 lg:grid-cols-12'
          }`}
        >
          {/* If Table is Expanded: Show Form in an optional collapsible drawer/card at the top */}
          {isTableExpanded ? (
            <div className="no-print space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Configuración de Parámetros de Crédito
                    </h2>
                    <p className="text-xs text-slate-500">
                      Vista completa activa para ver el cronograma de amortización al 100% sin barras de desplazamiento
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsFormVisibleInExpanded(!isFormVisibleInExpanded)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
                  >
                    <span>{isFormVisibleInExpanded ? 'Ocultar Parámetros' : 'Modificar Parámetros'}</span>
                    {isFormVisibleInExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    onClick={toggleTableExpanded}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-300"
                    title="Alternar a vista dividida con formulario fijo al lado"
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Vista Dividida</span>
                  </button>
                </div>
              </div>

              {isFormVisibleInExpanded && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                  <LoanForm />
                </div>
              )}
            </div>
          ) : (
            /* Left: Credit Parameters Form (5 Cols) in Split View */
            <section className="no-print lg:col-span-5 w-full sticky lg:top-20">
              <LoanForm />
            </section>
          )}

          {/* Right / Full Width: Tabbed Outputs */}
          <section
            className={`w-full space-y-4 ${
              isTableExpanded ? 'col-span-1' : 'no-print lg:col-span-7'
            }`}
          >
            {/* Tab navigation pills (Hidden on print) */}
            <div className="no-print flex items-center justify-between p-1 bg-slate-200/80 rounded-xl overflow-x-auto custom-scrollbar gap-2">
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => setActiveTab('table')}
                  className={`flex items-center space-x-2 py-2 px-3.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === 'table'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Table className="w-4 h-4" />
                  <span>Cronograma</span>
                </button>

                <button
                  onClick={() => setActiveTab('charts')}
                  className={`flex items-center space-x-2 py-2 px-3.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === 'charts'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Gráficos</span>
                </button>

                <button
                  onClick={() => setActiveTab('compare')}
                  className={`flex items-center space-x-2 py-2 px-3.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === 'compare'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Comparativa</span>
                </button>

                <button
                  onClick={() => setActiveTab('payments')}
                  className={`flex items-center space-x-2 py-2 px-3.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === 'payments'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <History className="w-4 h-4" />
                  <span>Pagos Simulados</span>
                  {payments.length > 0 && (
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                      {payments.length}
                    </span>
                  )}
                </button>
              </div>

              {!isTableExpanded && (
                <button
                  onClick={toggleTableExpanded}
                  className="hidden md:inline-flex items-center space-x-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition-colors shadow-xs"
                  title="Expandir tabla de amortización a ancho completo sin desplazamiento"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Expandir Vista</span>
                </button>
              )}
            </div>

            {/* Active Tab View */}
            <div>
              {activeTab === 'table' && (
                <AmortizationTable onOpenPaymentModal={handleOpenPaymentModal} />
              )}

              {activeTab === 'charts' && (
                <div className="no-print">
                  <AmortizationCharts />
                </div>
              )}

              {activeTab === 'compare' && (
                <div className="no-print">
                  <ComparisonCard />
                </div>
              )}

              {activeTab === 'payments' && (
                <div className="no-print">
                  <PaymentHistoryList />
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Educational Domain Explainer Section (Hidden on print) */}
        <section className="no-print bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Arquitectura Financiera y Dominio Técnico en Microfinanzas LATAM
              </h3>
              <p className="text-xs text-slate-500">
                Fundamentos matemáticos y regulatorios implementados en CrediFacil
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
              <span className="font-bold text-slate-900 block text-xs">
                1. Métodos y Recálculo sobre Saldo
              </span>
              <p>
                Permite amortización Francesa (cuota fija), Alemana (capital fijo) e <strong>Interés sobre Saldo Deudor</strong>. Al realizar abonos extraordinarios o pagar de más, el crédito actualiza automáticamente los intereses reduciendo la cuota o acortando el plazo.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
              <span className="font-bold text-slate-900 block text-xs">
                2. Banco Central de Venezuela & Divisas
              </span>
              <p>
                Soporte de <strong>Bolívares (VES)</strong> conectado en vivo a la tasa oficial del <strong>Banco Central de Venezuela (BCV)</strong>, con recálculo dinámico en Dólares (USD), Soles (PEN), Pesos (MXN/COP).
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
              <span className="font-bold text-slate-900 block text-xs">
                3. Desembolso, Comisiones y Mora
              </span>
              <p>
                Configuración porcentual o fija de gastos de desembolso y administrativos (si es 0%, cálculo puro). Validación precisa de interés moratorio diario y comisiones de cobranza según días de atraso y tolerancia.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Global Interactive Payment Simulator Modal */}
      <PaymentSimulatorModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        targetInstallmentNumber={targetInstallmentForModal}
      />

      {/* Footer (Hidden on print) */}
      <footer className="no-print mt-auto border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <p>
          CrediFacil © {currentYear} &bull; Motor Avanzado de Créditos y Microfinanzas &bull; Conexión BCV & Métodos de Amortización LATAM
        </p>
      </footer>
    </div>
  );
};

export default App;
