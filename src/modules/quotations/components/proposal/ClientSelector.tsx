/**
 * EGEN System - Client Selector
 * Componente para seleção de cliente do CRM
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, Building2, X, AlertCircle } from 'lucide-react';
import { useCRM } from '../../../crm/hooks/useCRM';
import { useQuotationStore } from '../../stores/quotationStore';
import type { Client, Lead } from '../../../crm/types';
import type { ClienteSnapshot } from '../../types/proposal';

// ============================================
// TYPES
// ============================================

interface ClientSelectorProps {
  onClientSelect?: (cliente: ClienteSnapshot | null) => void;
  className?: string;
}

// ============================================
// COMPONENT
// ============================================

export function ClientSelector({ onClientSelect, className = '' }: ClientSelectorProps) {
  const { clients, leads, loading: crmLoading, error: crmError } = useCRM();
  const { setCliente, setClientId, setLeadId, current } = useQuotationStore();

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'clients' | 'leads'>('clients');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter clients/leads by search
  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.documentNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLeads = leads.filter(l =>
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Focus input when opening
      setTimeout(() => inputRef.current?.focus(), 100);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Convert Client to ClienteSnapshot
  const clientToSnapshot = useCallback((client: Client): ClienteSnapshot => ({
    nome: client.name,
    responsavel: client.contactName || '',
    email: client.contactEmail || '',
    telefone: client.contactPhone || '',
    documento: client.documentNumber || '',
    endereco: client.address || '',
    cidadeUf: client.city && client.state ? `${client.city}/${client.state}` : '',
  }), []);

  // Convert Lead to ClienteSnapshot
  const leadToSnapshot = useCallback((lead: Lead): ClienteSnapshot => ({
    nome: lead.company || lead.name,
    responsavel: lead.name,
    email: lead.email || '',
    telefone: lead.phone || '',
    documento: '',
    endereco: '',
    cidadeUf: '',
  }), []);

  // Handle client selection
  const handleSelectClient = (client: Client) => {
    const snapshot = clientToSnapshot(client);
    setCliente(snapshot);
    setClientId(client.id);
    setLeadId(null);
    onClientSelect?.(snapshot);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Handle lead selection
  const handleSelectLead = (lead: Lead) => {
    const snapshot = leadToSnapshot(lead);
    setCliente(snapshot);
    setClientId(null);
    setLeadId(lead.id);
    onClientSelect?.(snapshot);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Clear selection
  const handleClear = () => {
    setCliente({
      nome: '',
      responsavel: '',
      email: '',
      telefone: '',
      documento: '',
      endereco: '',
      cidadeUf: '',
    });
    setClientId(null);
    setLeadId(null);
    onClientSelect?.(null);
  };

  // Current selection display
  const hasSelection = current?.cliente?.nome && current.cliente.nome.length > 0;
  const selectionType = current?.clientId ? 'client' : current?.leadId ? 'lead' : null;

  // Handle open/close
  const handleOpen = () => {
    setIsOpen(true);
    setSearchTerm('');
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Selection Display / Search Input - INLINE */}
      <div
        className={`
          w-full flex items-center px-3 py-2 
          bg-white dark:bg-gray-800 
          border border-gray-200 dark:border-gray-700 
          rounded-lg
          transition-colors
          ${isOpen ? 'ring-2 ring-egen-navy/30 dark:ring-egen-yellow/30 border-egen-navy dark:border-egen-yellow' : 'hover:border-egen-navy dark:hover:border-egen-yellow'}
        `}
      >
        {isOpen ? (
          /* Search Mode - Input inline */
          <>
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0 mr-2" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') handleClose();
              }}
              placeholder="Digite para buscar cliente ou lead..."
              className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none min-w-0"
              autoFocus
            />
            <button
              type="button"
              onClick={handleClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex-shrink-0 ml-2"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </>
        ) : hasSelection ? (
          /* Has Selection - Show selected value */
          <>
            <div className={`
              p-1.5 rounded-full flex-shrink-0 mr-2
              ${selectionType === 'client' 
                ? 'bg-egen-navy/10 text-egen-navy dark:bg-egen-navy/30 dark:text-egen-yellow' 
                : 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
              }
            `}>
              {selectionType === 'client' ? (
                <Building2 className="w-3.5 h-3.5" />
              ) : (
                <User className="w-3.5 h-3.5" />
              )}
            </div>
            <button
              type="button"
              onClick={handleOpen}
              className="flex-1 text-left min-w-0"
            >
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {current?.cliente.nome}
              </p>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex-shrink-0 ml-2"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </>
        ) : (
          /* No Selection - Show placeholder button */
          <button
            type="button"
            onClick={handleOpen}
            className="flex items-center gap-2 text-gray-400 w-full"
          >
            <Search className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm truncate">Selecionar cliente ou lead...</span>
          </button>
        )}
      </div>

      {/* Dropdown - Only Results, no search input */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.1 }}
            className="absolute left-0 right-0 z-50 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden"
          >
            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setActiveTab('clients')}
                className={`flex-1 px-3 py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                  activeTab === 'clients'
                    ? 'text-egen-navy dark:text-egen-yellow border-b-2 border-egen-navy dark:border-egen-yellow bg-egen-navy/5 dark:bg-egen-yellow/5'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                Clientes ({filteredClients.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('leads')}
                className={`flex-1 px-3 py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                  activeTab === 'leads'
                    ? 'text-egen-navy dark:text-egen-yellow border-b-2 border-egen-navy dark:border-egen-yellow bg-egen-navy/5 dark:bg-egen-yellow/5'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Leads ({filteredLeads.length})
              </button>
            </div>

            {/* Results */}
            <div className="max-h-48 overflow-y-auto overscroll-contain">
              {crmLoading ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  Carregando...
                </div>
              ) : crmError ? (
                <div className="p-4 text-center text-sm text-red-500 flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {crmError}
                </div>
              ) : activeTab === 'clients' ? (
                filteredClients.length === 0 ? (
                  <div className="p-3 text-center text-xs text-gray-500">
                    Nenhum cliente encontrado
                  </div>
                ) : (
                  filteredClients.map((client) => (
                    <button
                      type="button"
                      key={client.id}
                      onClick={() => handleSelectClient(client)}
                      className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                    >
                      <div className="p-1.5 rounded-full bg-egen-navy/10 dark:bg-egen-navy/30 flex-shrink-0">
                        <Building2 className="w-3.5 h-3.5 text-egen-navy dark:text-egen-yellow" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {client.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {client.documentNumber || client.contactEmail || '-'}
                        </p>
                      </div>
                    </button>
                  ))
                )
              ) : (
                filteredLeads.length === 0 ? (
                  <div className="p-3 text-center text-xs text-gray-500">
                    Nenhum lead encontrado
                  </div>
                ) : (
                  filteredLeads.map((lead) => (
                    <button
                      type="button"
                      key={lead.id}
                      onClick={() => handleSelectLead(lead)}
                      className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                    >
                      <div className="p-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30 flex-shrink-0">
                        <User className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {lead.company || lead.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {lead.name} • {lead.email || lead.phone || '-'}
                        </p>
                      </div>
                    </button>
                  ))
                )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ClientSelector;
