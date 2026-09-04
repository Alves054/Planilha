import React, { useState } from 'react';
import { X, FileText, UploadCloud, CheckCircle2, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { importPdfApi } from '../../services/api';

interface PdfImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmImport: () => void;
}

export const PdfImportModal: React.FC<PdfImportModalProps> = ({
  isOpen,
  onClose,
  onConfirmImport
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parsedResult, setParsedResult] = useState<{ totalParsed: number; totalPersisted: number; weekId: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleParseAndImport = async () => {
    setIsParsing(true);
    setErrorMsg(null);

    try {
      // Chama a API real de importação do backend
      const res = await importPdfApi(selectedFile);
      if (res.success && res.totalPersisted > 0) {
        setParsedResult({
          totalParsed: res.totalParsed,
          totalPersisted: res.totalPersisted,
          weekId: res.weekId
        });
      } else {
        setErrorMsg('Não foi possível gravar os treinos no banco de dados.');
      }
    } catch (err: any) {
      console.error('Erro na importação:', err);
      setErrorMsg(err.response?.data?.error || err.message || 'Erro ao processar o arquivo PDF.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleFinish = () => {
    onConfirmImport();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Importar Planilha PDF</h3>
              <p className="text-xs text-zinc-400">
                Envie o PDF do seu treinador para estruturação e gravação no banco
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {!parsedResult ? (
            <div className="space-y-4">
              {/* Dropzone */}
              <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-zinc-700 hover:border-blue-500 rounded-2xl cursor-pointer bg-zinc-900/40 hover:bg-zinc-900 transition-all group">
                <UploadCloud className="w-10 h-10 text-zinc-400 group-hover:text-blue-400 mb-2 transition-colors" />
                <span className="text-sm font-semibold text-zinc-200">
                  {selectedFile ? selectedFile.name : 'Clique para selecionar ou arraste o PDF do treinador aqui'}
                </span>
                <span className="text-xs text-zinc-500 mt-1">
                  Suporta PDFs nos formatos padrão de treinadores de corrida
                </span>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {/* Sample PDF parser info box */}
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span>Extração & Persistência Atômica no Banco de Dados</span>
                </div>
                <p className="text-zinc-300">
                  O algoritmo reconhecerá e gravará no banco: datas, distâncias, paces, tiros, aquecimento, regenerativo e treinos da Manhã/Tarde.
                </p>
              </div>

              {/* Error Box */}
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
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleParseAndImport}
                  disabled={isParsing}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
                >
                  {isParsing ? 'Processando & Gravando...' : 'Processar & Importar PDF'}
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
                    <strong>{parsedResult.totalParsed} treinos</strong> foram extraídos do PDF.
                  </p>
                  <p className="text-xs text-emerald-400 font-semibold">
                    ✓ {parsedResult.totalPersisted} treinos foram gravados no banco de dados e adicionados à Semana de Treinamento.
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
