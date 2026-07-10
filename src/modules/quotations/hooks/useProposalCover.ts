import { useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';

const BUCKET_NAME = 'proposal-covers';

interface UseProposalCoverReturn {
  uploading: boolean;
  error: string | null;
  uploadCover: (file: File) => Promise<string | null>;
  deleteCover: (filePath: string) => Promise<boolean>;
  getPublicUrl: (filePath: string) => string;
}

export function useProposalCover(): UseProposalCoverReturn {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadCover = useCallback(async (file: File): Promise<string | null> => {
    setUploading(true);
    setError(null);

    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `capa_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '31536000',
          upsert: false,
        });

      if (uploadError) {
        setError(uploadError.message);
        return null;
      }

      const { data } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      return data?.publicUrl || null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar imagem');
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  const deleteCover = useCallback(async (url: string): Promise<boolean> => {
    try {
      const filePath = extractPathFromUrl(url);
      if (!filePath) return false;

      const { error: deleteError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);

      if (deleteError) {
        setError(deleteError.message);
        return false;
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover imagem');
      return false;
    }
  }, []);

  const getPublicUrl = useCallback((filePath: string): string => {
    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);
    return data?.publicUrl || '';
  }, []);

  return { uploading, error, uploadCover, deleteCover, getPublicUrl };
}

function extractPathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const bucketIndex = pathParts.indexOf(BUCKET_NAME);
    if (bucketIndex === -1) return null;
    return pathParts.slice(bucketIndex + 1).join('/');
  } catch {
    return null;
  }
}
