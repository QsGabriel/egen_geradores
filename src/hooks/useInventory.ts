import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Equipment, StockMovement, Request, DashboardData, FinancialMetrics, Quotation, QuotationItem, EquipmentChangeLog } from '../types';

export const useInventory = () => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [changeLogs, setChangeLogs] = useState<EquipmentChangeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all data on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchEquipment(),
        fetchMovements(),
        fetchRequests(),
        fetchQuotations(),
        fetchChangeLogs()
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchEquipment = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    const formatted: Equipment[] = data.map(item => ({
      id: item.id,
      name: item.name,
      code: item.code,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      supplier: item.supplier,
      batch: item.batch,
      entryDate: item.entry_date,
      expirationDate: item.expiration_date,
      location: item.location,
      minStock: item.min_stock,
      status: item.status,
      unitPrice: item.unit_price || 0,
      totalValue: item.quantity * (item.unit_price || 0),
      invoiceNumber: item.invoicenumber || '',
      isWithholding: item.iswithholding || false,
      supplierId: item.supplier_id || '',
      supplierName: item.supplier_name || '',
    }));

    setEquipment(formatted);
  };

  const fetchChangeLogs = async () => {
    const { data, error } = await supabase
      .from('product_change_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formattedLogs: EquipmentChangeLog[] = data.map(log => ({
      id: log.id,
      equipmentId: log.product_id,
      equipmentName: log.product_name,
      changedBy: log.changed_by,
      changeReason: log.change_reason,
      changeDate: log.change_date,
      changeTime: log.change_time,
      fieldChanges: log.field_changes,
      createdAt: log.created_at
    }));

    setChangeLogs(formattedLogs);
  };

  const addEquipmentChangeLog = async (changeLog: Omit<EquipmentChangeLog, 'id' | 'createdAt'>) => {
    try {
      const { error } = await supabase
        .from('product_change_logs')
        .insert({
          product_id: changeLog.equipmentId,
          product_name: changeLog.equipmentName,
          changed_by: changeLog.changedBy,
          change_reason: changeLog.changeReason,
          field_changes: changeLog.fieldChanges,
          change_date: changeLog.changeDate,
          change_time: changeLog.changeTime
        });

      if (error) throw error;

      await fetchChangeLogs(); // Refresh logs
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to add change log');
    }
  };

  const deleteEquipment = async (id: string) => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao excluir equipamento:', error);
    throw error;
  }
};

  const fetchMovements = async () => {
    const { data, error } = await supabase
      .from('stock_movements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formattedMovements: StockMovement[] = data.map(movement => ({
      id: movement.id,
      equipmentId: movement.product_id,
      equipmentName: movement.product_name,
      type: movement.type,
      reason: movement.reason,
      quantity: movement.quantity,
      date: movement.date,
      requestId: movement.request_id,
      authorizedBy: movement.authorized_by,
      notes: movement.notes,
      unitPrice: movement.unit_price || 0,
      totalValue: movement.quantity * (movement.unit_price || 0)
    }));

    setMovements(formattedMovements);
  };

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formattedRequests: Request[] = data.map(request => ({
      id: request.id,
      type: request.type,
      items: request.items || [],
      reason: request.reason,
      requestedBy: request.requested_by,
      requestDate: request.request_date,
      status: request.status,
      priority: request.priority || 'standard',
      approvedBy: request.approved_by,
      approvalDate: request.approval_date,
      notes: request.notes,
      department: request.department,
      supplierId: request.supplier_id,
      supplierName: request.supplier_name,
      receiver_signature: request.receiver_signature,
      received_by: request.received_by,
      attachmentUrl: request.attachment_url,
      attachmentName: request.attachment_name,
      attachments: Array.isArray(request.attachments) && request.attachments.length > 0
        ? request.attachments
        : request.attachment_url
          ? [{ url: request.attachment_url, name: request.attachment_name || '' }]
          : [],
    }));

    setRequests(formattedRequests);
  };

  const fetchQuotations = async () => {
    const { data: quotationsData, error: quotationsError } = await supabase
      .from('quotations')
      .select('*')
      .order('created_at', { ascending: false });

    if (quotationsError) throw quotationsError;

    const { data: itemsData, error: itemsError } = await supabase
      .from('quotation_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (itemsError) throw itemsError;

    const formattedQuotations: Quotation[] = quotationsData.map(quotation => ({
      id: quotation.id,
      requestId: quotation.request_id,
      equipmentId: quotation.product_id,
      equipmentName: quotation.product_name,
      requestedQuantity: quotation.requested_quantity,
      status: quotation.status,
      selectedSupplierId: quotation.selected_supplier_id,
      selectedPrice: quotation.selected_price,
      selectedDeliveryTime: quotation.selected_delivery_time,
      createdBy: quotation.created_by,
      createdAt: quotation.created_at,
      updatedAt: quotation.updated_at,
      items: itemsData
        .filter(item => item.quotation_id === quotation.id)
        .map(item => ({
          id: item.id,
          quotationId: item.quotation_id,
          supplierId: item.supplier_id,
          supplierName: item.supplier_name,
          unitPrice: item.unit_price,
          totalPrice: item.total_price,
          deliveryTime: item.delivery_time,
          notes: item.notes,
          status: item.status,
          submittedAt: item.submitted_at,
          createdAt: item.created_at
        }))
    }));

    setQuotations(formattedQuotations);
  };

  const getFinancialMetrics = (): FinancialMetrics => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Calcular valor atual do inventário baseado nos dados reais
    const currentInventoryValue = equipment.reduce((sum, item) => sum + item.totalValue, 0);

    // Movimentações do mês atual
    const currentMonthMovements = movements.filter(movement => {
      const moveDate = new Date(movement.date);
      return moveDate.getMonth() === currentMonth && moveDate.getFullYear() === currentYear;
    });

    // Movimentações do mês anterior
    const previousMonthMovements = movements.filter(movement => {
      const moveDate = new Date(movement.date);
      return moveDate.getMonth() === previousMonth && moveDate.getFullYear() === previousYear;
    });

    const currentMovementsValue = currentMonthMovements.reduce((sum, movement) => sum + movement.totalValue, 0);
    const previousMovementsValue = previousMonthMovements.reduce((sum, movement) => sum + movement.totalValue, 0);

    // Simular valor do inventário do mês anterior (baseado em histórico de movimentações)
    const previousInventoryValue = currentInventoryValue + currentMovementsValue - previousMovementsValue;

    return {
      currentMonth: {
        inventoryValue: currentInventoryValue,
        movementsValue: currentMovementsValue,
        movementsCount: currentMonthMovements.length
      },
      previousMonth: {
        inventoryValue: previousInventoryValue,
        movementsValue: previousMovementsValue,
        movementsCount: previousMonthMovements.length
      },
      trends: {
        inventoryValueChange: currentInventoryValue - previousInventoryValue,
        inventoryValueChangePercent: previousInventoryValue > 0 ? 
          ((currentInventoryValue - previousInventoryValue) / previousInventoryValue) * 100 : 0,
        movementsValueChange: currentMovementsValue - previousMovementsValue,
        movementsValueChangePercent: previousMovementsValue > 0 ? 
          ((currentMovementsValue - previousMovementsValue) / previousMovementsValue) * 100 : 0,
        movementsCountChange: currentMonthMovements.length - previousMonthMovements.length,
        movementsCountChangePercent: previousMonthMovements.length > 0 ? 
          ((currentMonthMovements.length - previousMonthMovements.length) / previousMonthMovements.length) * 100 : 0
      }
    };
  };

  const getDashboardData = (): DashboardData => {
    const totalEquipment = equipment.length;
    const lowStockEquipment = equipment.filter(p => p.status === 'low-stock').length;
    const expiringEquipment = equipment.filter(p => {
      if (p.quantity <= 0) return false; // Não exibir equipamentos sem estoque
      const expirationDate = new Date(p.expirationDate);
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      return expirationDate <= thirtyDaysFromNow;
    }).length;
    const recentMovements = movements.filter(m => {
      const moveDate = new Date(m.date);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return moveDate >= sevenDaysAgo;
    }).length;

    // Agrupar equipamentos por categoria real do banco de dados
    const categoryCount: Record<string, number> = {};
    const categoryValue: Record<string, number> = {};

    equipment.forEach(p => {
      const cat = p.category || 'sem categoria';
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      categoryValue[cat] = (categoryValue[cat] || 0) + p.totalValue;
    });

    const categories = {
      general: equipment.filter(p => p.category === 'general').length,
      technical: equipment.filter(p => p.category === 'technical').length
    };

    const financialMetrics = getFinancialMetrics();

    // Calcular valores por categoria baseado nos dados reais
    const categoryValues = {
      general: equipment
        .filter(p => p.category === 'general')
        .reduce((sum, p) => sum + p.totalValue, 0),
      technical: equipment
        .filter(p => p.category === 'technical')
        .reduce((sum, p) => sum + p.totalValue, 0)
    };

    // Equipamentos com maior e menor valor baseado nos dados reais
    const sortedByValue = [...equipment].sort((a, b) => b.totalValue - a.totalValue);
    const topValueEquipment = sortedByValue.slice(0, 5);
    const lowValueEquipment = sortedByValue.slice(-5).reverse();

    const totalInventoryValue = financialMetrics.currentMonth.inventoryValue;
    const averageEquipmentValue = totalEquipment > 0 ? totalInventoryValue / totalEquipment : 0;

    return {
      totalEquipment,
      lowStockEquipment,
      expiringEquipment,
      recentMovements,
      categories,
      totalInventoryValue,
      monthlyInventoryChange: financialMetrics.trends.inventoryValueChange,
      monthlyInventoryChangePercent: financialMetrics.trends.inventoryValueChangePercent,
      totalMovementsValue: financialMetrics.currentMonth.movementsValue,
      monthlyMovementsValue: financialMetrics.currentMonth.movementsValue,
      monthlyMovementsChange: financialMetrics.trends.movementsValueChange,
      monthlyMovementsChangePercent: financialMetrics.trends.movementsValueChangePercent,
      averageEquipmentValue,
      topValueEquipment,
      lowValueEquipment,
      categoryValues,
      allCategories: categoryCount,
      allCategoryValues: categoryValue
    };
  };

  const addEquipment = async (item: Omit<Equipment, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          name: item.name,
          code: item.code,
          category: item.category,
          quantity: item.quantity,
          unit: item.unit,
          supplier: item.supplier,
          batch: item.batch,
          entry_date: item.entryDate,
          expiration_date: item.expirationDate,
          location: item.location,
          min_stock: item.minStock,
          unit_price: item.unitPrice,
          invoicenumber: item.invoiceNumber,
          iswithholding: item.isWithholding
        })
        .select()
        .single();

      if (error) throw error;

      await fetchEquipment(); // Refresh equipment list
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to add equipment');
    }
  };

  const updateEquipment = async (id: string, updates: Partial<Equipment>) => {
    try {
      const updateData: any = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.code !== undefined) updateData.code = updates.code;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.quantity !== undefined) updateData.quantity = updates.quantity;
      if (updates.unit !== undefined) updateData.unit = updates.unit;
      if (updates.supplier !== undefined) updateData.supplier = updates.supplier;
      if (updates.supplierName !== undefined) updateData.supplier_name = updates.supplierName;
      if (updates.batch !== undefined) updateData.batch = updates.batch;
      if (updates.entryDate !== undefined) updateData.entry_date = updates.entryDate;
      if (updates.expirationDate !== undefined) updateData.expiration_date = updates.expirationDate;
      if (updates.location !== undefined) updateData.location = updates.location;
      if (updates.minStock !== undefined) updateData.min_stock = updates.minStock;
      if (updates.unitPrice !== undefined) updateData.unit_price = updates.unitPrice;
      if (updates.invoiceNumber !== undefined) updateData.invoicenumber = updates.invoiceNumber;
      if (updates.isWithholding !== undefined) updateData.iswithholding = updates.isWithholding;

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      await fetchEquipment(); // Refresh equipment list
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update equipment');
    }
  };

  const addMovement = async (movement: Omit<StockMovement, 'id'>) => {
    try {
      const { error } = await supabase
        .from('stock_movements')
        .insert({
          product_id: movement.equipmentId,
          product_name: movement.equipmentName,
          type: movement.type,
          reason: movement.reason,
          quantity: movement.quantity,
          date: movement.date,
          request_id: movement.requestId,
          authorized_by: movement.authorizedBy,
          notes: movement.notes,
          unit_price: movement.unitPrice,
        });

      if (error) throw error;

      // Refresh data
      await Promise.all([fetchMovements(), fetchEquipment()]);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to add movement');
    }
  };

  const addRequest = async (request: Omit<Request, 'id'>, attachments?: File[] | null) => {
    try {
      let attachmentsData: { url: string; name: string }[] = [];

      // Upload de múltiplos anexos se fornecidos
      if (attachments && attachments.length > 0) {
        for (const attachment of attachments) {
          const fileExt = attachment.name.split('.').pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('request-attachments')
            .upload(filePath, attachment, { cacheControl: '3600', upsert: false });

          if (uploadError) {
            console.error('Erro ao fazer upload do anexo:', uploadError);
            if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('bucket')) {
              throw new Error('O bucket de storage não está configurado. Por favor, contate o administrador do sistema.');
            }
            continue;
          }

          const { data: { publicUrl } } = supabase.storage
            .from('request-attachments')
            .getPublicUrl(filePath);

          attachmentsData.push({ url: publicUrl, name: attachment.name });
        }
      }

      const { data, error } = await supabase
        .from('requests')
        .insert({
          type: request.type,
          items: request.items,
          reason: request.reason,
          priority: request.priority,
          requested_by: request.requestedBy,
          request_date: request.requestDate,
          department: request.department,
          supplier_id: request.supplierId,
          supplier_name: request.supplierName,
          attachments: attachmentsData
        })
        .select()
        .single();

      if (error) throw error;

      await fetchRequests(); // Refresh requests list
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to add request');
    }
  };

  const updateRequestStatus = async (id: string, status: Request['status'], approvedBy?: string) => {
    try {
      const updateData: any = { status };
      
      if (status === 'approved' && approvedBy) {
        updateData.approved_by = approvedBy;
        updateData.approval_date = new Date().toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from('requests')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      await fetchRequests(); // Refresh requests list
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update request status');
    }
  };

  // Quotation functions
  // Modelo: 1 quotation = 1 ou mais produtos sendo cotados
  // quotation_items = produtos/itens a serem cotados
  // quotation_proposals = respostas dos fornecedores (criadas quando respondem)
  const createQuotation = async (quotationData: {
    requestId: string;
    equipmentId: string;
    equipmentName: string;
    requestedQuantity: number;
  }) => {
    try {
      // Verificar se já existe cotação para este request + equipamento
      const { data: existingQuotation } = await supabase
        .from('quotations')
        .select('id')
        .eq('request_id', quotationData.requestId)
        .eq('product_id', quotationData.equipmentId)
        .maybeSingle();

      if (existingQuotation) {
        console.log('Cotação já existe para este equipamento:', existingQuotation.id);
        return existingQuotation;
      }

      const { data: quotation, error: quotationError } = await supabase
        .from('quotations')
        .insert({
          request_id: quotationData.requestId,
          product_id: quotationData.equipmentId,
          product_name: quotationData.equipmentName,
          requested_quantity: quotationData.requestedQuantity,
          status: 'open',
          created_by: 'Sistema'
        })
        .select()
        .single();

      if (quotationError) throw quotationError;

      const { error: itemError } = await supabase
        .from('quotation_items')
        .insert({
          quotation_id: quotation.id,
          product_id: quotationData.equipmentId,
          product_name: quotationData.equipmentName,
          quantity: quotationData.requestedQuantity,
          unit: 'un',
          status: 'pending'
        });

      if (itemError) {
        console.error('Erro ao criar quotation_item:', itemError);
      }

      console.log(`Cotação ${quotation.id} criada com 1 item para equipamento: ${quotationData.equipmentName}`);

      await fetchQuotations();
      return quotation;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create quotation');
    }
  };

  const updateQuotationItem = async (itemId: string, updates: Partial<QuotationItem>) => {
    try {
      const updateData: any = {};
      
      if (updates.unitPrice !== undefined) {
        updateData.unit_price = updates.unitPrice;
        // Calculate total price if quantity is available
        const quotationItem = quotations
          .flatMap(q => q.items)
          .find(item => item.id === itemId);
        if (quotationItem) {
          const quotation = quotations.find(q => q.id === quotationItem.quotationId);
          if (quotation) {
            updateData.total_price = updates.unitPrice * quotation.requestedQuantity;
          }
        }
      }
      if (updates.deliveryTime !== undefined) updateData.delivery_time = updates.deliveryTime;
      if (updates.notes !== undefined) updateData.notes = updates.notes;
      if (updates.status !== undefined) {
        updateData.status = updates.status;
        if (updates.status === 'submitted') {
          updateData.submitted_at = new Date().toISOString();
        }
      }

      const { error } = await supabase
        .from('quotation_items')
        .update(updateData)
        .eq('id', itemId);

      if (error) throw error;

      await fetchQuotations();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update quotation item');
    }
  };

  const selectQuotationWinner = async (quotationId: string, selectedItemId: string) => {
    try {
      const quotation = quotations.find(q => q.id === quotationId);
      const selectedItem = quotation?.items.find(item => item.id === selectedItemId);
      
      if (!quotation || !selectedItem) {
        throw new Error('Quotation or item not found');
      }

      // Update quotation with selected supplier
      const { error: quotationError } = await supabase
        .from('quotations')
        .update({
          status: 'completed',
          selected_supplier_id: selectedItem.supplierId,
          selected_price: selectedItem.unitPrice,
          selected_delivery_time: selectedItem.deliveryTime
        })
        .eq('id', quotationId);

      if (quotationError) throw quotationError;

      // Update all items status
      const { error: itemsError } = await supabase
        .from('quotation_items')
        .update({ status: 'rejected' })
        .eq('quotation_id', quotationId);

      if (itemsError) throw itemsError;

      // Update selected item status
      const { error: selectedError } = await supabase
        .from('quotation_items')
        .update({ status: 'selected' })
        .eq('id', selectedItemId);

      if (selectedError) throw selectedError;

      await fetchQuotations();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to select quotation winner');
    }
  };

  // Função para dar baixa em equipamento (zerar estoque)
  const writeOffEquipment = async (equipmentId: string, reason: string, authorizedBy: string) => {
    try {
      const item = equipment.find(p => p.id === equipmentId);
      if (!item) throw new Error('Equipamento não encontrado');

      // Registrar movimentação de saída
      await addMovement({
        equipmentId: item.id,
        equipmentName: item.name,
        type: 'out',
        reason: 'other',
        quantity: item.quantity,
        date: new Date().toISOString().split('T')[0],
        authorizedBy,
        notes: `Baixa por ${reason}`,
        unitPrice: item.unitPrice,
        totalValue: item.quantity * item.unitPrice
      });

      // Atualizar equipamento para quantidade zero
      await updateEquipment(equipmentId, { quantity: 0 });
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to write off equipment');
    }
  };

  // Função para solicitar reposição automaticamente
  const requestReplenishment = async (equipmentId: string, requestedBy: string) => {
    try {
      const item = equipment.find(p => p.id === equipmentId);
      if (!item) throw new Error('Equipamento não encontrado');

      // Calcular quantidade sugerida (dobro do estoque mínimo)
      const suggestedQuantity = Math.max(item.minStock * 2, 10);

      await addRequest({
        items: [{
          id: Date.now().toString(),
          equipmentId: item.id,
          equipmentName: item.name,
          quantity: suggestedQuantity,
          category: item.category
        }],
        reason: `Solicitação automática de reposição - Equipamento próximo ao vencimento. Estoque atual: ${item.quantity} ${item.unit}`,
        priority: 'priority',
        requestedBy,
        requestDate: new Date().toISOString().split('T')[0],
        type: 'SC',
        status: 'pending'
      });
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to request replenishment');
    }
  };

  return {
    equipment,
    movements,
    requests,
    quotations,
    changeLogs,
    loading,
    error,
    getDashboardData,
    getFinancialMetrics,
    addEquipment,
    updateEquipment,
    addMovement,
    addRequest,
    updateRequestStatus,
    createQuotation,
    updateQuotationItem,
    selectQuotationWinner,
    writeOffEquipment,
    requestReplenishment,
    addEquipmentChangeLog,
    refreshData: fetchAllData,
    deleteEquipment,
    setEquipment,
    fetchEquipment
  };
};