import React, { useState } from 'react';
import { X, Watch, CheckCircle2, AlertCircle, RefreshCw, Terminal, AlertTriangle, ExternalLink, Info } from 'lucide-react';
import { Week, GarminConnectionStatus, SyncLogItem } from '../../types/workout';
import { syncWeekWorkouts, getSyncLogs, getGarminAuthUrl } from '../../services/api';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  week: Week | null;
  garminStatus: GarminConnectionStatus | null;
  onSyncComplete: () => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({
  isOpen,
  onClose,
  week,
  garminStatus,
  onSyncComplete
}) => {
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [syncDone, setSyncDone] = useState<boolean>(false);
  const [historyLogs, setHistoryLogs] = useState<SyncLogItem[]>([]);
  const [activeTab, setActiveTab] = useState<'SYNC' | 'LOGS'>('SYNC');
  const [syncError, setSyncError] = useState<string | null>(null);

  if (!isOpen || !week) return null;

  const isMock = garminStatus?.mode === 'mock';
  const isConnected = garminStatus?.connected ?? false;
  const isConfigured = garminStatus?.isConfigured ?? true;

  const workoutsList = week.trainingDays
    .flatMap((day) =>
      day.workouts
        .filter((w) => w.category !== 'DESCANSO')
        .map((w) => ({
          ...w,
          date: day.date,
          dayOfWeek: day.dayOfWeek
        }))
    );

  const handleConnectOAuth = async () => {
    try {
      const res = await getGarminAuthUrl();
      if (res.url) {
        window.location.href = res.url;
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao conectar à Garmin.');
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncError(null);
    setLogs([]);
    setSyncDone(false);

    const addLog = (msg: string) => {
      const time = new Date().toLocaleTimeString();
      setLogs((prev) => [...prev, `[${time}] ${msg}`]);
    };

    try {
      addLog(`Iniciando validação dos treinos da semana ${week.startDate}...`);
      await new Promise((r) => setTimeout(r, 400));

      addLog(`Total de ${workoutsList.length} treino(s) elegível(eis) para publicação.`);
      await new Promise((r) => setTimeout(r, 400));

      if (isMock) {
        addLog(`⚡ Modo GARMIN MOCK (Desenvolvimento). Simulando envio de treinos...`);
      } else {
        addLog(`🌐 Conectando à Garmin Connect Training API Oficial...`);
      }
      await new Promise((r) => setTimeout(r, 500));

      const response = await syncWeekWorkouts(week.id);

      if (response.syncedWorkouts) {
        for (const item of response.syncedWorkouts) {
          addLog(`${item.syncStatus === 'SINCRONIZADO' ? '✅' : '❌'} ${item.name}: ${item.message}`);
          await new Promise((r) => setTimeout(r, 200));
        }
      }

      addLog(`🎉 Processo de sincronização concluído!`);
      setSyncDone(true);
      onSyncComplete();
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.message || 'Falha na conexão.';
      setSyncError(errMsg);
      addLog(`❌ ERRO: ${errMsg}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const loadHistoryLogs = async () => {
    setActiveTab('LOGS');
    try {
      const logsData = await getSyncLogs();
      setHistoryLogs(logsData);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Watch className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Sincronização Garmin Connect</h3>
                {isMock ? (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    MODO DEMONSTRAÇÃO (MOCK)
                  </span>
                ) : isConnected ? (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    GARMIN REAL CONECTADO ✓
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-500/10 text-rose-400 border border-rose-500/30">
                    NÃO CONECTADO
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                {isMock
                  ? 'Simulação local ativa para testes de desenvolvimento'
                  : isConnected
                  ? `Autorizado como ${garminStatus?.accountName || 'Conta Garmin'}`
                  : 'Exige autorização OAuth 2.0 antes de enviar'}
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

        {/* Informative Note About Garmin Flow */}
        <div className="p-3.5 bg-zinc-900/80 border-b border-zinc-850 text-[11px] text-zinc-400 flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <span>
            <strong>Fluxo de Sincronização:</strong> O Pace Training publica os treinos diretamente no seu <strong>Garmin Connect</strong>. Em seguida, o Garmin Connect disponibiliza os treinos no seu relógio compatível.
          </span>
        </div>

        {/* Status Warning Banners */}
        {!isMock && !isConfigured && (
          <div className="p-4 bg-rose-500/10 border-b border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Integração Garmin Oficial Não Configurada:</strong>
              Para publicar treinos reais no Garmin Connect, defina <code className="bg-zinc-900 px-1 py-0.5 rounded">GARMIN_CLIENT_ID</code> e <code className="bg-zinc-900 px-1 py-0.5 rounded">GARMIN_CLIENT_SECRET</code> no arquivo <code className="bg-zinc-900 px-1 py-0.5 rounded">backend/.env</code>.
            </div>
          </div>
        )}

        {!isMock && isConfigured && !isConnected && (
          <div className="p-4 bg-blue-500/10 border-b border-blue-500/20 text-blue-300 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <span>Conecte sua conta do Garmin Connect via OAuth 2.0 oficial para publicar a semana.</span>
            </div>
            <button
              onClick={handleConnectOAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs shadow transition-all flex-shrink-0"
            >
              <span>Conectar Garmin</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tabs Header */}
        <div className="flex border-b border-zinc-800 bg-zinc-900/30 px-5">
          <button
            onClick={() => setActiveTab('SYNC')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'SYNC'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Sincronizar Semana ({workoutsList.length} Treinos)
          </button>
          <button
            onClick={loadHistoryLogs}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'LOGS'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Histórico de Logs</span>
          </button>
        </div>

        {/* Content Body */}
        {activeTab === 'SYNC' ? (
          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            
            {/* Confirmation Banner */}
            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
              Você está prestes a enviar <strong>{workoutsList.length} treinos</strong> estruturados para a sua conta Garmin Connect.
            </div>

            {/* Workouts summary list */}
            <div>
              <h4 className="text-xs font-semibold text-zinc-300 mb-2 uppercase tracking-wider">
                Treinos Estruturados Prontos Para Envio
              </h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {workoutsList.map((w) => (
                  <div
                    key={w.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900 border border-zinc-850 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      {w.syncStatus === 'SINCRONIZADO' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Watch className="w-4 h-4 text-blue-400" />
                      )}
                      <div>
                        <span className="font-bold text-zinc-200">{w.dayOfWeek}:</span>{' '}
                        <span className="text-zinc-300">{w.name}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-zinc-400">
                        {w.targetDistanceKm || w.estimatedDistanceKm || 0} km
                      </span>
                      {w.syncStatus === 'SINCRONIZADO' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Sincronizado
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Terminal Log Stream */}
            {logs.length > 0 && (
              <div className="p-4 rounded-xl bg-black border border-zinc-800 font-mono text-xs text-zinc-300 space-y-1 max-h-44 overflow-y-auto shadow-inner">
                {logs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed">
                    {log}
                  </div>
                ))}
              </div>
            )}

            {/* Error Message Box */}
            {syncError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
                <strong>Falha na Sincronização:</strong> {syncError}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
              >
                {syncDone ? 'Fechar' : 'Cancelar'}
              </button>

              <button
                type="button"
                onClick={handleSync}
                disabled={isSyncing || workoutsList.length === 0 || (!isMock && (!isConfigured || !isConnected))}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sincronizando com Garmin...</span>
                  </>
                ) : (
                  <>
                    <Watch className="w-4 h-4" />
                    <span>Confirmar Envio</span>
                  </>
                )}
              </button>
            </div>

          </div>
        ) : (
          <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto font-mono text-xs">
            {historyLogs.length > 0 ? (
              historyLogs.map((log) => (
                <div key={log.id} className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
                  <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                    <span className="text-blue-400 font-bold">{log.provider} — {log.action}</span>
                    <span>{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="text-zinc-200 font-sans font-medium">{log.message}</div>
                  {log.error && (
                    <div className="text-rose-400 font-mono text-[11px] bg-rose-500/10 p-1.5 rounded">
                      {log.error}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center text-zinc-500 py-8 font-sans">
                Nenhum log de sincronização registrado ainda.
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
