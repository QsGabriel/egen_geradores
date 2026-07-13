import React, { useState, useRef } from 'react';
import { QrCode, X, Loader2, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface QrcodeUploadProps {
  userId: string;
  currentUrl?: string;
  onUploaded: (url: string) => void;
  onRemove?: () => void;
}

const QrcodeUpload: React.FC<QrcodeUploadProps> = ({ userId, currentUrl, onUploaded, onRemove }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setUploading(true);

    try {
      const ext = file.name.split('.').pop() || 'png';
      const path = `${userId}/qrcode.${ext}`;
      const { error } = await supabase.storage.from('user-qrcodes').upload(path, file, { upsert: true });
      if (error) throw error;

      const { data: urlData } = supabase.storage.from('user-qrcodes').getPublicUrl(path);
      const url = urlData.publicUrl;
      setPreview(url);
      onUploaded(url);
    } catch (err) {
      console.error('Erro ao fazer upload do QR Code:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onRemove?.();
  };

  const displayUrl = preview || currentUrl;

  return (
    <>
      <div className="flex flex-col items-center gap-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">QR Code WhatsApp</label>

        <div
          onClick={() => fileRef.current?.click()}
          className="relative w-24 h-24 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-[#F3B229] dark:hover:border-[#F3B229] cursor-pointer overflow-hidden group transition-all duration-200 flex items-center justify-center bg-gray-50 dark:bg-gray-700/30"
        >
          {displayUrl ? (
            <>
              <img src={displayUrl} alt="QR Code" className="w-full h-full object-cover" />
              {uploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <QrCode className="w-6 h-6 text-white" />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center text-gray-400 dark:text-gray-500">
              {uploading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <QrCode className="w-6 h-6 mb-1" />
                  <span className="text-[10px]">Upload</span>
                </>
              )}
            </div>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = '';
          }}
        />

        <div className="flex items-center gap-2">
          {displayUrl && (
            <>
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="text-xs text-[#F3B229] hover:text-[#E5A320] flex items-center gap-1"
              >
                <Eye className="w-3 h-3" /> Visualizar
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Remover
              </button>
            </>
          )}
        </div>
      </div>

      {showModal && displayUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl z-10" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">QR Code WhatsApp</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex justify-center p-4 bg-white rounded-xl">
              <img src={displayUrl} alt="QR Code WhatsApp" className="w-56 h-56 object-contain" />
            </div>
            <p className="text-xs text-center text-gray-400 mt-3">QR Code do WhatsApp para exibição em contratos</p>
          </div>
        </div>
      )}
    </>
  );
};

export default QrcodeUpload;
