import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Wrench,
  Plus,
  Search,
  X,
  Save,
  MapPin,
  Package,
  Zap,
  Droplets,
  Calendar,
  DollarSign,
  Hash,
  FileText,
  Settings,
  Info,
  Edit,
  Trash2,
  Eye,
  History,
  Fuel,
  AlertTriangle,
  CheckCircle2,
  Clock,
  WrenchIcon,
} from 'lucide-react';
import { useEquipment } from '../hooks/useEquipment';
import { useNotification } from '../../../hooks/useNotification';
import { useDialog } from '../../../hooks/useDialog';
import Notification from '../../../components/Notification';
import ConfirmDialog from '../../../components/ConfirmDialog';
import EquipmentDetailModal from './EquipmentDetailModal';
import type { Equipment, EquipmentFormData, EquipmentStatus, FuelType } from '../types';
import {
  EQUIPMENT_STATUS_LABELS,
  EQUIPMENT_STATUS_COLORS,
  FUEL_TYPE_LABELS,
  EMPTY_EQUIPMENT_FORM,
} from '../types';

const formatCurrency = (value: number | null) => {
  if (value == null) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const statusIcons: Record<EquipmentStatus, React.ReactNode> = {
  available: <CheckCircle2 className="h-4 w-4 text-green-600" />,
  rented: <Clock className="h-4 w-4 text-blue-600" />,
  maintenance: <WrenchIcon className="h-4 w-4 text-yellow-600" />,
  unavailable: <AlertTriangle className="h-4 w-4 text-red-600" />,
};

const EquipmentPage: React.FC = () => {
  const { equipment, loading, error, addEquipment, updateEquipment, updateEquipmentStatus, deleteEquipment } = useEquipment();
  const { notification, showSuccess, showError, hideNotification } = useNotification();
  const { confirmDialog, showConfirmDialog, hideConfirmDialog } = useDialog();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Equipment | null>(null);
  const [formData, setFormData] = useState<EquipmentFormData>(EMPTY_EQUIPMENT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<EquipmentStatus | 'all'>('all');
  const [fuelTypeFilter, setFuelTypeFilter] = useState<FuelType | 'all'>('all');
  const [detailEquipment, setDetailEquipment] = useState<Equipment | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showForm) {
          setShowForm(false);
          setEditing(null);
        }
        if (detailEquipment) {
          setDetailEquipment(null);
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showForm, detailEquipment]);

  const resetForm = () => {
    setFormData(EMPTY_EQUIPMENT_FORM);
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) return;

    setIsSubmitting(true);
    try {
      if (editing) {
        await updateEquipment(editing.id, formData);
        showSuccess('Equipamento atualizado com sucesso!');
      } else {
        await addEquipment(formData);
        showSuccess('Equipamento cadastrado com sucesso!');
      }
      resetForm();
    } catch (err) {
      showError('Erro ao salvar equipamento. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (eq: Equipment) => {
    setFormData({
      code: eq.code,
      name: eq.name,
      description: eq.description,
      brand: eq.brand,
      model: eq.model,
      serialNumber: eq.serialNumber,
      powerKva: eq.powerKva?.toString() ?? '',
      fuelType: eq.fuelType ?? '',
      yearManufacture: eq.yearManufacture?.toString() ?? '',
      status: eq.status,
      rentalDailyRate: eq.rentalDailyRate?.toString() ?? '',
      rentalMonthlyRate: eq.rentalMonthlyRate?.toString() ?? '',
      location: eq.location,
      notes: eq.notes,
      imageUrl: eq.imageUrl,
    });
    setEditing(eq);
    setShowForm(true);
  };

  const handleDelete = (eq: Equipment) => {
    showConfirmDialog(
      'Confirmar Exclusao',
      `Tem certeza que deseja excluir o equipamento "${eq.name}" (${eq.code})? Esta acao nao pode ser desfeita.`,
      async () => {
        try {
          await deleteEquipment(eq.id);
          showSuccess('Equipamento excluido com sucesso!');
        } catch {
          showError('Erro ao excluir equipamento. Verifique se nao ha contratos vinculados.');
        }
      },
      { type: 'danger', confirmText: 'Excluir' }
    );
  };

  const handleStatusChange = async (eq: Equipment, newStatus: EquipmentStatus) => {
    try {
      await updateEquipmentStatus(eq.id, newStatus);
      showSuccess(`Status alterado para "${EQUIPMENT_STATUS_LABELS[newStatus]}"`);
    } catch {
      showError('Erro ao alterar status.');
    }
  };

  const filteredEquipment = equipment.filter((eq) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      eq.name.toLowerCase().includes(term) ||
      eq.code.toLowerCase().includes(term) ||
      eq.brand.toLowerCase().includes(term) ||
      eq.model.toLowerCase().includes(term) ||
      eq.serialNumber.toLowerCase().includes(term) ||
      eq.location.toLowerCase().includes(term);

    const matchesStatus = statusFilter === 'all' || eq.status === statusFilter;
    const matchesFuel = fuelTypeFilter === 'all' || eq.fuelType === fuelTypeFilter;

    return matchesSearch && matchesStatus && matchesFuel;
  });

  const counts = {
    total: equipment.length,
    available: equipment.filter(e => e.status === 'available').length,
    rented: equipment.filter(e => e.status === 'rented').length,
    maintenance: equipment.filter(e => e.status === 'maintenance').length,
    unavailable: equipment.filter(e => e.status === 'unavailable').length,
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
      <Notification
        type={notification.type}
        title={notification.title}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        type={confirmDialog.type}
        onConfirm={() => {
          confirmDialog.onConfirm?.();
          hideConfirmDialog();
        }}
        onCancel={hideConfirmDialog}
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Wrench className="h-8 w-8 text-yellow-500" />
            Equipamentos
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Controle de geradores e equipamentos
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Tabela
            </button>
          </div>
          <button
            onClick={() => { setFormData(EMPTY_EQUIPMENT_FORM); setEditing(null); setShowForm(true); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold rounded-xl shadow-md transition-all hover:shadow-lg active:scale-95"
          >
            <Plus className="h-5 w-5" /> Novo Equipamento
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: counts.total, color: 'bg-blue-500', icon: Package },
          { label: 'Disponiveis', value: counts.available, color: 'bg-green-500', icon: CheckCircle2 },
          { label: 'Locados', value: counts.rented, color: 'bg-yellow-500', icon: Clock },
          { label: 'Manutencao', value: counts.maintenance + counts.unavailable, color: 'bg-red-500', icon: WrenchIcon },
        ].map((card) => (
          <div
            key={card.label}
            className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 relative overflow-hidden`}
          >
            <div className={`absolute top-0 left-0 w-1 h-full ${card.color}`}></div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{card.label}</div>
              </div>
              <card.icon className={`h-8 w-8 ${card.color.replace('bg-', 'text-')} opacity-30`} />
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, codigo, marca, modelo, serial..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 dark:text-white transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as EquipmentStatus | 'all')}
          className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-yellow-500 dark:text-white cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20fill%3D%22none%22%20stroke%3D%22%236B6B6B%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_8px_center] bg-no-repeat pr-10"
        >
          <option value="all">Todos os Status</option>
          {Object.entries(EQUIPMENT_STATUS_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select
          value={fuelTypeFilter}
          onChange={(e) => setFuelTypeFilter(e.target.value as FuelType | 'all')}
          className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-yellow-500 dark:text-white cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20fill%3D%22none%22%20stroke%3D%22%236B6B6B%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_8px_center] bg-no-repeat pr-10"
        >
          <option value="all">Todos os Combustiveis</option>
          {Object.entries(FUEL_TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Card View */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredEquipment.length === 0 ? (
            <div className="col-span-full bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
              <Wrench className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 dark:text-gray-500 text-lg">
                {searchTerm || statusFilter !== 'all' || fuelTypeFilter !== 'all'
                  ? 'Nenhum equipamento encontrado com os filtros aplicados.'
                  : 'Nenhum equipamento cadastrado ainda.'}
              </p>
            </div>
          ) : (
            filteredEquipment.map((eq, index) => (
              <div
                key={eq.id}
                className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.03}s` }}
              >
                {/* Status bar */}
                <div className={`h-1.5 ${eq.status === 'available' ? 'bg-green-500' : eq.status === 'rented' ? 'bg-blue-500' : eq.status === 'maintenance' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>

                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">{eq.name}</h3>
                      <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5">{eq.code}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium flex-shrink-0 ml-2 ${EQUIPMENT_STATUS_COLORS[eq.status]}`}>
                      {statusIcons[eq.status]}
                      {EQUIPMENT_STATUS_LABELS[eq.status]}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    {eq.brand && eq.model && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Settings className="h-3.5 w-3.5 text-gray-400" />
                        <span className="truncate">{eq.brand} / {eq.model}</span>
                      </div>
                    )}
                    {eq.powerKva != null && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Zap className="h-3.5 w-3.5 text-yellow-500" />
                        <span>{eq.powerKva} kVA</span>
                      </div>
                    )}
                    {eq.fuelType && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Fuel className="h-3.5 w-3.5 text-orange-500" />
                        <span>{FUEL_TYPE_LABELS[eq.fuelType] || eq.fuelType}</span>
                      </div>
                    )}
                    {eq.location && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <MapPin className="h-3.5 w-3.5 text-gray-400" />
                        <span className="truncate">{eq.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <DollarSign className="h-3.5 w-3.5 text-green-500" />
                      <span>{formatCurrency(eq.rentalMonthlyRate)}{eq.rentalMonthlyRate != null ? '/mes' : ''}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-700 px-5 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-900/30">
                  <select
                    value={eq.status}
                    onChange={(e) => handleStatusChange(eq, e.target.value as EquipmentStatus)}
                    className="text-xs px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 cursor-pointer focus:ring-2 focus:ring-yellow-500 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20fill%3D%22none%22%20stroke%3D%22%236B6B6B%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m3%205%203%203%203-3%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_4px_center] bg-no-repeat pr-7"
                  >
                    {Object.entries(EQUIPMENT_STATUS_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setDetailEquipment(eq)}
                      className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg text-blue-500 transition-all hover:scale-110"
                      title="Detalhes"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(eq)}
                      className="p-1.5 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 rounded-lg text-yellow-600 transition-all hover:scale-110"
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(eq)}
                      className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-red-500 transition-all hover:scale-110"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Codigo</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Equipamento</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 hidden md:table-cell">Marca/Modelo</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 hidden lg:table-cell">Potencia</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 hidden lg:table-cell">Combustivel</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 hidden sm:table-cell">Valor/Mes</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredEquipment.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-gray-400 dark:text-gray-500">
                      {searchTerm || statusFilter !== 'all' || fuelTypeFilter !== 'all'
                        ? 'Nenhum equipamento encontrado com os filtros aplicados.'
                        : 'Nenhum equipamento cadastrado ainda.'}
                    </td>
                  </tr>
                ) : (
                  filteredEquipment.map((eq) => (
                    <tr
                      key={eq.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                      onClick={() => setDetailEquipment(eq)}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">{eq.code}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-white">{eq.name}</div>
                        {eq.serialNumber && (
                          <div className="text-xs text-gray-400 dark:text-gray-500">SN: {eq.serialNumber}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 hidden md:table-cell">
                        {eq.brand && eq.model ? `${eq.brand} / ${eq.model}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-300 hidden lg:table-cell">
                        {eq.powerKva != null ? `${eq.powerKva} kVA` : '—'}
                      </td>
                      <td className="px-4 py-3 text-center hidden lg:table-cell">
                        {eq.fuelType ? (
                          <span className="text-xs text-gray-600 dark:text-gray-300">{FUEL_TYPE_LABELS[eq.fuelType] || eq.fuelType}</span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${EQUIPMENT_STATUS_COLORS[eq.status]}`}>
                          {statusIcons[eq.status]}
                          {EQUIPMENT_STATUS_LABELS[eq.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300 hidden sm:table-cell">
                        {formatCurrency(eq.rentalMonthlyRate)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEdit(eq); }}
                            className="p-1.5 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 rounded-lg text-yellow-600 transition-all"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(eq); }}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-red-500 transition-all"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && createPortal(
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9999 }}
          className="flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) resetForm(); }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {editing ? 'Editar Equipamento' : 'Novo Equipamento'}
              </h3>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Codigo *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500"
                    placeholder="EQ-001"
                  />
                </div>
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome / Descricao *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500"
                    placeholder="Gerador 180 kVA"
                  />
                </div>
                {/* Brand */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Marca</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500"
                    placeholder="Cummins, MWM..."
                  />
                </div>
                {/* Model */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Modelo</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500"
                    placeholder="Modelo do gerador"
                  />
                </div>
                {/* Serial Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Numero de Serie</label>
                  <input
                    type="text"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500"
                    placeholder="SN-000000"
                  />
                </div>
                {/* Power kVA */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Potencia (kVA)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.powerKva}
                    onChange={(e) => setFormData({ ...formData, powerKva: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500"
                    placeholder="180"
                  />
                </div>
                {/* Fuel Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Combustivel</label>
                  <select
                    value={formData.fuelType}
                    onChange={(e) => setFormData({ ...formData, fuelType: e.target.value as FuelType | '' })}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20fill%3D%22none%22%20stroke%3D%22%236B6B6B%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_8px_center] bg-no-repeat pr-10"
                  >
                    <option value="">Selecione...</option>
                    {Object.entries(FUEL_TYPE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                {/* Year */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ano Fabricacao</label>
                  <input
                    type="number"
                    min="1900"
                    max="2100"
                    value={formData.yearManufacture}
                    onChange={(e) => setFormData({ ...formData, yearManufacture: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500"
                    placeholder="2024"
                  />
                </div>
                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as EquipmentStatus })}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20fill%3D%22none%22%20stroke%3D%22%236B6B6B%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_8px_center] bg-no-repeat pr-10"
                  >
                    {Object.entries(EQUIPMENT_STATUS_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Rental Values */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-yellow-500" />
                  Valores de Locacao
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Diaria (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.rentalDailyRate}
                      onChange={(e) => setFormData({ ...formData, rentalDailyRate: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500"
                      placeholder="0,00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mensal (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.rentalMonthlyRate}
                      onChange={(e) => setFormData({ ...formData, rentalMonthlyRate: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500"
                      placeholder="0,00"
                    />
                  </div>
                </div>
              </div>

              {/* Extra Info */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Localizacao</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500"
                      placeholder="Patio, Obra X..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL da Imagem</label>
                    <input
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500"
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descricao Tecnica</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 resize-none"
                    placeholder="Descricao tecnica do equipamento..."
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observacoes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 resize-none"
                    placeholder="Observacoes gerais..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  <Save className="h-4 w-4" /> {editing ? 'Atualizar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Detail Modal */}
      {detailEquipment && createPortal(
        <EquipmentDetailModal
          equipment={detailEquipment}
          onClose={() => setDetailEquipment(null)}
          onEdit={() => {
            const eq = detailEquipment;
            setDetailEquipment(null);
            setTimeout(() => handleEdit(eq), 100);
          }}
        />,
        document.body
      )}
    </div>
  );
};

export default EquipmentPage;
