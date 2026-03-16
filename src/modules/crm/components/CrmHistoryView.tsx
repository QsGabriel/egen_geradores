import React, { useEffect, useState } from 'react';
import { History, Clock, User, ArrowLeft, Filter } from 'lucide-react';
import { useCRM } from '../hooks/useCRM';
import type { CrmEntityType } from '../types';
import { CRM_ENTITY_TYPE_LABELS } from '../types';

interface CrmHistoryViewProps {
  /** If provided, filters history to a specific entity */
  entityType?: CrmEntityType;
  entityId?: string;
  entityName?: string;
  onBack?: () => void;
}

const ENTITY_TYPE_COLORS: Record<CrmEntityType, string> = {
  client: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  lead: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  contract: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  quotation: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  equipment: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

const CrmHistoryView: React.FC<CrmHistoryViewProps> = ({
  entityType,
  entityId,
  entityName,
  onBack,
}) => {
  const { history, getEntityHistory } = useCRM();
  const [typeFilter, setTypeFilter] = useState<CrmEntityType | 'all'>('all');

  useEffect(() => {
    if (entityType && entityId) {
      getEntityHistory(entityType, entityId);
    }
  }, [entityType, entityId, getEntityHistory]);

  const filteredHistory = history.filter((h) => {
    if (entityType && entityId) {
      return h.entityType === entityType && h.entityId === entityId;
    }
    if (typeFilter !== 'all') {
      return h.entityType === typeFilter;
    }
    return true;
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </button>
        )}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <History className="h-7 w-7 text-yellow-500" />
            {entityName ? `Histórico — ${entityName}` : 'Histórico CRM'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {filteredHistory.length} registro{filteredHistory.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Filter (only when showing all history) */}
      {!entityType && (
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as CrmEntityType | 'all')}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-yellow-500 dark:text-white"
          >
            <option value="all">Todas as Entidades</option>
            {Object.entries(CRM_ENTITY_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500">
            Nenhum registro de histórico encontrado.
          </div>
        ) : (
          <div className="space-y-1">
            {filteredHistory.map((entry, index) => (
              <div key={entry.id} className="flex gap-4">
                {/* Timeline dot */}
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-yellow-500 mt-1.5" />
                  {index < filteredHistory.length - 1 && (
                    <div className="w-0.5 bg-gray-200 dark:bg-gray-700 flex-1 mt-1" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-6">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${ENTITY_TYPE_COLORS[entry.entityType]}`}>
                      {CRM_ENTITY_TYPE_LABELS[entry.entityType]}
                    </span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {entry.description}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 dark:text-gray-500">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" /> {entry.createdBy}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {formatDate(entry.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CrmHistoryView;
