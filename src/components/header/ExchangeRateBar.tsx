import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Globe2,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  X,
  Landmark,
} from 'lucide-react';
import { useCreditStore } from '../../store/useCreditStore';
import { CURRENCY_CONFIGS } from '../../engine/currency';
import { CENTRAL_BANKS_INFO } from '../../services/exchangeRateService';
import type { Currency } from '../../types';

export const ExchangeRateBar: React.FC = () => {
  const {
    params,
    setExchangeRate,
    bcvRate,
    setBcvRate,
    isBcvLoading,
    fetchAllRatesAction,
    ratesSnapshot,
    displayCurrency,
    setDisplayCurrency,
    evaluationDate,
    setEvaluationDate,
    payments,
  } = useCreditStore();

  const [isSourcesModalOpen, setIsSourcesModalOpen] = useState(false);

  const currencies: Currency[] = ['PEN', 'USD', 'MXN', 'COP', 'VES'];

  // Sincronizar todas las tasas de bancos centrales al cargar
  useEffect(() => {
    fetchAllRatesAction();
  }, [fetchAllRatesAction]);

  return (
    <>
      <div className="no-print w-full bg-slate-900 text-slate-100 border-b border-slate-800 text-xs py-2 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left side: Exchange Rates Config */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            {/* USD / PEN (BCRP / SBS) */}
            <div className="flex items-center space-x-1.5">
              <span className="flex items-center text-slate-400 font-semibold" title="Banco Central de Reserva del Perú (BCRP / SBS)">
                🇵🇪 Perú:
              </span>
              <div className="flex items-center bg-slate-800 rounded-md px-2 py-0.5 border border-slate-700">
                <span className="text-slate-400 mr-1 font-medium">$1 =</span>
                <span className="text-slate-300 font-bold mr-1">S/.</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  value={params.exchangeRate}
                  onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 3.75)}
                  className="w-14 bg-transparent text-white font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-0.5"
                  title="Tipo de cambio oficial BCRP / SBS (editable)"
                />
              </div>
            </div>

            {/* USD / VES (BCV) */}
            <div className="flex items-center space-x-1.5">
              <span className="flex items-center text-slate-400 font-semibold" title="Banco Central de Venezuela (BCV)">
                🇻🇪 BCV:
              </span>
              <div className="flex items-center bg-slate-800 rounded-md px-2 py-0.5 border border-slate-700">
                <span className="text-slate-400 mr-1 font-medium">$1 =</span>
                <span className="text-amber-400 font-bold mr-1">Bs.</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  value={bcvRate}
                  onChange={(e) => setBcvRate(parseFloat(e.target.value) || 881.88)}
                  className="w-20 bg-transparent text-amber-300 font-bold focus:outline-none focus:ring-1 focus:ring-amber-500 rounded px-0.5"
                  title="Tasa oficial Banco Central de Venezuela (editable)"
                />
              </div>
            </div>

            {/* Sync Button & Sources Info Button */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => fetchAllRatesAction()}
                disabled={isBcvLoading}
                className="inline-flex items-center space-x-1 px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors text-[11px]"
                title="Sincronizar tipos de cambio en vivo desde APIs de Bancos Centrales"
              >
                <RefreshCw className={`w-3 h-3 ${isBcvLoading ? 'animate-spin text-amber-400' : 'text-slate-400'}`} />
                <span className="hidden md:inline">Sincronizar</span>
              </button>

              <button
                onClick={() => setIsSourcesModalOpen(true)}
                className="inline-flex items-center space-x-1 px-2 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 border border-slate-700 transition-colors text-[11px]"
                title="Ver detalles de dónde se obtienen las tasas de cambio oficiales"
              >
                <Landmark className="w-3 h-3 text-emerald-400" />
                <span className="hidden lg:inline font-semibold">Fuentes Bancos Centrales</span>
              </button>
            </div>

            {/* Currency View Switcher */}
            <div className="flex items-center space-x-1.5">
              <span className="flex items-center text-slate-400 font-medium">
                <Globe2 className="w-3.5 h-3.5 mr-1 text-blue-400" />
                Ver en:
              </span>
              <div className="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
                {currencies.map((curr) => {
                  const conf = CURRENCY_CONFIGS[curr];
                  const isActive = displayCurrency === curr;
                  return (
                    <button
                      key={curr}
                      onClick={() => setDisplayCurrency(curr)}
                      className={`px-2 py-0.5 rounded-md font-medium text-xs transition-colors flex items-center space-x-1 ${
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
          <div className="flex items-center space-x-3">
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
                {payments.length} pago(s)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: Explicación y Auditoría de Fuentes Oficiales de Tipos de Cambio */}
      {isSourcesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Landmark className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold">
                    Fuentes Oficiales de Tipos de Cambio
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Bancos Centrales e instituciones emisoras oficiales vinculadas a CrediFacil
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSourcesModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs text-slate-700 max-h-[75vh] overflow-y-auto">
              <p className="text-slate-600">
                CrediFacil consulta y sincroniza las tasas oficiales publicadas diariamente por los Bancos Centrales de cada país para liquidación de créditos en moneda local o divisas:
              </p>

              <div className="space-y-2.5">
                {/* Venezuela */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900">{CENTRAL_BANKS_INFO.VES.country}</span>
                      <span className="bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded text-[10px]">
                        1 USD = Bs. {bcvRate.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold text-blue-700">
                      {CENTRAL_BANKS_INFO.VES.bank}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {CENTRAL_BANKS_INFO.VES.entity} &bull; API DolarApi / BCV Oficial
                    </p>
                  </div>
                  <a
                    href={CENTRAL_BANKS_INFO.VES.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-400 hover:text-blue-600 p-1"
                    title="Visitar sitio oficial del BCV"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                {/* Perú */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900">{CENTRAL_BANKS_INFO.PEN.country}</span>
                      <span className="bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded text-[10px]">
                        1 USD = S/. {params.exchangeRate.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold text-blue-700">
                      {CENTRAL_BANKS_INFO.PEN.bank}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {CENTRAL_BANKS_INFO.PEN.entity}
                    </p>
                  </div>
                  <a
                    href={CENTRAL_BANKS_INFO.PEN.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-400 hover:text-blue-600 p-1"
                    title="Visitar sitio oficial del BCRP"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                {/* México */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900">{CENTRAL_BANKS_INFO.MXN.country}</span>
                      <span className="bg-slate-200 text-slate-800 font-bold px-1.5 py-0.5 rounded text-[10px]">
                        1 USD = $ {ratesSnapshot?.ratesToUSD.MXN?.toFixed(2) || '18.45'} MXN
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold text-blue-700">
                      {CENTRAL_BANKS_INFO.MXN.bank}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {CENTRAL_BANKS_INFO.MXN.entity}
                    </p>
                  </div>
                  <a
                    href={CENTRAL_BANKS_INFO.MXN.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-400 hover:text-blue-600 p-1"
                    title="Visitar sitio oficial de Banxico"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                {/* Colombia */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900">{CENTRAL_BANKS_INFO.COP.country}</span>
                      <span className="bg-slate-200 text-slate-800 font-bold px-1.5 py-0.5 rounded text-[10px]">
                        1 USD = $ {ratesSnapshot?.ratesToUSD.COP?.toFixed(0) || '4,150'} COP
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold text-blue-700">
                      {CENTRAL_BANKS_INFO.COP.bank}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {CENTRAL_BANKS_INFO.COP.entity}
                    </p>
                  </div>
                  <a
                    href={CENTRAL_BANKS_INFO.COP.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-400 hover:text-blue-600 p-1"
                    title="Visitar sitio oficial de BanRep"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-[11px] text-emerald-800 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Todas las tasas se pueden modificar libremente en la barra superior si requiere simular con un tipo de cambio bancario o comercial personalizado.
                </span>
              </div>

              <button
                onClick={() => setIsSourcesModalOpen(false)}
                className="w-full py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
