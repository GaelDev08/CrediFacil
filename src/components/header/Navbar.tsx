import React, { useState } from 'react';
import {
  CreditCard,
  RotateCcw,
  Sparkles,
  Check,
  ChevronDown,
} from 'lucide-react';
import { useCreditStore, LOAN_PRESETS } from '../../store/useCreditStore';

export const Navbar: React.FC = () => {
  const { loadPreset, resetToDefaults } = useCreditStore();
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Credi<span className="text-blue-600">Facil</span>
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                Fintech Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">
              Simulador Realista de Microfinanzas y Banca LATAM
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Presets Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsPresetsOpen(!isPresetsOpen)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-300"
              title="Cargar escenarios predefinidos de crédito"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Plantillas</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {isPresetsOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsPresetsOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-xl bg-white shadow-xl border border-slate-200 py-2 z-20">
                  <div className="px-3 py-1.5 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Casos de Uso Preconfigurados
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Carga parámetros típicos de microcréditos y banca
                    </p>
                  </div>
                  <div className="p-1 space-y-1">
                    {LOAN_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => {
                          loadPreset(preset.id);
                          setIsPresetsOpen(false);
                        }}
                        className="w-full text-left p-2.5 rounded-lg hover:bg-blue-50 transition-colors group flex items-start space-x-2.5"
                      >
                        <div className="mt-0.5 w-6 h-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-900 group-hover:text-blue-700">
                            {preset.name}
                          </p>
                          <p className="text-[11px] text-slate-500 line-clamp-1">
                            {preset.description}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Reset button */}
          <button
            onClick={resetToDefaults}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
            title="Reiniciar valores por defecto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Restablecer</span>
          </button>

          {/* GitHub Repo */}
          <a
            href="https://github.com/GaelDev08/CrediFacil.git"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-sm"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </div>
    </header>
  );
};
