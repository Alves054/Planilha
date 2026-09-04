import React from 'react';
import { Activity, Watch, RefreshCw, PlusCircle, CheckCircle2, AlertTriangle, LogOut, MessageSquare, Calendar } from 'lucide-react';
import { GarminConnectionStatus } from '../../types/workout';
import { getGarminAuthUrl, disconnectGarmin } from '../../services/api';

interface NavbarProps {
  currentView: 'CALENDAR' | 'PACE_AI';
  onSelectView: (view: 'CALENDAR' | 'PACE_AI') => void;
  garminStatus: GarminConnectionStatus | null;
  onToggleMock: () => void;
  onOpenSyncModal: () => void;
  onNewWeek: () => void;
  onImportPdfClick: () => void;
  onRefreshStatus: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onSelectView,
  garminStatus,
  onToggleMock,
  onOpenSyncModal,
  onNewWeek,
  onImportPdfClick,
  onRefreshStatus
}) => {
  const isMock = garminStatus?.mode === 'mock';
  const isConnected = garminStatus?.connected ?? false;

  const handleConnectClick = async () => {
    if (isMock) {
      onOpenSyncModal();
      return;
    }

    try {
      const res = await getGarminAuthUrl();
      if (res.url) {
        window.location.href = res.url;
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao obter URL de conexão da Garmin.');
    }
  };

  const handleDisconnectClick = async () => {
    if (confirm('Deseja desconectar sua conta Garmin Connect?')) {
      await disconnectGarmin();
      onRefreshStatus();
    }
  };

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        
        {/* Logo & Navigation Tabs */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-500/10">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white">PACE TRAINING</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  PRO
                </span>
              </div>
              <p className="text-xs text-zinc-400 hidden md:block">
                Seu treinamento. Organizado. Estruturado. No seu Garmin.
              </p>
            </div>
          </div>

          {/* Navigation Links (Calendário vs PACE AI) */}
          <nav className="hidden sm:flex items-center gap-1.5 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800 text-xs font-semibold">
            <button
              onClick={() => onSelectView('CALENDAR')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                currentView === 'CALENDAR'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Calendário</span>
            </button>

            <button
              onClick={() => onSelectView('PACE_AI')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                currentView === 'PACE_AI'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
              <span>💬 PACE AI</span>
            </button>
          </nav>
        </div>

        {/* Actions & Garmin Badge */}
        <div className="flex items-center gap-3">
          
          {/* Garmin Status Badge */}
          <div className="hidden lg:flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
            <Watch className="w-4 h-4 text-blue-400" />
            
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-zinc-200">Garmin Connect</span>
                
                {isMock ? (
                  <span className="flex items-center gap-1 px-2 py-0.2 text-[10px] font-bold rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    <AlertTriangle className="w-3 h-3 text-amber-400" /> MOCK
                  </span>
                ) : isConnected ? (
                  <span className="flex items-center gap-1 px-2 py-0.2 text-[10px] font-bold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> CONECTADO ✓
                  </span>
                ) : (
                  <span className="px-2 py-0.2 text-[10px] font-bold rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                    Não conectado
                  </span>
                )}
              </div>

              <span className="text-[10px] text-zinc-500 font-mono">
                {isMock
                  ? 'Modo Simulação Ativo'
                  : isConnected
                  ? garminStatus?.accountName || 'Conta Autorizada'
                  : 'Autorização OAuth 2.0 PENDENTE'}
              </span>
            </div>

            {/* Quick Actions for Garmin */}
            <div className="flex items-center gap-1 pl-2 border-l border-zinc-800">
              {!isMock && !isConnected && (
                <button
                  onClick={handleConnectClick}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all shadow"
                >
                  [ CONECTAR GARMIN ]
                </button>
              )}

              {!isMock && isConnected && (
                <button
                  onClick={handleDisconnectClick}
                  title="Desconectar Conta Garmin"
                  className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-rose-400 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                onClick={onToggleMock}
                title="Alternar GARMIN_MODE (Production vs Mock)"
                className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

          {/* PACE AI Mobile Toggle */}
          <button
            onClick={() => onSelectView(currentView === 'CALENDAR' ? 'PACE_AI' : 'CALENDAR')}
            className="sm:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-bold"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{currentView === 'CALENDAR' ? 'PACE AI' : 'Calendário'}</span>
          </button>

          {/* Import PDF Button */}
          <button
            onClick={onImportPdfClick}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-zinc-200 text-sm font-medium transition-all hover:border-zinc-600 shadow-sm"
          >
            <PlusCircle className="w-4 h-4 text-blue-400" />
            <span className="hidden sm:inline">+ Importar PDF</span>
          </button>

          {/* Sync Button */}
          <button
            onClick={onOpenSyncModal}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/25 hover:shadow-blue-500/35 transition-all"
          >
            <Watch className="w-4 h-4" />
            <span className="hidden sm:inline">Sincronizar Garmin</span>
          </button>

        </div>
      </div>
    </header>
  );
};
