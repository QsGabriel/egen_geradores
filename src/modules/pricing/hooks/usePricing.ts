/**
 * usePricing Hook
 * Hook para acesso às tabelas de precificação de geradores e acessórios
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import type {
  PricingGenerator,
  PricingAccessory,
  PricingGeneratorFilters,
  PricingAccessoryFilters,
  RentalPeriod,
  HoursPackage,
  EquipmentType,
} from '../types';

export function usePricing() {
  const [generators, setGenerators] = useState<PricingGenerator[]>([]);
  const [accessories, setAccessories] = useState<PricingAccessory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // FETCH GENERATORS
  // ============================================

  const fetchGenerators = useCallback(async (filters?: PricingGeneratorFilters) => {
    let query = supabase
      .from('pricing_generators')
      .select('*')
      .order('power_min_kva', { ascending: true })
      .order('rental_period', { ascending: true });

    if (filters?.powerKva) {
      query = query.eq('power_kva', filters.powerKva);
    }
    if (filters?.equipmentType) {
      query = query.eq('equipment_type', filters.equipmentType);
    }
    if (filters?.rentalPeriod) {
      query = query.eq('rental_period', filters.rentalPeriod);
    }
    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }

    const { data, error: err } = await query;

    if (err) throw err;

    const mapped: PricingGenerator[] = (data || []).map((r: any) => ({
      id: r.id,
      powerKva: r.power_kva,
      powerMinKva: r.power_min_kva,
      powerMaxKva: r.power_max_kva,
      equipmentType: r.equipment_type,
      rentalPeriod: r.rental_period,
      priceStandby: r.price_standby,
      price120h: r.price_120h,
      price240h: r.price_240h,
      price360h: r.price_360h,
      priceContinuous: r.price_continuous,
      priceExtraHour: r.price_extra_hour,
      priceCableKit380v: r.price_cable_kit_380v,
      priceCableKit220v: r.price_cable_kit_220v,
      pricePreventiveMaintenance: r.price_preventive_maintenance,
      discountLimitPercent: r.discount_limit_percent,
      isActive: r.is_active,
      notes: r.notes,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    setGenerators(mapped);
    return mapped;
  }, []);

  // ============================================
  // FETCH ACCESSORIES
  // ============================================

  const fetchAccessories = useCallback(async (filters?: PricingAccessoryFilters) => {
    let query = supabase
      .from('pricing_accessories')
      .select('*')
      .order('category', { ascending: true })
      .order('item_name', { ascending: true });

    if (filters?.itemCode) {
      query = query.eq('item_code', filters.itemCode);
    }
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }

    const { data, error: err } = await query;

    if (err) throw err;

    const mapped: PricingAccessory[] = (data || []).map((r: any) => ({
      id: r.id,
      itemCode: r.item_code,
      itemName: r.item_name,
      category: r.category,
      priceMonthly: r.price_monthly,
      priceBiweekly: r.price_biweekly,
      priceWeekly: r.price_weekly,
      priceDaily: r.price_daily,
      priceUnit: r.price_unit,
      discountLimitPercent: r.discount_limit_percent,
      amperage: r.amperage,
      capacity: r.capacity,
      isActive: r.is_active,
      notes: r.notes,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    setAccessories(mapped);
    return mapped;
  }, []);

  // ============================================
  // UTILITÁRIOS DE PREÇO
  // ============================================

  /**
   * Obtém o preço de um gerador para um período e pacote de horas específicos
   */
  const getGeneratorPrice = useCallback((
    powerKva: string,
    period: RentalPeriod,
    hoursPackage: HoursPackage,
    equipmentType: EquipmentType = 'gerador'
  ): number | null => {
    const gen = generators.find(
      g => g.powerKva === powerKva && 
           g.rentalPeriod === period && 
           g.equipmentType === equipmentType &&
           g.isActive
    );

    if (!gen) return null;

    const priceMap: Record<HoursPackage, number | null> = {
      standby: gen.priceStandby,
      '120h': gen.price120h,
      '240h': gen.price240h,
      '360h': gen.price360h,
      continuous: gen.priceContinuous,
    };

    return priceMap[hoursPackage];
  }, [generators]);

  /**
   * Obtém o preço de hora extra de um gerador
   */
  const getExtraHourPrice = useCallback((
    powerKva: string,
    period: RentalPeriod,
    equipmentType: EquipmentType = 'gerador'
  ): number | null => {
    const gen = generators.find(
      g => g.powerKva === powerKva && 
           g.rentalPeriod === period && 
           g.equipmentType === equipmentType &&
           g.isActive
    );
    return gen?.priceExtraHour ?? null;
  }, [generators]);

  /**
   * Obtém o preço de um acessório para um período específico
   */
  const getAccessoryPrice = useCallback((
    itemCode: string,
    period: RentalPeriod
  ): number | null => {
    const acc = accessories.find(a => a.itemCode === itemCode && a.isActive);

    if (!acc) return null;

    const priceMap: Record<RentalPeriod, number | null> = {
      mensal: acc.priceMonthly,
      quinzenal: acc.priceBiweekly,
      semanal: acc.priceWeekly,
    };

    return priceMap[period];
  }, [accessories]);

  /**
   * Lista potências disponíveis (sem duplicatas)
   */
  const getAvailablePowers = useCallback((
    equipmentType: EquipmentType = 'gerador'
  ): string[] => {
    const powers = generators
      .filter(g => g.equipmentType === equipmentType && g.isActive)
      .map(g => g.powerKva);
    return [...new Set(powers)].sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''));
      const numB = parseInt(b.replace(/\D/g, ''));
      return numA - numB;
    });
  }, [generators]);

  /**
   * Lista categorias de acessórios disponíveis
   */
  const getAccessoryCategories = useCallback((): string[] => {
    const categories = accessories
      .filter(a => a.isActive)
      .map(a => a.category);
    return [...new Set(categories)].sort();
  }, [accessories]);

  /**
   * Calcula o desconto máximo permitido para um item
   */
  const getMaxDiscount = useCallback((
    powerKva?: string,
    itemCode?: string
  ): number => {
    if (powerKva) {
      const gen = generators.find(g => g.powerKva === powerKva && g.isActive);
      return gen?.discountLimitPercent ?? 5;
    }
    if (itemCode) {
      const acc = accessories.find(a => a.itemCode === itemCode && a.isActive);
      return acc?.discountLimitPercent ?? 5;
    }
    return 5;
  }, [generators, accessories]);

  /**
   * Formata valor em BRL
   */
  const formatCurrency = (value: number | null): string => {
    if (value === null) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // ============================================
  // INITIAL LOAD
  // ============================================

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchGenerators({ isActive: true }),
        fetchAccessories({ isActive: true }),
      ]);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar tabelas de preço');
      console.error('[usePricing] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchGenerators, fetchAccessories]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ============================================
  // RETURN
  // ============================================

  return {
    // Data
    generators,
    accessories,
    loading,
    error,

    // Fetch
    fetchGenerators,
    fetchAccessories,
    reloadAll: loadAll,

    // Utilities
    getGeneratorPrice,
    getExtraHourPrice,
    getAccessoryPrice,
    getAvailablePowers,
    getAccessoryCategories,
    getMaxDiscount,
    formatCurrency,
  };
}
