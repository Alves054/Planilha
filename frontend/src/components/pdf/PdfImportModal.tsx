import React, { useState, useCallback } from 'react';
import {
  X, FileText, UploadCloud, CheckCircle2, ArrowRight,
  Sparkles, AlertCircle, ImageIcon, FileImage, Loader2
} from 'lucide-react';
import { importPdfApi, importImageApi } from '../../services/api';

interface PdfImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmImport: () => void;
  athleteId?: string;
  athleteName?: string;
}

type ImportMode = 'pdf' | 'image';
type UploadStatus = 'idle' | 'parsing' | 'success' | 'error';

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
const PDF_TYPES = ['application/pdf'];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const PdfImportModal: React.FC<PdfImportModalProps> = ({
  isOpen,
  onClose,
  onConfirmImport,
  athleteId,
  athleteName
}) => {
  const [mode, setMode] = useState<ImportMode>('pdf');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [parsedResult, setParsedResult] = useState<{
    totalParsed: number;
    totalPersisted: number;
    weekId: string;
    source?: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // ─── Todos os handlers devem ficar ANTES de qualquer early return ───

  const resetState = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setStatus('idle');
    setParsedResult(null);
    setErrorMsg(null);
  };

  const handleModeChange = (newMode: ImportMode) => {
    setMode(newMode);
    resetState();
  };

  const applyFile = (file: File) => {
    const isPdf = PDF_TYPES.includes(file.type);
    const isImage = IMAGE_TYPES.includes(file.type);

    if (mode === 'pdf' && !isPdf) {
      setErrorMsg('Arquivo inválido. Selecione um PDF para este modo.');
      return;
    }
    if (mode === 'image' && !isImage) {
      setErrorMsg('Arquivo inválido. Selecione uma imagem (PNG, JPG, WEBP) para este modo.');
      return;
    }

    setSelectedFile(file);
    setErrorMsg(null);

    if (isImage) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      applyFile(e.target.files[0]);
    }
  };

  // useCallback precisa ficar ANTES do early return (regra dos hooks)
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        applyFile(e.dataTransfer.files[0]);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode]
  );

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  // ─── Early return DEPOIS de todos os hooks e handlers ───
  if (!isOpen) return null;

  const acceptedTypes = mode === 'pdf'
    ? '.pdf,application/pdf'
    : '.png,.jpg,.jpeg,.webp,.gif,image/png,image/jpeg,image/webp,image/gif';

  const handleParseAndImport = async () => {
    if (!selectedFile && mode === 'image') {
      setErrorMsg('Selecione uma imagem da planilha para importar.');
      return;
    }

    setStatus('parsing');
    setErrorMsg(null);

    try {
      let res;

      if (mode === 'image' && selectedFile) {
        res = await importImageApi(selectedFile, undefined, athleteId);
      } else {
        res = await importPdfApi(selectedFile, undefined, athleteId);
      }

      if (res.success && res.totalPersisted > 0) {
        setParsedResult({
          totalParsed: res.totalParsed,
          totalPersisted: res.totalPersisted,
          weekId: res.weekId,
          source: (res as any).source
        });
        setStatus('success');
      } else {
        setErrorMsg('Não foi possível gravar os treinos no banco de dados.');
        setStatus('error');
      }
    } catch (err: any) {
      console.error('Erro na importação:', err);
      setErrorMsg(err.response?.data?.error || err.message || 'Erro ao processar o arquivo.');
      setStatus('error');
    }
  };

  const handleFinish = () => {
    onConfirmImport();
    onClose();
    resetState();
  };

  const handleClose = () => {
    onClose();
    resetState();
  };

  const isParsing = status === 'parsing';
  const isSuccess = status === 'success';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-8">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              {mode === 'image' ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Importar Planilha de Treino</span>
                {athleteName && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                    Aluno: {athleteName}
                  </span>
                )}
              </h3>
              <p className="text-xs text-zinc-400">
                {athleteName ? `Os treinos importados serão atribuídos diretamente a ${athleteName}` : 'Envie um PDF ou uma foto/print da planilha do seu treinador'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        {!isSuccess && (
          <div className="flex gap-1 p-3 border-b border-zinc-800 bg-zinc-900/30">
            <button
              onClick={() => handleModeChange('pdf')}
              className={`flex items-center gap-2 flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${
                mode === 'pdf'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              PDF do Treinador
            </button>
            <button
              onClick={() => handleModeChange('image')}
              className={`flex items-center gap-2 flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${
                mode === 'image'
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              <FileImage className="w-4 h-4" />
              Foto / Print da Planilha
            </button>
          </div>
        )}

        {/* Body */}
        <div className="p-6 space-y-5">
          {!isSuccess ? (
            <div className="space-y-4">

              {/* Dropzone */}
              <label
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl cursor-pointer transition-all group overflow-hidden ${
                  isDragOver
                    ? 'border-blue-400 bg-blue-500/10'
                    : 'border-zinc-700 hover:border-blue-500 bg-zinc-900/40 hover:bg-zinc-900'
                }`}
              >
                {/* Image preview */}
                {imagePreview && mode === 'image' ? (
                  <div className="w-full relative">
                    <img
                      src={imagePreview}
                      alt="Preview da planilha"
                      className="w-full max-h-72 object-contain"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                      <div className="text-white">
                        <p className="text-sm font-bold">{selectedFile?.name}</p>
                        <p className="text-xs text-zinc-300">{selectedFile ? formatFileSize(selectedFile.size) : ''} — Clique para trocar a imagem</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 flex flex-col items-center">
                    {mode === 'image' ? (
                      <FileImage className="w-10 h-10 text-zinc-400 group-hover:text-violet-400 mb-2 transition-colors" />
                    ) : (
                      <UploadCloud className="w-10 h-10 text-zinc-400 group-hover:text-blue-400 mb-2 transition-colors" />
                    )}
                    <span className="text-sm font-semibold text-zinc-200 text-center">
                      {selectedFile
                        ? selectedFile.name
                        : mode === 'image'
                          ? 'Clique ou arraste uma foto / print da planilha aqui'
                          : 'Clique para selecionar ou arraste o PDF do treinador aqui'
                      }
                    </span>
                    <span className="text-xs text-zinc-500 mt-1">
                      {mode === 'image'
                        ? 'Suporta PNG, JPG, JPEG, WEBP — até 20MB'
                        : 'Suporta PDFs nos formatos padrão de treinadores de corrida'
                      }
                    </span>
                    {selectedFile && !imagePreview && (
                      <span className="text-xs text-blue-400 mt-2 font-semibold">
                        {formatFileSize(selectedFile.size)} selecionado ✓
                      </span>
                    )}
                  </div>
                )}
                <input
                  type="file"
                  accept={acceptedTypes}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {/* Info box */}
              <div className={`p-4 rounded-xl text-xs space-y-1 ${
                mode === 'image'
                  ? 'bg-violet-500/10 border border-violet-500/20 text-violet-300'
                  : 'bg-blue-500/10 border border-blue-500/20 text-blue-300'
              }`}>
                <div className="flex items-center gap-1.5 font-bold">
                  <Sparkles className={`w-4 h-4 ${mode === 'image' ? 'text-violet-400' : 'text-blue-400'}`} />
                  <span>
                    {mode === 'image'
                      ? 'Leitura de Imagem com OpenAI Vision (GPT-4o)'
                      : 'Extração & Persistência Atômica no Banco de Dados'
                    }
                  </span>
                </div>
                <p className="text-zinc-300">
                  {mode === 'image'
                    ? 'A IA vai ler a planilha da imagem e extrair automaticamente: dias, distâncias, paces, séries, acadêmia, fartlek, longão e todos os treinos da semana.'
                    : 'O algoritmo reconhecerá e gravará no banco: datas, distâncias, paces, tiros, aquecimento, regenerativo e treinos da Manhã/Tarde.'
                  }
                </p>
              </div>

              {/* Error */}
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleParseAndImport}
                  disabled={isParsing || (mode === 'image' && !selectedFile)}
                  className={`flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg text-white shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    mode === 'image'
                      ? 'bg-violet-600 hover:bg-violet-500 shadow-violet-600/30'
                      : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
                  }`}
                >
                  {isParsing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {mode === 'image' ? 'Analisando imagem com IA...' : 'Processando & Gravando...'}
                    </>
                  ) : (
                    mode === 'image' ? '🤖 Extrair Treinos da Imagem' : 'Processar & Importar PDF'
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-emerald-300">
                    ✓ Treinos Identificados e Salvos com Sucesso!
                  </h4>
                  <p className="text-xs text-zinc-300">
                    <strong>{parsedResult?.totalParsed} treinos</strong> foram extraídos{' '}
                    {parsedResult?.source === 'image' ? 'da imagem via OpenAI Vision' : 'do PDF'}.
                  </p>
                  <p className="text-xs text-emerald-400 font-semibold">
                    ✓ {parsedResult?.totalPersisted} treinos foram gravados no banco de dados e adicionados à Semana de Treinamento.
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-zinc-800">
                <button
                  onClick={handleFinish}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all"
                >
                  <span>Ver Treinos no Calendário</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
