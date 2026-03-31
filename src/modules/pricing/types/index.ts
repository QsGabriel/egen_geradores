/**
 * EGEN System - Pricing Types
 * Tipos TypeScript para as tabelas de precificação
 */

// ============================================
// ENUMS E CONSTANTES
// ============================================

export type RentalPeriod = 'mensal' | 'quinzenal' | 'semanal';
export type EquipmentType = 'gerador' | 'torre_diesel' | 'torre_solar';
export type AccessoryCategory = 'deslocamento' | 'servico' | 'qta' | 'tanque' | 'outro';
export type HoursPackage = 'standby' | '120h' | '240h' | '360h' | 'continuous';

export const RentalPeriodLabels: Record<RentalPeriod, string> = {
  mensal: 'Mensal (30 dias)',
  quinzenal: 'Quinzenal (15 dias)',
  semanal: 'Semanal (7 dias)',
};

export const RentalPeriodDays: Record<RentalPeriod, number> = {
  mensal: 30,
  quinzenal: 15,
  semanal: 7,
};

export const EquipmentTypeLabels: Record<EquipmentType, string> = {
  gerador: 'Gerador',
  torre_diesel: 'Torre de Iluminação Diesel',
  torre_solar: 'Torre de Iluminação Solar',
};

export const AccessoryCategoryLabels: Record<AccessoryCategory, string> = {
  deslocamento: 'Deslocamento',
  servico: 'Serviço',
  qta: 'Quadro de Transferência',
  tanque: 'Tanque',
  outro: 'Outro',
};

export const HoursPackageLabels: Record<HoursPackage, string> = {
  standby: 'Stand-By (35h/mês)',
  '120h': '120h/mês (04h/dia)',
  '240h': '240h/mês (08h/dia)',
  '360h': '360h/mês (12h/dia)',
  continuous: 'Contínuo/Livre (24h/dia)',
};

// ============================================
// INTERFACES PRINCIPAIS
// ============================================

/**
 * Preço de Gerador
 */
export interface PricingGenerator {
  id: string;
  powerKva: string;
  powerMinKva: number | null;
  powerMaxKva: number | null;
  equipmentType: EquipmentType;
  rentalPeriod: RentalPeriod;
  priceStandby: number | null;
  price120h: number | null;
  price240h: number | null;
  price360h: number | null;
  priceContinuous: number | null;
  priceExtraHour: number | null;
  priceCableKit380v: number | null;
  priceCableKit220v: number | null;
  pricePreventiveMaintenance: number | null;
  discountLimitPercent: number;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Preço de Acessório/Serviço
 */
export interface PricingAccessory {
  id: string;
  itemCode: string;
  itemName: string;
  category: AccessoryCategory;
  priceMonthly: number | null;
  priceBiweekly: number | null;
  priceWeekly: number | null;
  priceDaily: number | null;
  priceUnit: number | null;
  discountLimitPercent: number;
  amperage: string | null;
  capacity: string | null;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// INTERFACES PARA CÁLCULOS
// ============================================

/**
 * Opção de preço para seleção em orçamento
 */
export interface PriceOption {
  powerKva: string;
  equipmentType: EquipmentType;
  period: RentalPeriod;
  hoursPackage: HoursPackage;
  basePrice: number;
  extraHourPrice: number;
  cableKit380v: number;
  cableKit220v: number;
  maintenancePrice: number;
  maxDiscount: number;
}

/**
 * Item de orçamento com preço calculado
 */
export interface QuotationPriceItem {
  generatorId: string;
  powerKva: string;
  quantity: number;
  period: RentalPeriod;
  hoursPackage: HoursPackage;
  unitPrice: number;
  totalPrice: number;
  discountPercent: number;
  discountValue: number;
  finalPrice: number;
  extras: {
    cableKit380v: boolean;
    cableKit220v: boolean;
    preventiveMaintenance: boolean;
  };
  extrasTotal: number;
}

/**
 * Resumo de orçamento
 */
export interface QuotationPriceSummary {
  items: QuotationPriceItem[];
  accessories: {
    accessoryId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  subtotalGenerators: number;
  subtotalAccessories: number;
  totalDiscount: number;
  total: number;
}

// ============================================
// INTERFACES PARA FILTROS
// ============================================

export interface PricingGeneratorFilters {
  powerKva?: string;
  equipmentType?: EquipmentType;
  rentalPeriod?: RentalPeriod;
  minPower?: number;
  maxPower?: number;
  isActive?: boolean;
}

export interface PricingAccessoryFilters {
  itemCode?: string;
  category?: AccessoryCategory;
  isActive?: boolean;
}

// ============================================
// CONSTANTES DE NEGÓCIO
// ============================================

export const DEFAULT_DISCOUNT_LIMIT = 5; // 5% padrão
export const MAINTENANCE_INTERVAL_HOURS = 250;
export const MAINTENANCE_INTERVAL_MONTHS = 6;
