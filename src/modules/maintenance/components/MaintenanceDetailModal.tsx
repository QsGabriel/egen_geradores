import React, { useEffect, useState } from 'react';
import {
  X,
  Maximize2,
  Minimize2,
  Wrench,
  Edit,
  AlertTriangle,
  Calendar,
  Clock,
  CheckCircle2,
  DollarSign,
  User,
  FileText,
  ExternalLink,
  Settings,
  HardDrive,
  Tag,
} from 'lucide-react';
import {
  MAINTENANCE_TYPE_LABELS,
  MAINTENANCE_PRIORITY_LABELS,
  MAINTENANCE_PRIORITY_COLORS,
  MAINTENANCE_STATUS_LABELS,
  MAINTENANCE_STATUS_COLORS,
} from '../types';
import type { MaintenanceOrder, MaintenanceStatus } from '../types';

interface MaintenanceDetailModalProps {
  order: MaintenanceOrder;
  onClose: () => void;
  onEdit: () => void;
  onStatusChange: (id: string, status: MaintenanceStatus) => void;
}

const formatCurrency = (value: number | null) => {
  if (value == null) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
};

const MaintenanceDetailModal: React.FC<MaintenanceDetailModalProps> = ({ order, onClose, onEdit, onStatusChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] animate-fade-in p-2 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`bg-white dark:bg-egen-dark-surface rounded-2xl shadow-2xl flex flex-col animate-scale-in transition-all duration-300 w-full ${
          isExpanded
            ? 'sm:w-[95vw] h-[95vh]'
            : 'max-w-[95vw] sm:max-w-[650px] max-h-[90vh] sm:max-h-[85vh]'
        }`}
      >
        {/* Header */}
        <div className="relative overflow-hidden rounded-t-2xl flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-r from-egen-navy to-egen-blue opacity-10 dark:opacity-20"></div>
          <div className="relative flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b-2 border-gray-100 dark:border-white/5">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <div className="p-2 sm:p-2.5 rounded-xl bg-egen-navy shadow-lg flex-shrink-0">
                <Wrench className="h-5 w-5 text-white" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <h2 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100 leading-tight truncate">
                  {order.code}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">{order.equipmentName}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 ml-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hidden sm:block"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all duration-200 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-3 pt-4 pb-4 sm:px-6 sm:pt-6 sm:pb-6 overflow-y-auto">
          {/* Status Badge */}
          <div className="mb-5 flex items-center gap-3 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium ${MAINTENANCE_STATUS_COLORS[order.status]}`}>
              {order.status === 'completed' ? <CheckCircle2 className="h-4 w-4" /> :
               order.status === 'in_progress' ? <Settings className="h-4 w-4" /> :
               order.status === 'cancelled' ? <AlertTriangle className="h-4 w-4" /> :
               <Clock className="h-4 w-4" />}
              {MAINTENANCE_STATUS_LABELS[order.status]}
            </span>
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${MAINTENANCE_PRIORITY_COLORS[order.priority]}`}>
              {MAINTENANCE_PRIORITY_LABELS[order.priority]}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">{MAINTENANCE_TYPE_LABELS[order.type]}</span>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
              <HardDrive className="h-4 w-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500">Equipamento</p>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{order.equipmentName}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">{order.equipmentCode}</p>
              </div>
            </div>
            {order.technician && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                <User className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Tecnico</p>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{order.technician}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
              <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500">Data Agendada</p>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{formatDate(order.scheduledDate)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
              <CheckCircle2 className="h-4 w-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500">Data Conclusao</p>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{formatDate(order.completedDate)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
              <DollarSign className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500">Custo</p>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{formatCurrency(order.cost)}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-5">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4 text-yellow-500" /> Descricao
            </h4>
            <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{order.description}</p>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="mb-5">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Observacoes</h4>
              <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{order.notes}</p>
              </div>
            </div>
          )}

          {/* Service Order File */}
          {order.serviceOrderUrl && (
            <div className="mb-5">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4 text-yellow-500" /> Ordem de Servico
              </h4>
              <a
                href={order.serviceOrderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all text-sm font-medium"
              >
                <ExternalLink className="h-4 w-4" /> Visualizar OS anexada
              </a>
            </div>
          )}

          {/* Status Change */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Alterar Status</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(MAINTENANCE_STATUS_LABELS).map(([key, label]) => {
                const isActive = order.status === key;
                return (
                  <button
                    key={key}
                    onClick={() => onStatusChange(order.id, key as MaintenanceStatus)}
                    disabled={isActive}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? `${MAINTENANCE_STATUS_COLORS[key as MaintenanceStatus]} cursor-default`
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-3 py-3 sm:px-6 sm:py-4 border-t-2 border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 rounded-b-2xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400 hidden sm:block">Pressione ESC para fechar</p>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={onEdit}
                className="px-4 py-2 text-sm font-medium text-yellow-600 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-600 rounded-xl hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-all flex items-center gap-1.5"
              >
                <Edit className="h-4 w-4" /> Editar
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-white rounded-xl bg-gradient-to-r from-egen-navy to-egen-blue hover:shadow-lg transition-all duration-200 flex-1 sm:flex-initial"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceDetailModal;
