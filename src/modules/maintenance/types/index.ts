/**
 * Maintenance Module Types
 * Tipos para o modulo de Manutencao & Prazos
 */

export type MaintenanceType = 'preventive' | 'corrective';

export type MaintenancePriority = 'urgent' | 'priority' | 'common';

export type MaintenanceStatus = 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface MaintenanceOrder {
  id: string;
  code: string;
  equipmentId: string;
  equipmentName: string;
  equipmentCode: string;
  type: MaintenanceType;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  description: string;
  scheduledDate: string | null;
  completedDate: string | null;
  cost: number | null;
  technician: string;
  notes: string;
  serviceOrderUrl: string;
  requesterId: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceFormData {
  equipmentId: string;
  type: MaintenanceType;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  description: string;
  scheduledDate: string;
  completedDate: string;
  cost: string;
  technician: string;
  notes: string;
  serviceOrderFile: File | null;
}

export const MAINTENANCE_TYPE_LABELS: Record<MaintenanceType, string> = {
  preventive: 'Preventiva',
  corrective: 'Corretiva',
};

export const MAINTENANCE_PRIORITY_LABELS: Record<MaintenancePriority, string> = {
  urgent: 'Urgente',
  priority: 'Prioritaria',
  common: 'Comum',
};

export const MAINTENANCE_PRIORITY_COLORS: Record<MaintenancePriority, string> = {
  urgent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  priority: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  common: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
};

export const MAINTENANCE_STATUS_LABELS: Record<MaintenanceStatus, string> = {
  pending: 'Pendente',
  scheduled: 'Agendada',
  in_progress: 'Em Andamento',
  completed: 'Concluida',
  cancelled: 'Cancelada',
};

export const MAINTENANCE_STATUS_COLORS: Record<MaintenanceStatus, string> = {
  pending: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export const EMPTY_MAINTENANCE_FORM: MaintenanceFormData = {
  equipmentId: '',
  type: 'preventive',
  priority: 'common',
  status: 'pending',
  description: '',
  scheduledDate: '',
  completedDate: '',
  cost: '',
  technician: '',
  notes: '',
  serviceOrderFile: null,
};
