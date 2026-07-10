import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Upload, Trash2, Loader2, Type, Save } from 'lucide-react';
import { useProposalCover } from '../../hooks/useProposalCover';
import { useProposalCoverConfig, type ProposalCoverConfig } from '../../../../hooks/useAppSettings';
import { useNotification } from '../../../../hooks/useNotification';
import Notification from '../../../../components/Notification';

const DEFAULT_COVER = '/CAPA.png';

const EMPTY_CONFIG: ProposalCoverConfig = { capaUrl: null, textColor: null, textBgColor: null };

function deepEqual(a: ProposalCoverConfig, b: ProposalCoverConfig): boolean {
  return a.capaUrl === b.capaUrl && a.textColor === b.textColor && a.textBgColor === b.textBgColor;
}

export default function ProposalSettingsModal() {
  const { value: saved, loading, saving, update } = useProposalCoverConfig();
  const { uploading, error: coverError, uploadCover, deleteCover } = useProposalCover();
  const { notification, showSuccess, showError, hideNotification } = useNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [draft, setDraft] = useState<ProposalCoverConfig>(EMPTY_CONFIG);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState(false);

  const savedConfig = saved ?? EMPTY_CONFIG;
  const isDirty = !deepEqual(draft, savedConfig);
  const hasPendingFile = !!selectedFile;

  useEffect(() => {
    if (!loading && saved) {
      setDraft(saved);
    }
  }, [loading, saved]);

  const displayUrl = previewUrl || draft.capaUrl || null;
  const effectiveCoverUrl = !imageError && displayUrl ? displayUrl : DEFAULT_COVER;
  const hasCustomCover = !!(draft.capaUrl);
  const isShowingDefaultFallback = (!displayUrl || imageError) && !previewUrl;

  const coverTextColor = draft.textColor || '#ffffff';
  const coverTextBg = draft.textBgColor || null;

  const patchDraft = useCallback((patch: Partial<ProposalCoverConfig>) => {
    setDraft(prev => ({ ...prev, ...patch }));
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.type)) {
      showError('Formato inválido', 'Use PNG, JPG ou WebP (até 5MB)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showError('Arquivo grande', 'A imagem deve ter no máximo 5MB');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setImageError(false);
  }, [showError]);

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;
    const url = await uploadCover(selectedFile);
    if (url) {
      patchDraft({ capaUrl: url });
      setSelectedFile(null);
      setPreviewUrl(null);
      setImageError(false);
    }
  }, [selectedFile, uploadCover, patchDraft]);

  const handleRemoveCover = useCallback(() => {
    setDraft(prev => ({ ...prev, capaUrl: null }));
    setSelectedFile(null);
    setPreviewUrl(null);
    setImageError(false);
  }, []);

  const handleSave = useCallback(async () => {
    if (draft.capaUrl === null && savedConfig.capaUrl) {
      await deleteCover(savedConfig.capaUrl);
    }
    await update(draft);
    showSuccess('Configuração salva', 'As alterações foram aplicadas a todas as propostas.');
  }, [draft, savedConfig, deleteCover, update, showSuccess]);

  const handleDiscard = useCallback(() => {
    setDraft(savedConfig);
    setSelectedFile(null);
    setPreviewUrl(null);
    setImageError(false);
  }, [savedConfig]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#0D2A59] dark:text-[#F3B229] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="space-y-6">
        {/* Preview da capa com sobreposição do texto */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Preview da Capa
          </h3>

          <div
            className="relative w-full rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-[#0f2f72]"
            style={{ aspectRatio: '210 / 297' }}
          >
            <img
              src={effectiveCoverUrl}
              alt="Preview da capa"
              className="absolute inset-0 w-full h-full object-cover"
              onError={() => setImageError(true)}
              onLoad={() => setImageError(false)}
            />

            <div
              className="absolute left-0 w-full text-center"
              style={{ top: `${(8 / 297) * 100}%` }}
            >
              <span
                className="inline-block font-bold tracking-wide"
                style={{
                  color: coverTextColor,
                  fontSize: 'clamp(9px, 4vw, 15px)',
                  backgroundColor: coverTextBg || 'transparent',
                  padding: coverTextBg ? '0.3em 0.8em' : '0',
                  borderRadius: coverTextBg ? '0.4em' : '0',
                  lineHeight: 1.2,
                }}
              >
                PROPOSTA DE LOCAÇÃO
              </span>
            </div>

            {isShowingDefaultFallback && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                <span className="text-white text-[10px] font-medium bg-black/40 px-2.5 py-1 rounded-full">
                  Capa padrão EGEN
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Upload de imagem */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Foto de Capa
          </h3>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || saving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#0D2A59] dark:text-[#F3B229] border border-[#0D2A59]/30 dark:border-[#F3B229]/30 rounded-lg hover:bg-[#0D2A59]/5 dark:hover:bg-[#F3B229]/5 transition-colors disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              {hasCustomCover ? 'Trocar imagem' : 'Selecionar imagem'}
            </button>

            {hasCustomCover && (
              <button
                onClick={handleRemoveCover}
                disabled={uploading || saving}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                Voltar ao padrão
              </button>
            )}
          </div>

          {hasPendingFile && (
            <div className="mt-2 p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-between">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Nova imagem selecionada.
              </p>
              <button
                onClick={handleUpload}
                disabled={uploading || saving}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-white bg-[#0D2A59] rounded-md hover:bg-[#0D2A59]/90 disabled:opacity-50"
              >
                {uploading ? (
                  <><Loader2 className="w-3 h-3 animate-spin" /> Enviando...</>
                ) : (
                  <><Upload className="w-3 h-3" /> Enviar</>
                )}
              </button>
            </div>
          )}

          {coverError && (
            <p className="mt-2 text-xs text-red-500">{coverError}</p>
          )}
        </div>

        {/* Estilo do Texto */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <Type className="w-4 h-4" />
            Estilo do Texto da Capa
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                Cor do texto
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={coverTextColor}
                  onChange={(e) => patchDraft({ textColor: e.target.value })}
                  className="w-9 h-9 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer p-0.5"
                />
                <button
                  onClick={() => patchDraft({ textColor: null })}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline"
                >
                  Padrão
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                Fundo do texto
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={coverTextBg ? rgbToHex(coverTextBg) : '#000000'}
                  onChange={(e) => {
                    const hex = e.target.value;
                    const r = parseInt(hex.slice(1, 3), 16);
                    const g = parseInt(hex.slice(3, 5), 16);
                    const b = parseInt(hex.slice(5, 7), 16);
                    patchDraft({ textBgColor: `rgba(${r},${g},${b},0.55)` });
                  }}
                  disabled={!coverTextBg}
                  className="w-9 h-9 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer p-0.5 disabled:opacity-30 disabled:cursor-not-allowed"
                />
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!!coverTextBg}
                    onChange={(e) => patchDraft({ textBgColor: e.target.checked ? 'rgba(0,0,0,0.55)' : null })}
                    className="rounded border-gray-300 dark:border-gray-600 text-[#0D2A59] focus:ring-[#0D2A59]"
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Ativar</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Save / Discard bar */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          {(isDirty || hasPendingFile) && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg mb-3">
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Há alterações não salvas.
              </p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving || uploading || (!isDirty && !hasPendingFile)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#0D2A59] rounded-lg hover:bg-[#0D2A59]/90 active:scale-[0.97] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
              ) : (
                <><Save className="w-4 h-4" /> Salvar alterações</>
              )}
            </button>

            {isDirty && (
              <button
                onClick={handleDiscard}
                disabled={saving || uploading}
                className="px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              >
                Descartar
              </button>
            )}
          </div>
        </div>
      </div>

      <Notification
        type={notification.type}
        title={notification.title}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />
    </div>
  );
}

function rgbToHex(rgba: string): string {
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return '#000000';
  const r = parseInt(match[1]).toString(16).padStart(2, '0');
  const g = parseInt(match[2]).toString(16).padStart(2, '0');
  const b = parseInt(match[3]).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}
