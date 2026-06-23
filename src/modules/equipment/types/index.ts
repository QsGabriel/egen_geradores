/**
 * Equipment Module Types
 * Tipos e interfaces para o modulo de Controle de Equipamentos (Geradores)
 */

export type EquipmentStatus = 'available' | 'rented' | 'maintenance' | 'unavailable';

export type FuelType = 'diesel' | 'gas' | 'bi_fuel' | 'other';

export interface Equipment {
  id: string;
  code: string;
  name: string;
  description: string;
  brand: string;
  model: string;
  serialNumber: string;
  powerKva: number | null;
  fuelType: FuelType | null;
  yearManufacture: number | null;
  status: EquipmentStatus;
  rentalDailyRate: number | null;
  rentalMonthlyRate: number | null;
  location: string;
  notes: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentFormData {
  code: string;
  name: string;
  description: string;
  brand: string;
  model: string;
  serialNumber: string;
  powerKva: string;
  fuelType: FuelType | '';
  yearManufacture: string;
  status: EquipmentStatus;
  rentalDailyRate: string;
  rentalMonthlyRate: string;
  location: string;
  notes: string;
  imageUrl: string;
}

export interface ContractEquipment {
  id: string;
  contractId: string;
  equipmentId: string;
  rentalValue: number | null;
  deliveryDate: string | null;
  returnDate: string | null;
  notes: string;
  createdAt: string;
  contractCode?: string;
  contractTitle?: string;
  clientName?: string;
}

export interface EquipmentFilters {
  search: string;
  status: EquipmentStatus | 'all';
  fuelType: FuelType | 'all';
}

export const EQUIPMENT_STATUS_LABELS: Record<EquipmentStatus, string> = {
  available: 'Disponivel',
  rented: 'Locado',
  maintenance: 'Em Manutencao',
  unavailable: 'Indisponivel',
};

export const EQUIPMENT_STATUS_COLORS: Record<EquipmentStatus, string> = {
  available: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  rented: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  maintenance: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  unavailable: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export const FUEL_TYPE_LABELS: Record<FuelType, string> = {
  diesel: 'Diesel',
  gas: 'Gas',
  bi_fuel: 'Bi-Combustivel',
  other: 'Outro',
};

export const EMPTY_EQUIPMENT_FORM: EquipmentFormData = {
  code: '',
  name: '',
  description: '',
  brand: '',
  model: '',
  serialNumber: '',
  powerKva: '',
  fuelType: '',
  yearManufacture: '',
  status: 'available',
  rentalDailyRate: '',
  rentalMonthlyRate: '',
  location: '',
  notes: '',
  imageUrl: '',
};
