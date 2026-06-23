import React, { useEffect, useState } from 'react';
import {
  X,
  Maximize2,
  Minimize2,
  Wrench,
  Settings,
  Zap,
  Fuel,
  MapPin,
  DollarSign,
  Hash,
  Calendar,
  FileText,
  Clock,
  History,
  Edit,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Building2,
  User,
} from 'lucide-react';
import { useEquipment } from '../hooks/useEquipment';
import {
  EQUIPMENT_STATUS_LABELS,
  EQUIPMENT_STATUS_COLORS,
  FUEL_TYPE_LABELS,
} from '../types';
import type { Equipment, ContractEquipment } from '../types';

interface EquipmentDetailModalProps {
  equipment: Equipment;
  onClose: () => void;
  onEdit: () => void;
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

const EquipmentDetailModal: React.FC<EquipmentDetailModalProps> = ({ equipment, onClose, onEdit }) => {
  const { getEquipmentRentalHistory } = useEquipment();
  const [isExpanded, setIsExpanded] = useState(false);
  const [rentalHistory, setRentalHistory] = useState<ContractEquipment[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await getEquipmentRentalHistory(equipment.id);
        setRentalHistory(history);
      } catch {
        setRentalHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    };
    loadHistory();
  }, [equipment.id, getEquipmentRentalHistory]);

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
              <div className={`p-2 sm:p-2.5 rounded-xl bg-egen-navy shadow-lg flex-shrink-0`}>
                <Wrench className="h-5 w-5 text-white" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <h2 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100 leading-tight truncate">
                  {equipment.name}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{equipment.code}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 ml-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hidden sm:block"
                title={isExpanded ? 'Minimizar' : 'Expandir'}
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
          <div className="mb-5">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium ${EQUIPMENT_STATUS_COLORS[equipment.status]}`}>
              {equipment.status === 'available' ? <CheckCircle2 className="h-4 w-4" /> :
               equipment.status === 'maintenance' ? <AlertTriangle className="h-4 w-4" /> :
               <Clock className="h-4 w-4" />}
              {EQUIPMENT_STATUS_LABELS[equipment.status]}
            </span>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {equipment.brand && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                <Settings className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Marca / Modelo</p>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {equipment.brand}{equipment.model ? ` / ${equipment.model}` : ''}
                  </p>
                </div>
              </div>
            )}
            {equipment.powerKva != null && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                <Zap className="h-4 w-4 text-yellow-500 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Potencia</p>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{equipment.powerKva} kVA</p>
                </div>
              </div>
            )}
            {equipment.fuelType && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                <Fuel className="h-4 w-4 text-orange-500 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Combustivel</p>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{FUEL_TYPE_LABELS[equipment.fuelType]}</p>
                </div>
              </div>
            )}
            {equipment.yearManufacture != null && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Ano Fabricacao</p>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{equipment.yearManufacture}</p>
                </div>
              </div>
            )}
            {equipment.serialNumber && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                <Hash className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Numero de Serie</p>
                  <p className="text-sm font-mono font-medium text-gray-700 dark:text-gray-300">{equipment.serialNumber}</p>
                </div>
              </div>
            )}
            {equipment.location && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Localizacao</p>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{equipment.location}</p>
                </div>
              </div>
            )}
          </div>

          {/* Rental Values */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-yellow-500" />
              Valores de Locacao
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl text-center">
                <p className="text-xs text-gray-400 dark:text-gray-500">Diaria</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(equipment.rentalDailyRate)}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl text-center">
                <p className="text-xs text-gray-400 dark:text-gray-500">Mensal</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(equipment.rentalMonthlyRate)}</p>
              </div>
            </div>
          </div>

          {/* Description / Notes */}
          {(equipment.description || equipment.notes) && (
            <div className="mb-6 space-y-3">
              {equipment.description && (
                <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-1 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" /> Descricao Tecnica
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{equipment.description}</p>
                </div>
              )}
              {equipment.notes && (
                <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Observacoes</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{equipment.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Image */}
          {equipment.imageUrl && (
            <div className="mb-6">
              <a href={equipment.imageUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-yellow-600 dark:text-yellow-400 hover:underline">
                <ExternalLink className="h-4 w-4" /> Ver imagem do equipamento
              </a>
            </div>
          )}

          {/* Rental History */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <History className="h-4 w-4 text-yellow-500" />
              Historico de Locacoes
            </h4>

            {historyLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 text-yellow-500 animate-spin" />
              </div>
            ) : rentalHistory.length === 0 ? (
              <div className="text-center py-6 text-gray-400 dark:text-gray-500">
                <History className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhuma locacao registrada para este equipamento.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {rentalHistory.map((rental) => (
                  <div
                    key={rental.id}
                    className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            {rental.contractTitle || `Contrato ${rental.contractCode}`}
                          </p>
                          {rental.clientName && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                              <Building2 className="h-3 w-3" /> {rental.clientName}
                            </p>
                          )}
                        </div>
                      </div>
                      {rental.rentalValue != null && (
                        <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(rental.rentalValue)}
                        </span>
                      )}
                    </div>
                    {(rental.deliveryDate || rental.returnDate) && (
                      <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
                        {rental.deliveryDate && <span>Entrega: {formatDate(rental.deliveryDate)}</span>}
                        {rental.returnDate && <span>Devolucao: {formatDate(rental.returnDate)}</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
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

export default EquipmentDetailModal;
