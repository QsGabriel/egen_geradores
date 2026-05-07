import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import * as XLSX from 'xlsx';
import {
  X,
  Download,
  Upload,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react';
import type { LeadFormData, LeadStatus } from '../types';
import { LEAD_SOURCES } from '../types';

// ── Cabeçalhos da planilha ──────────────────────────────────────────────────
const FIXED_HEADERS = ['Nome*', 'Empresa', 'Origem', 'Status', 'Observações'];
const FIXED_COLS = FIXED_HEADERS.length; // 5
const TEMPLATE_CONTACT_SLOTS = 5; // padrão do modelo para download

function buildContactHeaders(slots: number): string[] {
  const h: string[] = [];
  for (let i = 1; i <= slots; i++) {
    h.push(`Contato${i}_Nome`, `Contato${i}_Telefone`, `Contato${i}_Email`);
  }
  return h;
}

const TEMPLATE_HEADERS = [...FIXED_HEADERS, ...buildContactHeaders(TEMPLATE_CONTACT_SLOTS)];

const STATUS_MAP: Record<string, LeadStatus> = {
  novo: 'new',
  new: 'new',
  contatado: 'contacted',
  contacted: 'contacted',
  'proposta enviada': 'proposal_sent',
  proposal_sent: 'proposal_sent',
  negociação: 'negotiation',
  negociacao: 'negotiation',
  negotiation: 'negotiation',
  ganho: 'won',
  won: 'won',
  perdido: 'lost',
  lost: 'lost',
};

function normalizeStatus(raw: string): LeadStatus {
  return STATUS_MAP[raw?.trim().toLowerCase()] ?? 'new';
}

function normalizeSource(raw: string): string {
  if (!raw) return '';
  const match = LEAD_SOURCES.find(
    s => s.toLowerCase() === raw.trim().toLowerCase()
  );
  return match ?? raw.trim();
}

function parseRows(sheet: XLSX.WorkSheet): LeadFormData[] {
  const json: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  if (json.length < 2) return [];

  // Detect how many ContatoN_* groups exist in the header row
  const headerRow: string[] = (json[0] as any[]).map(c =>
    c !== null && c !== undefined ? String(c).trim() : ''
  );
  const contactSlots = headerRow.reduce((count, h) => {
    const m = h.match(/^[Cc]ontato(\d+)_[Nn]ome$/i);
    if (m) return Math.max(count, parseInt(m[1], 10));
    return count;
  }, 0);

  const rows: LeadFormData[] = [];

  for (let i = 1; i < json.length; i++) {
    const r = json[i];
    if (!r || r.every((c: any) => c === null || c === undefined || c === '')) continue;

    const str = (v: any) => (v !== undefined && v !== null ? String(v).trim() : '');

    const contacts: { name: string; phone: string; email: string }[] = [];
    for (let ci = 0; ci < contactSlots; ci++) {
      const base = FIXED_COLS + ci * 3;
      const name = str(r[base]);
      const phone = str(r[base + 1]);
      const email = str(r[base + 2]);
      if (name || phone || email) {
        contacts.push({ name, phone, email });
      }
    }

    rows.push({
      name: str(r[0]),
      company: str(r[1]),
      source: normalizeSource(str(r[2])),
      status: normalizeStatus(str(r[3])),
      notes: str(r[4]),
      phone: contacts[0]?.phone ?? '',
      email: contacts[0]?.email ?? '',
      contacts,
    });
  }

  return rows;
}

// ── Componente ──────────────────────────────────────────────────────────────

interface LeadImportModalProps {
  onClose: () => void;
  onImport: (
    rows: LeadFormData[],
    onProgress: (done: number, total: number) => void,
  ) => Promise<{ imported: number; errors: string[] }>;
}

const LeadImportModal: React.FC<LeadImportModalProps> = ({ onClose, onImport }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<LeadFormData[]>([]);
  const [fileName, setFileName] = useState('');
  const [parseError, setParseError] = useState('');
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<{ imported: number; errors: string[] } | null>(null);

  // ── Template download ────────────────────────────────────────────────────

  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();

    // Linha de cabeçalhos
    const ws = XLSX.utils.aoa_to_sheet([
      TEMPLATE_HEADERS,
      // Linha de exemplo
      [
        'João da Silva',
        'Empresa Exemplo',
        'Indicação',
        'Novo',
        'Cliente interessado em locação de 200kVA',
        'João da Silva',
        '(11) 99999-0001',
        'joao@empresa.com',
        'Maria Souza',
        '(11) 99999-0002',
        'maria@empresa.com',
        ...Array((TEMPLATE_CONTACT_SLOTS - 2) * 3).fill(''),
      ],
    ]);

    // Larguras das colunas
    const contactColWidths = Array(TEMPLATE_CONTACT_SLOTS * 3)
      .fill(null)
      .map((_, i) => (i % 3 === 0 ? { wch: 20 } : i % 3 === 1 ? { wch: 18 } : { wch: 28 }));
    ws['!cols'] = [
      { wch: 24 }, { wch: 24 }, { wch: 16 }, { wch: 18 }, { wch: 32 },
      ...contactColWidths,
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Leads');
    XLSX.writeFile(wb, 'modelo_importacao_leads.xlsx');
  };

  // ── File parse ───────────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParseError('');
    setPreview([]);
    setResult(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = parseRows(ws);
        if (rows.length === 0) {
          setParseError('Nenhum dado encontrado. Verifique se a planilha segue o modelo.');
        } else {
          setPreview(rows);
        }
      } catch {
        setParseError('Erro ao ler o arquivo. Certifique-se de usar um arquivo .xlsx válido.');
      }
    };
    reader.readAsArrayBuffer(file);
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  // ── Import ───────────────────────────────────────────────────────────────

  const handleImport = async () => {
    if (preview.length === 0) return;
    setImporting(true);
    setProgress(null);
    try {
      const res = await onImport(preview, (done, total) => setProgress({ done, total }));
      setResult(res);
      setPreview([]);
      setFileName('');
    } finally {
      setImporting(false);
      setProgress(null);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  const modal = (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999 }}
      className="flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-yellow-500" />
            Importar Leads via Planilha
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* Instructions + template download */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 space-y-2">
            <p className="text-sm text-yellow-800 dark:text-yellow-300 font-medium">
              Como importar leads em massa:
            </p>
            <ol className="text-sm text-yellow-700 dark:text-yellow-400 list-decimal list-inside space-y-1">
              <li>Baixe a planilha modelo clicando no botão abaixo.</li>
              <li>Preencha os dados nas colunas indicadas (campos com * são obrigatórios).</li>
              <li>Cada lead pode ter quantos contatos quiser — adicione colunas <strong>Contato4_Nome / Contato4_Telefone / Contato4_Email</strong>, Contato5, etc.</li>
              <li>Faça o upload do arquivo preenchido.</li>
              <li>Revise os dados na pré-visualização e clique em Importar.</li>
            </ol>
            <button
              onClick={handleDownloadTemplate}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold rounded-xl text-sm transition-all shadow-sm"
            >
              <Download className="h-4 w-4" /> Baixar Planilha Modelo
            </button>
          </div>

          {/* Upload area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Selecionar Arquivo (.xlsx)
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-yellow-400 dark:hover:border-yellow-500 transition-colors"
            >
              <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              {fileName ? (
                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{fileName}</p>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Clique para selecionar ou arraste o arquivo aqui
                </p>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Parse error */}
          {parseError && (
            <div className="flex items-start gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl p-3">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <p className="text-sm">{parseError}</p>
            </div>
          )}

          {/* Import result */}
          {result && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-xl p-3">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <p className="text-sm font-medium">{result.imported} lead(s) importado(s) com sucesso.</p>
              </div>
              {result.errors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 space-y-1">
                  <p className="text-sm font-medium text-red-700 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" /> {result.errors.length} erro(s):
                  </p>
                  <ul className="text-xs text-red-600 dark:text-red-400 list-disc list-inside space-y-0.5">
                    {result.errors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Import progress bar */}
          {importing && progress && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Importando registros...</span>
                <span>{progress.done} / {progress.total}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Preview table */}
          {preview.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Pré-visualização — {preview.length} lead(s) encontrado(s):
              </p>
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left px-3 py-2 font-semibold text-gray-600 dark:text-gray-400">#</th>
                      <th className="text-left px-3 py-2 font-semibold text-gray-600 dark:text-gray-400">Nome</th>
                      <th className="text-left px-3 py-2 font-semibold text-gray-600 dark:text-gray-400">Empresa</th>
                      <th className="text-left px-3 py-2 font-semibold text-gray-600 dark:text-gray-400">Origem</th>
                      <th className="text-left px-3 py-2 font-semibold text-gray-600 dark:text-gray-400">Status</th>
                      <th className="text-left px-3 py-2 font-semibold text-gray-600 dark:text-gray-400">Contatos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {preview.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <td className="px-3 py-2 text-gray-400">{idx + 1}</td>
                        <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">
                          {row.name || <span className="text-red-500">— (obrigatório)</span>}
                        </td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{row.company || '—'}</td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{row.source || '—'}</td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{row.status}</td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-300">
                          {row.contacts.length > 0
                            ? row.contacts.map((c, ci) => (
                                <div key={ci}>{c.name || c.phone || c.email}</div>
                              ))
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-sm"
          >
            {result ? 'Fechar' : 'Cancelar'}
          </button>
          {preview.length > 0 && !result && (
            <button
              onClick={handleImport}
              disabled={importing}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold rounded-xl shadow-md transition-all text-sm disabled:opacity-50"
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {progress
                    ? `${progress.done} / ${progress.total}`
                    : 'Importando...'}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Importar {preview.length} Lead(s)
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default LeadImportModal;
