import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  History,
  BarChart3,
  Briefcase,
} from 'lucide-react';
import { useCRM } from '../hooks/useCRM';
import ClientList from './ClientList';
import LeadList from './LeadList';
import LeadPipeline from './LeadPipeline';
import CrmHistoryView from './CrmHistoryView';
import type { CrmEntityType } from '../types';

type CrmTab = 'clients' | 'leads' | 'pipeline' | 'history';

interface HistoryContext {
  entityType: CrmEntityType;
  entityId: string;
  entityName: string;
}

const CrmPage: React.FC = () => {
  const { clients, leads, loading, error } = useCRM();
  const [activeTab, setActiveTab] = useState<CrmTab>('clients');
  const [historyContext, setHistoryContext] = useState<HistoryContext | null>(null);

  const tabs: { id: CrmTab; label: string; icon: React.ComponentType<any> }[] = [
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'leads', label: 'Leads', icon: UserPlus },
    { id: 'pipeline', label: 'Pipeline', icon: BarChart3 },
    { id: 'history', label: 'Histórico', icon: History },
  ];

  const handleViewClientHistory = (clientId: string, clientName: string) => {
    setHistoryContext({ entityType: 'client', entityId: clientId, entityName: clientName });
    setActiveTab('history');
  };

  const handleBackFromHistory = () => {
    setHistoryContext(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Briefcase className="h-8 w-8 text-yellow-500" />
            Comercial / CRM
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gestão de clientes, leads e pipeline comercial
          </p>
        </div>

        {/* Summary Cards */}
        <div className="flex gap-3">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{clients.length}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Clientes</div>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{leads.length}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Leads</div>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {leads.filter(l => l.status === 'negotiation').length}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Em Negociação</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-1" aria-label="CRM Tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id !== 'history') setHistoryContext(null);
                }}
                className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                  isActive
                    ? 'border-yellow-500 text-yellow-600 dark:text-yellow-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'clients' && (
          <ClientList onViewHistory={handleViewClientHistory} />
        )}
        {activeTab === 'leads' && <LeadList />}
        {activeTab === 'pipeline' && <LeadPipeline />}
        {activeTab === 'history' && (
          <CrmHistoryView
            entityType={historyContext?.entityType}
            entityId={historyContext?.entityId}
            entityName={historyContext?.entityName}
            onBack={historyContext ? handleBackFromHistory : undefined}
          />
        )}
      </div>
    </div>
  );
};

export default CrmPage;
