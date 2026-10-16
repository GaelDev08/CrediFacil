import React, { useState } from 'react';
import {
  Table,
  BarChart3,
  Layers,
  History,
  BookOpen,
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
  const { activeTab, setActiveTab, payments } = useCreditStore();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [targetInstallmentForModal, setTargetInstallmentForModal] = useState<
    number | undefined
  >(undefined);

  const handleOpenPaymentModal = (installmentNumber?: number) => {
    setTargetInstallmentForModal(installmentNumber);
    setIsPaymentModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar />

      {/* Exchange Rate & Cutoff Date Ticker Bar */}
      <ExchangeRateBar />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Executive Metrics Dashboard */}
        <section aria-label="Resumen Ejecutivo">
          <MetricsSummary />
        </section>

        {/* Primary Workspace: Form on Left, Outputs on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Credit Parameters Form (5 Cols) */}
          <section className="lg:col-span-5 w-full sticky lg:top-20">
            <LoanForm />
          </section>

          {/* Right: Tabbed Outputs (7 Cols) */}
          <section className="lg:col-span-7 w-full space-y-4">
            {/* Tab navigation pills */}
            <div className="flex items-center space-x-1.5 p-1 bg-slate-200/80 rounded-xl overflow-x-auto custom-scrollbar">
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

            {/* Active Tab View */}
            <div>
              {activeTab === 'table' && (
                <AmortizationTable onOpenPaymentModal={handleOpenPaymentModal} />
              )}

              {activeTab === 'charts' && <AmortizationCharts />}

              {activeTab === 'compare' && <ComparisonCard />}

              {activeTab === 'payments' && <PaymentHistoryList />}
            </div>
          </section>
        </div>

        {/* Educational Domain Explainer Section */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 text-xs text-slate-600">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <span className="font-bold text-slate-900 block">
                1. Sistemas de Amortización
              </span>
              <p>
                <strong>Francés:</strong> Cuota total constante. En las primeras cuotas predomina el interés y en las últimas el capital.
              </p>
              <p>
                <strong>Alemán:</strong> Amortización constante de capital. Cuotas decrecientes y menor costo total acumulado.
              </p>
              <p>
                <strong>Tasa Plana (Flat):</strong> Interés simple constante sobre el principal original, extendido en microfinanzas comerciales.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <span className="font-bold text-slate-900 block">
                2. Morosidad y Prelación de Pagos
              </span>
              <p>
                El motor aplica la jerarquía bancaria regulatoria:
              </p>
              <p>
                <strong>1º Mora y penalidades</strong> &rarr; <strong>2º Seguros y comisiones</strong> &rarr; <strong>3º Intereses compensatorios</strong> &rarr; <strong>4º Capital exigible</strong> &rarr; <strong>5º Prepago anticipado</strong>.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <span className="font-bold text-slate-900 block">
                3. Tasa TCEA y Multi-Divisa
              </span>
              <p>
                Cálculo de TCEA vía Tasa Interna de Retorno (TIR) estandarizada sobre flujos netos (desembolso vs cuotas con desgravamen y gastos).
              </p>
              <p>
                Conversión dinámica en tiempo real entre Moneda Nacional (PEN, MXN, COP) y Divisa Extranjera (USD).
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 bg-white py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <p>
            © {currentYear} CrediFacil – Motor Avanzado de Préstamos y Microfinanzas LATAM.
          </p>
          <p className="flex items-center space-x-1">
            <span>Repositorio oficial:</span>
            <a
              href="https://github.com/GaelDev08/CrediFacil.git"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline font-semibold"
            >
              GaelDev08/CrediFacil
            </a>
          </p>
        </div>
      </footer>

      {/* Payment Simulator Modal */}
      <PaymentSimulatorModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        targetInstallmentNumber={targetInstallmentForModal}
      />
    </div>
  );
};

export default App;
