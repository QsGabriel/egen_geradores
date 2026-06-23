import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import type {
  Equipment,
  EquipmentFormData,
  ContractEquipment,
  EquipmentStatus,
} from '../types';

export function useEquipment() {
  const { userProfile } = useAuth();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEquipment = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('equipment')
      .select('*')
      .order('name', { ascending: true });

    if (err) throw err;

    const mapped: Equipment[] = (data || []).map((r: any) => ({
      id: r.id,
      code: r.code || '',
      name: r.name || '',
      description: r.description || '',
      brand: r.brand || '',
      model: r.model || '',
      serialNumber: r.serial_number || '',
      powerKva: r.power_kva ?? null,
      fuelType: r.fuel_type ?? null,
      yearManufacture: r.year_manufacture ?? null,
      status: r.status || 'available',
      rentalDailyRate: r.rental_daily_rate ?? null,
      rentalMonthlyRate: r.rental_monthly_rate ?? null,
      location: r.location || '',
      notes: r.notes || '',
      imageUrl: r.image_url || '',
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    setEquipment(mapped);
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchEquipment();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar equipamentos');
    } finally {
      setLoading(false);
    }
  }, [fetchEquipment]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const addEquipment = async (data: EquipmentFormData) => {
    const { error: err } = await supabase.from('equipment').insert({
      code: data.code,
      name: data.name,
      description: data.description || null,
      brand: data.brand || null,
      model: data.model || null,
      serial_number: data.serialNumber || null,
      power_kva: data.powerKva ? parseFloat(data.powerKva) : null,
      fuel_type: data.fuelType || null,
      year_manufacture: data.yearManufacture ? parseInt(data.yearManufacture) : null,
      status: data.status,
      rental_daily_rate: data.rentalDailyRate ? parseFloat(data.rentalDailyRate) : null,
      rental_monthly_rate: data.rentalMonthlyRate ? parseFloat(data.rentalMonthlyRate) : null,
      location: data.location || null,
      notes: data.notes || null,
      image_url: data.imageUrl || null,
    });
    if (err) throw err;

    await supabase.from('crm_history').insert({
      entity_type: 'equipment',
      entity_id: null,
      description: `Equipamento "${data.name}" (${data.code}) cadastrado`,
      created_by: userProfile?.name || userProfile?.email || 'Sistema',
    });

    await fetchEquipment();
  };

  const updateEquipment = async (id: string, data: Partial<EquipmentFormData>) => {
    const updateData: Record<string, unknown> = {};
    if (data.code !== undefined) updateData.code = data.code;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.brand !== undefined) updateData.brand = data.brand || null;
    if (data.model !== undefined) updateData.model = data.model || null;
    if (data.serialNumber !== undefined) updateData.serial_number = data.serialNumber || null;
    if (data.powerKva !== undefined) updateData.power_kva = data.powerKva ? parseFloat(data.powerKva) : null;
    if (data.fuelType !== undefined) updateData.fuel_type = data.fuelType || null;
    if (data.yearManufacture !== undefined) updateData.year_manufacture = data.yearManufacture ? parseInt(data.yearManufacture) : null;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.rentalDailyRate !== undefined) updateData.rental_daily_rate = data.rentalDailyRate ? parseFloat(data.rentalDailyRate) : null;
    if (data.rentalMonthlyRate !== undefined) updateData.rental_monthly_rate = data.rentalMonthlyRate ? parseFloat(data.rentalMonthlyRate) : null;
    if (data.location !== undefined) updateData.location = data.location || null;
    if (data.notes !== undefined) updateData.notes = data.notes || null;
    if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl || null;

    const { error: err } = await supabase
      .from('equipment')
      .update(updateData)
      .eq('id', id);

    if (err) throw err;

    await supabase.from('crm_history').insert({
      entity_type: 'equipment',
      entity_id: id,
      description: `Equipamento "${data.name || 'N/A'}" atualizado`,
      created_by: userProfile?.name || userProfile?.email || 'Sistema',
    });

    await fetchEquipment();
  };

  const updateEquipmentStatus = async (id: string, status: EquipmentStatus) => {
    const eq = equipment.find(e => e.id === id);
    const { error: err } = await supabase
      .from('equipment')
      .update({ status })
      .eq('id', id);

    if (err) throw err;

    if (eq) {
      await supabase.from('crm_history').insert({
        entity_type: 'equipment',
        entity_id: id,
        description: `Status do equipamento "${eq.name}" alterado para "${status}"`,
        created_by: userProfile?.name || userProfile?.email || 'Sistema',
      });
    }

    await fetchEquipment();
  };

  const deleteEquipment = async (id: string) => {
    const { error: err } = await supabase
      .from('equipment')
      .delete()
      .eq('id', id);

    if (err) throw err;
    await fetchEquipment();
  };

  const getEquipmentRentalHistory = useCallback(async (equipmentId: string): Promise<ContractEquipment[]> => {
    const { data, error: err } = await supabase
      .from('contract_equipment')
      .select(`*, contracts!inner(code, title, client_id, clients(name))`)
      .eq('equipment_id', equipmentId)
      .order('created_at', { ascending: false });

    if (err) throw err;

    return (data || []).map((r: any) => ({
      id: r.id,
      contractId: r.contract_id,
      equipmentId: r.equipment_id,
      rentalValue: r.rental_value ?? null,
      deliveryDate: r.delivery_date ?? null,
      returnDate: r.return_date ?? null,
      notes: r.notes || '',
      createdAt: r.created_at,
      contractCode: r.contracts?.code || '',
      contractTitle: r.contracts?.title || '',
      clientName: r.contracts?.clients?.name || '',
    }));
  }, []);

  return {
    equipment,
    loading,
    error,
    fetchEquipment,
    addEquipment,
    updateEquipment,
    updateEquipmentStatus,
    deleteEquipment,
    getEquipmentRentalHistory,
  };
}
