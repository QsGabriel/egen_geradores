import React from 'react';
import { Settings, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProposalSettingsModal from '../modules/quotations/components/proposal/ProposalSettingsModal';

export default function ProposalConfigPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4 px-4 sm:px-6 min-h-16">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-90 rounded-lg transition-all duration-150"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#0D2A59]/10 dark:bg-[#F3B229]/10 rounded-lg">
              <Settings className="w-5 h-5 text-[#0D2A59] dark:text-[#F3B229]" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                Configurações
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Capa e estilo das propostas
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-6 py-6">
        <ProposalSettingsModal />
      </main>
    </div>
  );
}
