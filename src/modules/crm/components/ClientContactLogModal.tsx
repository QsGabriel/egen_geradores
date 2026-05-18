/**
 * ClientContactLogModal
 * Modal dedicado ao histórico de contatos de um cliente específico.
 * Exibe o ClientContactLogSection dentro de um portal fullscreen.
 */
import React from 'react';
import { createPortal } from 'react-dom';
import { X, MessageSquarePlus } from 'lucide-react';
import ContactLogSection from './ContactLogSection';
import type { Client } from '../types';

interface Props {
  client: Client;
  onClose: () => void;
}

export default function ClientContactLogModal({ client, onClose }: Props) {
  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999 }}
      className="flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <MessageSquarePlus className="h-5 w-5 text-yellow-500" />
              Histórico de Contatos
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
              {client.name}
            </p>
            {client.contactName && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Contato principal: {client.contactName}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <ContactLogSection entityType="client" entityId={client.id} />
        </div>
      </div>
    </div>,
    document.body,
  );
}
