import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Wrench,
  Plus,
  Search,
  X,
  Save,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  Calendar,
  Clock,
  CheckCircle2,
  Download,
  Upload,
  FileText,
  DollarSign,
  User,
  Settings,
  HardDrive,
  Bell,
  BellRing,
  History,
  Filter,
  ArrowUpDown,
} from 'lucide-react';
import { useMaintenance } from '../hooks/useMaintenance';
import { useNotification } from '../../../hooks/useNotification';
import { useDialog } from '../../../hooks/useDialog';
import Notification from '../../../components/Notification';
import ConfirmDialog from '../../../components/ConfirmDialog';
import MaintenanceDetailModal from './MaintenanceDetailModal';
import type { MaintenanceOrder, MaintenanceFormData, MaintenanceType, MaintenancePriority, MaintenanceStatus } from '../types';
import {
  MAINTENANCE_TYPE_LABELS,
  MAINTENANCE_PRIORITY_LABELS,
  MAINTENANCE_PRIORITY_COLORS,
  MAINTENANCE_STATUS_LABELS,
  MAINTENANCE_STATUS_COLORS,
  EMPTY_MAINTENANCE_FORM,
} from '../types';

const formatCurrency = (value: number | null) => {
  if (value == null) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

const MaintenancePage: React.FC = () => {
  const {
    orders, equipmentList, loading, error,
    addMaintenanceOrder, updateMaintenanceOrder, updateMaintenanceStatus, deleteMaintenanceOrder,
    getAlerts, getOverdueAlerts, exportToExcel,
  } = useMaintenance();
  const { notification, showSuccess, showError, hideNotification } = useNotification();
  const { confirmDialog, showConfirmDialog, hideConfirmDialog } = useDialog();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<MaintenanceOrder | null>(null);
  const [formData, setFormData] = useState<MaintenanceFormData>(EMPTY_MAINTENANCE_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<MaintenanceStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<MaintenanceType | 'all'>('all');
  const [detailOrder, setDetailOrder] = useState<MaintenanceOrder | null>(null);
  const [showAlerts, setShowAlerts] = useState(true);

  const alerts = getAlerts();
  const overdueAlerts = getOverdueAlerts();

  const resetForm = () => {
    setFormData(EMPTY_MAINTENANCE_FORM);
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.equipmentId || !formData.description.trim()) return;

    setIsSubmitting(true);
    try {
      if (editing) {
        await updateMaintenanceOrder(editing.id, formData);
        showSuccess('Ordem de manutencao atualizada!');
      } else {
        await addMaintenanceOrder(formData);
        showSuccess('Ordem de manutencao criada!');
      }
      resetForm();
    } catch (err) {
      showError('Erro ao salvar ordem de manutencao.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (order: MaintenanceOrder) => {
    setFormData({
      equipmentId: order.equipmentId,
      type: order.type,
      priority: order.priority,
      status: order.status,
      description: order.description,
      scheduledDate: order.scheduledDate || '',
      completedDate: order.completedDate || '',
      cost: order.cost?.toString() ?? '',
      technician: order.technician,
      notes: order.notes,
      serviceOrderFile: null,
    });
    setEditing(order);
    setShowForm(true);
  };

  const handleDelete = (order: MaintenanceOrder) => {
    showConfirmDialog(
      'Confirmar Exclusao',
      `Tem certeza que deseja excluir a OS "${order.code}"?`,
      async () => {
        try {
          await deleteMaintenanceOrder(order.id);
          showSuccess('OS excluida!');
        } catch {
          showError('Erro ao excluir OS.');
        }
      },
      { type: 'danger', confirmText: 'Excluir' }
    );
  };

  const handleStatusChange = async (id: string, status: MaintenanceStatus) => {
    try {
      await updateMaintenanceStatus(id, status);
      showSuccess('Status atualizado!');
    } catch {
      showError('Erro ao atualizar status.');
    }
  };

  const filteredOrders = orders.filter((o) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      o.code.toLowerCase().includes(term) ||
      o.equipmentName.toLowerCase().includes(term) ||
      o.equipmentCode.toLowerCase().includes(term) ||
      o.description.toLowerCase().includes(term) ||
      o.technician.toLowerCase().includes(term);

    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchesType = typeFilter === 'all' || o.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const counts = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    inProgress: orders.filter(o => o.status === 'in_progress' || o.status === 'scheduled').length,
    completed: orders.filter(o => o.status === 'completed').length,
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
        onConfirm={() => { confirmDialog.onConfirm?.(); hideConfirmDialog(); }}
        onCancel={hideConfirmDialog}
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Wrench className="h-8 w-8 text-yellow-500" />
            Manutencao
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Controle de manutencoes preventivas e corretivas
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportToExcel}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-green-300 dark:border-green-600 text-green-700 dark:text-green-400 rounded-xl hover:bg-green-50 dark:hover:bg-green-900/20 transition-all text-sm font-medium"
          >
            <Download className="h-4 w-4" /> Relatorio AUVO
          </button>
          <button
            onClick={() => { setFormData(EMPTY_MAINTENANCE_FORM); setEditing(null); setShowForm(true); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold rounded-xl shadow-md transition-all hover:shadow-lg active:scale-95"
          >
            <Plus className="h-5 w-5" /> Nova OS
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: counts.total, color: 'bg-blue-500', icon: FileText },
          { label: 'Pendentes', value: counts.pending, color: 'bg-yellow-500', icon: Clock },
          { label: 'Em Andamento', value: counts.inProgress, color: 'bg-orange-500', icon: Settings },
          { label: 'Concluidas', value: counts.completed, color: 'bg-green-500', icon: CheckCircle2 },
        ].map((card) => (
          <div key={card.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 relative overflow-hidden">
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

      {/* Alerts Section */}
      {alerts.length > 0 && showAlerts && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between px-5 py-3 bg-amber-100/50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2">
              {overdueAlerts.length > 0 ? (
                <BellRing className="h-5 w-5 text-red-500 animate-badge-pulse" />
              ) : (
                <Bell className="h-5 w-5 text-amber-600" />
              )}
              <h3 className="font-semibold text-amber-900 dark:text-amber-100 text-sm">
                {overdueAlerts.length > 0
                  ? `${overdueAlerts.length} manutencao(oes) vencida(s)!`
                  : `${alerts.length} manutencao(oes) proxima(s) do prazo`}
              </h3>
            </div>
            <button
              onClick={() => setShowAlerts(false)}
              className="p-1 hover:bg-amber-200 dark:hover:bg-amber-800 rounded-lg text-amber-600 dark:text-amber-400"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="divide-y divide-amber-200 dark:divide-amber-800 max-h-48 overflow-y-auto">
            {alerts.map((alert) => {
              const isOverdue = overdueAlerts.some(a => a.id === alert.id);
              return (
                <div
                  key={alert.id}
                  className={`flex items-center justify-between px-5 py-3 hover:bg-amber-100/30 dark:hover:bg-amber-900/20 transition-colors cursor-pointer ${isOverdue ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}
                  onClick={() => { setDetailOrder(alert); setShowAlerts(false); }}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {isOverdue ? (
                      <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                    ) : (
                      <Clock className="h-4 w-4 text-amber-500 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                        {alert.code} - {alert.equipmentName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {alert.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    {alert.scheduledDate ? (
                      <span className={`text-xs font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        {isOverdue ? 'Vencida em ' : 'Agendada: '}{formatDate(alert.scheduledDate)}
                      </span>
                    ) : (
                      <span className="text-xs text-red-500 font-medium">Nao agendada</span>
                    )}
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${MAINTENANCE_PRIORITY_COLORS[alert.priority]}`}>
                      {MAINTENANCE_PRIORITY_LABELS[alert.priority]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por codigo, equipamento, descricao, tecnico..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 dark:text-white transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as MaintenanceStatus | 'all')}
          className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-yellow-500 dark:text-white cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20fill%3D%22none%22%20stroke%3D%22%236B6B6B%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_8px_center] bg-no-repeat pr-10"
        >
          <option value="all">Todos os Status</option>
          {Object.entries(MAINTENANCE_STATUS_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as MaintenanceType | 'all')}
          className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-yellow-500 dark:text-white cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20fill%3D%22none%22%20stroke%3D%22%236B6B6B%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_8px_center] bg-no-repeat pr-10"
        >
          <option value="all">Todos os Tipos</option>
          {Object.entries(MAINTENANCE_TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">OS</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Equipamento</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 hidden md:table-cell">Tipo</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Prioridade</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 hidden lg:table-cell">Agendada</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 hidden sm:table-cell">Custo</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400 dark:text-gray-500">
                    {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                      ? 'Nenhuma OS encontrada com os filtros aplicados.'
                      : 'Nenhuma ordem de manutencao registrada.'}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isOverdue = overdueAlerts.some(a => a.id === order.id);
                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${isOverdue ? 'bg-red-50/30 dark:bg-red-900/5' : ''}`}
                      onClick={() => setDetailOrder(order)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {isOverdue && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
                          <span className="font-mono text-xs font-medium text-gray-700 dark:text-gray-300">{order.code}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-white text-sm">{order.equipmentName}</div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">{order.equipmentCode}</div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-gray-600 dark:text-gray-400">{MAINTENANCE_TYPE_LABELS[order.type]}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium ${MAINTENANCE_PRIORITY_COLORS[order.priority]}`}>
                          {MAINTENANCE_PRIORITY_LABELS[order.priority]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <select
                          value={order.status}
                          onChange={(e) => { e.stopPropagation(); handleStatusChange(order.id, e.target.value as MaintenanceStatus); }}
                          onClick={(e) => e.stopPropagation()}
                          className={`text-xs px-2 py-1 rounded-lg border-0 font-medium cursor-pointer focus:ring-2 focus:ring-yellow-500 ${MAINTENANCE_STATUS_COLORS[order.status]}`}
                        >
                          {Object.entries(MAINTENANCE_STATUS_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 hidden lg:table-cell">
                        {order.scheduledDate ? formatDate(order.scheduledDate) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-300 hidden sm:table-cell">
                        {formatCurrency(order.cost)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); setDetailOrder(order); }}
                            className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg text-blue-500 transition-all"
                            title="Detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEdit(order); }}
                            className="p-1.5 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 rounded-lg text-yellow-600 transition-all"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(order); }}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-red-500 transition-all"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

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
                {editing ? 'Editar OS' : 'Nova Ordem de Servico'}
              </h3>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
              {/* Equipment Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Equipamento *</label>
                <select
                  required
                  value={formData.equipmentId}
                  onChange={(e) => setFormData({ ...formData, equipmentId: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20fill%3D%22none%22%20stroke%3D%22%236B6B6B%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_8px_center] bg-no-repeat pr-10"
                >
                  <option value="">Selecione o equipamento...</option>
                  {equipmentList.map((eq) => (
                    <option key={eq.id} value={eq.id}>{eq.name} ({eq.code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as MaintenanceType })}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20fill%3D%22none%22%20stroke%3D%22%236B6B6B%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_8px_center] bg-no-repeat pr-10"
                  >
                    {Object.entries(MAINTENANCE_TYPE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prioridade</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as MaintenancePriority })}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20fill%3D%22none%22%20stroke%3D%22%236B6B6B%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_8px_center] bg-no-repeat pr-10"
                  >
                    {Object.entries(MAINTENANCE_PRIORITY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as MaintenanceStatus })}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20fill%3D%22none%22%20stroke%3D%22%236B6B6B%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_8px_center] bg-no-repeat pr-10"
                  >
                    {Object.entries(MAINTENANCE_STATUS_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descricao *</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 resize-none"
                  placeholder="Descreva o servico a ser realizado..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data Agendada</label>
                  <input
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data Conclusao</label>
                  <input
                    type="date"
                    value={formData.completedDate}
                    onChange={(e) => setFormData({ ...formData, completedDate: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tecnico</label>
                  <input
                    type="text"
                    value={formData.technician}
                    onChange={(e) => setFormData({ ...formData, technician: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500"
                    placeholder="Nome do tecnico"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Custo (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500"
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
                  <Upload className="h-4 w-4 text-yellow-500" /> Anexar OS (PDF/Imagem)
                </label>
                {editing && formData.serviceOrderFile === null && editing.serviceOrderUrl && (
                  <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-blue-600 dark:text-blue-400 flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5" /> OS ja anexada.
                    <a href={editing.serviceOrderUrl} target="_blank" rel="noopener noreferrer" className="underline">Ver arquivo</a>
                  </div>
                )}
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setFormData({ ...formData, serviceOrderFile: file });
                  }}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-yellow-500 file:text-gray-900 hover:file:bg-yellow-600 file:cursor-pointer file:transition-colors"
                />
                {formData.serviceOrderFile && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Arquivo selecionado: {formData.serviceOrderFile.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observacoes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 resize-none"
                  placeholder="Observacoes adicionais..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button type="button" onClick={resetForm} className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  <Save className="h-4 w-4" /> {editing ? 'Atualizar' : 'Criar OS'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Detail Modal */}
      {detailOrder && createPortal(
        <MaintenanceDetailModal
          order={detailOrder}
          onClose={() => setDetailOrder(null)}
          onEdit={() => {
            const o = detailOrder;
            setDetailOrder(null);
            setTimeout(() => handleEdit(o), 100);
          }}
          onStatusChange={handleStatusChange}
        />,
        document.body
      )}
    </div>
  );
};

export default MaintenancePage;
