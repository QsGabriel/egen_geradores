import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import * as XLSX from 'xlsx';
import type {
  MaintenanceOrder,
  MaintenanceFormData,
  MaintenanceStatus,
} from '../types';

export function useMaintenance() {
  const { userProfile } = useAuth();
  const [orders, setOrders] = useState<MaintenanceOrder[]>([]);
  const [equipmentList, setEquipmentList] = useState<{ id: string; code: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('maintenance_orders')
      .select(`*, equipment!inner(code, name)`)
      .order('created_at', { ascending: false });

    if (err) throw err;

    const mapped: MaintenanceOrder[] = (data || []).map((r: any) => ({
      id: r.id,
      code: r.code || '',
      equipmentId: r.equipment_id,
      equipmentName: r.equipment?.name || '',
      equipmentCode: r.equipment?.code || '',
      type: r.type || 'corrective',
      priority: r.priority || 'common',
      status: r.status || 'pending',
      description: r.description || '',
      scheduledDate: r.scheduled_date || null,
      completedDate: r.completed_date || null,
      cost: r.cost ?? null,
      technician: r.technician || '',
      notes: r.notes || '',
      serviceOrderUrl: r.service_order_url || '',
      requesterId: r.requester_id || '',
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    setOrders(mapped);
  }, []);

  const fetchEquipmentList = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('equipment')
      .select('id, code, name')
      .order('name', { ascending: true });

    if (err) throw err;

    setEquipmentList(data || []);
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchOrders(), fetchEquipmentList()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [fetchOrders, fetchEquipmentList]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const addMaintenanceOrder = async (data: MaintenanceFormData) => {
    let serviceOrderUrl = '';

    if (data.serviceOrderFile) {
      const fileExt = data.serviceOrderFile.name.split('.').pop()?.toLowerCase();
      const fileName = `os-${Date.now()}-${Math.random().toString(36).substr(2, 6)}.${fileExt}`;
      const filePath = `maintenance/${fileName}`;

      const { error: uploadErr } = await supabase.storage
        .from('request-attachments')
        .upload(filePath, data.serviceOrderFile, { cacheControl: '3600', upsert: false });

      if (!uploadErr) {
        const { data: urlData } = supabase.storage
          .from('request-attachments')
          .getPublicUrl(filePath);
        serviceOrderUrl = urlData.publicUrl;
      }
    }

    const { error: err } = await supabase.from('maintenance_orders').insert({
      equipment_id: data.equipmentId,
      type: data.type,
      priority: data.priority,
      status: data.status,
      description: data.description,
      scheduled_date: data.scheduledDate || null,
      completed_date: data.completedDate || null,
      cost: data.cost ? parseFloat(data.cost) : null,
      technician: data.technician || null,
      notes: data.notes || null,
      service_order_url: serviceOrderUrl || null,
      requester_id: userProfile?.id || null,
    });
    if (err) throw err;

    await fetchOrders();
  };

  const updateMaintenanceOrder = async (id: string, data: Partial<MaintenanceFormData>) => {
    let serviceOrderUrl: string | undefined;

    if (data.serviceOrderFile) {
      const fileExt = data.serviceOrderFile.name.split('.').pop()?.toLowerCase();
      const fileName = `os-${Date.now()}-${Math.random().toString(36).substr(2, 6)}.${fileExt}`;
      const filePath = `maintenance/${fileName}`;

      const { error: uploadErr } = await supabase.storage
        .from('request-attachments')
        .upload(filePath, data.serviceOrderFile, { cacheControl: '3600', upsert: false });

      if (!uploadErr) {
        const { data: urlData } = supabase.storage
          .from('request-attachments')
          .getPublicUrl(filePath);
        serviceOrderUrl = urlData.publicUrl;
      }
    }

    const updateData: Record<string, unknown> = {};
    if (data.equipmentId !== undefined) updateData.equipment_id = data.equipmentId;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.scheduledDate !== undefined) updateData.scheduled_date = data.scheduledDate || null;
    if (data.completedDate !== undefined) updateData.completed_date = data.completedDate || null;
    if (data.cost !== undefined) updateData.cost = data.cost ? parseFloat(data.cost) : null;
    if (data.technician !== undefined) updateData.technician = data.technician || null;
    if (data.notes !== undefined) updateData.notes = data.notes || null;
    if (serviceOrderUrl !== undefined) updateData.service_order_url = serviceOrderUrl;

    const { error: err } = await supabase
      .from('maintenance_orders')
      .update(updateData)
      .eq('id', id);

    if (err) throw err;
    await fetchOrders();
  };

  const updateMaintenanceStatus = async (id: string, status: MaintenanceStatus) => {
    const updateData: Record<string, unknown> = { status };
    if (status === 'completed') {
      updateData.completed_date = new Date().toISOString().split('T')[0];
    }
    const { error: err } = await supabase
      .from('maintenance_orders')
      .update(updateData)
      .eq('id', id);

    if (err) throw err;
    await fetchOrders();
  };

  const deleteMaintenanceOrder = async (id: string) => {
    const { error: err } = await supabase
      .from('maintenance_orders')
      .delete()
      .eq('id', id);

    if (err) throw err;
    await fetchOrders();
  };

  const getAlerts = useCallback(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const daqui7dias = new Date(hoje);
    daqui7dias.setDate(daqui7dias.getDate() + 7);

    return orders.filter((o) => {
      if (o.status === 'completed' || o.status === 'cancelled') return false;
      if (!o.scheduledDate) return o.priority === 'urgent';
      const scheduled = new Date(o.scheduledDate + 'T00:00:00');
      return scheduled <= daqui7dias;
    }).sort((a, b) => {
      if (!a.scheduledDate) return -1;
      if (!b.scheduledDate) return 1;
      return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
    });
  }, [orders]);

  const getOverdueAlerts = useCallback(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    return orders.filter((o) => {
      if (o.status === 'completed' || o.status === 'cancelled') return false;
      if (!o.scheduledDate) return false;
      const scheduled = new Date(o.scheduledDate + 'T00:00:00');
      return scheduled < hoje;
    }).sort((a, b) => {
      return new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime();
    });
  }, [orders]);

  const exportToExcel = useCallback(() => {
    const now = new Date();
    const rows = orders
      .filter((o) => o.status !== 'cancelled')
      .map((o) => ({
        'Codigo OS': o.code,
        'Equipamento': o.equipmentName,
        'Cod. Equip.': o.equipmentCode,
        'Tipo': o.type === 'preventive' ? 'Preventiva' : 'Corretiva',
        'Prioridade': o.priority === 'urgent' ? 'Urgente' : o.priority === 'priority' ? 'Prioritaria' : 'Comum',
        'Status': o.status === 'pending' ? 'Pendente' : o.status === 'scheduled' ? 'Agendada' : o.status === 'in_progress' ? 'Em Andamento' : o.status === 'completed' ? 'Concluida' : 'Cancelada',
        'Descricao': o.description,
        'Data Agendada': o.scheduledDate
          ? new Date(o.scheduledDate + 'T00:00:00').toLocaleDateString('pt-BR')
          : 'Nao agendada',
        'Data Conclusao': o.completedDate
          ? new Date(o.completedDate + 'T00:00:00').toLocaleDateString('pt-BR')
          : '',
        'Tecnico': o.technician || '',
        'Custo (R$)': o.cost != null ? o.cost.toFixed(2) : '',
        'Observacoes': o.notes,
      }));

    const ws = XLSX.utils.json_to_sheet(rows);

    const wscols = [
      { wch: 12 }, { wch: 30 }, { wch: 14 }, { wch: 14 },
      { wch: 14 }, { wch: 16 }, { wch: 40 }, { wch: 16 },
      { wch: 16 }, { wch: 20 }, { wch: 14 }, { wch: 40 },
    ];
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Manutencoes');

    const reportDate = now.toISOString().split('T')[0];
    XLSX.writeFile(wb, `AUVO_Manutencoes_${reportDate}.xlsx`);
  }, [orders]);

  return {
    orders,
    equipmentList,
    loading,
    error,
    fetchOrders,
    addMaintenanceOrder,
    updateMaintenanceOrder,
    updateMaintenanceStatus,
    deleteMaintenanceOrder,
    getAlerts,
    getOverdueAlerts,
    exportToExcel,
  };
}
