import React, { useState, useRef } from 'react';
import { Camera, X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AvatarUploadProps {
  userId: string;
  currentUrl?: string;
  onUploaded: (url: string) => void;
  onRemove?: () => void;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({ userId, currentUrl, onUploaded, onRemove }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setUploading(true);

    try {
      const ext = file.name.split('.').pop() || 'png';
      const path = `${userId}/avatar.${ext}`;
      const { error } = await supabase.storage.from('user-avatars').upload(path, file, { upsert: true });
      if (error) throw error;

      const { data: urlData } = supabase.storage.from('user-avatars').getPublicUrl(path);
      const url = urlData.publicUrl;
      setPreview(url);
      onUploaded(url);
    } catch (err) {
      console.error('Erro ao fazer upload:', err);
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
    <div className="flex flex-col items-center gap-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Foto de Perfil</label>

      <div
        onClick={() => fileRef.current?.click()}
        className="relative w-24 h-24 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-[#F3B229] dark:hover:border-[#F3B229] cursor-pointer overflow-hidden group transition-all duration-200 flex items-center justify-center bg-gray-50 dark:bg-gray-700/30"
      >
        {displayUrl ? (
          <>
            <img src={displayUrl} alt="Avatar" className="w-full h-full object-cover" />
            {uploading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center text-gray-400 dark:text-gray-500">
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <Camera className="w-6 h-6 mb-1" />
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

      {displayUrl && (
        <button
          type="button"
          onClick={handleRemove}
          className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
        >
          <X className="w-3 h-3" /> Remover
        </button>
      )}
    </div>
  );
};

export default AvatarUpload;
