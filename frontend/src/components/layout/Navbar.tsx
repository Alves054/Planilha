import React from 'react';
import { 
  Activity, 
  Watch, 
  RefreshCw, 
  PlusCircle, 
  CheckCircle2, 
  AlertTriangle, 
  LogOut, 
  MessageSquare, 
  Calendar, 
  Users, 
  Sparkles,
  LogIn 
} from 'lucide-react';
import { GarminConnectionStatus, UserProfile } from '../../types/workout';
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
  currentUser: UserProfile | null;
  onOpenAdmin: () => void;
  onLogout: () => void;
  onOpenLogin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onSelectView,
  garminStatus,
  onToggleMock,
  onOpenSyncModal,
  onNewWeek,
  onImportPdfClick,
  onRefreshStatus,
  currentUser,
  onOpenAdmin,
  onLogout,
  onOpenLogin
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
    <header className="sticky top-0 z-40 glass-panel border-b border-gray-800/80 shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        
        {/* Logo & Navigation Tabs */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-[2px] shadow-lg shadow-blue-500/25">
              <div className="w-full h-full bg-[#0b0f19] rounded-[14px] flex items-center justify-center">
                <Activity className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tight text-white">PACE CLUB</span>
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-blue-500/20 text-cyan-400 border border-blue-500/30">
                  PRO
                </span>
              </div>
              <p className="text-[11px] font-medium text-gray-400 hidden md:block">
                Prescrição inteligente & Garmin Connect
              </p>
            </div>
          </div>

          {/* Navigation Links (Calendário vs PACE AI) */}
          <nav className="hidden sm:flex items-center gap-1.5 bg-gray-900/90 p-1.5 rounded-2xl border border-gray-800 text-xs font-bold">
            <button
              onClick={() => onSelectView('CALENDAR')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
                currentView === 'CALENDAR'
                  ? 'gradient-btn text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Calendário</span>
            </button>

            <button
              onClick={() => onSelectView('PACE_AI')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
                currentView === 'PACE_AI'
                  ? 'gradient-btn text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
              }`}
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>PACE AI</span>
            </button>
          </nav>
        </div>

        {/* Actions & Garmin Badge */}
        <div className="flex items-center gap-3">
          
          {/* Garmin Status Badge (Coach only) */}
          {currentUser?.role === 'COACH' && (
            <div className="hidden lg:flex items-center gap-3 px-3.5 py-1.5 rounded-2xl bg-gray-900/80 border border-gray-800 text-xs">
              <Watch className="w-4 h-4 text-cyan-400" />
              
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-gray-200">Garmin</span>
                  
                  {isMock ? (
                    <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-black rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      <AlertTriangle className="w-3 h-3 text-amber-400" /> MOCK
                    </span>
                  ) : isConnected ? (
                    <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-black rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> CONECTADO
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] font-black rounded-md bg-gray-800 text-gray-400 border border-gray-700">
                      Desconectado
                    </span>
                  )}
                </div>

                <span className="text-[10px] text-gray-500 font-mono">
                  {isMock
                    ? 'Simulação'
                    : isConnected
                    ? garminStatus?.accountName || 'Autorizado'
                    : 'OAuth 2.0'}
                </span>
              </div>

              {/* Quick Actions for Garmin */}
              <div className="flex items-center gap-1 pl-2 border-l border-gray-800">
                {!isMock && !isConnected && (
                  <button
                    onClick={handleConnectClick}
                    className="px-2.5 py-1 text-[11px] font-extrabold rounded-lg gradient-btn text-white transition-all shadow cursor-pointer"
                  >
                    Conectar
                  </button>
                )}

                {!isMock && isConnected && (
                  <button
                    onClick={handleDisconnectClick}
                    title="Desconectar Conta Garmin"
                    className="p-1 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  onClick={onToggleMock}
                  title="Alternar GARMIN_MODE (Production vs Mock)"
                  className="p-1 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          )}

          {/* PACE AI Mobile Toggle */}
          <button
            onClick={() => onSelectView(currentView === 'CALENDAR' ? 'PACE_AI' : 'CALENDAR')}
            className="sm:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-bold"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>{currentView === 'CALENDAR' ? 'PACE AI' : 'Planilha'}</span>
          </button>

          {/* Coach Actions */}
          {currentUser?.role === 'COACH' && (
            <>
              {/* Import PDF */}
              <button
                onClick={onImportPdfClick}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-700 hover:bg-gray-800 text-gray-200 text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">PDF / Foto</span>
              </button>

              {/* Sync Garmin */}
              <button
                onClick={onOpenSyncModal}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl gradient-btn text-white text-xs font-bold shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
              >
                <Watch className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Garmin</span>
              </button>

              {/* Admin Panel */}
              <button
                onClick={onOpenAdmin}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black shadow-lg shadow-indigo-600/30 transition-all cursor-pointer border border-indigo-400/30"
                title="Abrir Painel de Gestão de Alunos e Treinos"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Painel do Treinador</span>
              </button>
            </>
          )}

          {/* User Profile & Logout */}
          {currentUser ? (
            <div className="flex items-center gap-3 pl-2 border-l border-gray-800">
              <div className="flex flex-col text-right hidden md:block">
                <span className="text-xs font-bold text-white leading-tight">{currentUser.name}</span>
                <span className="text-[10px] text-cyan-400 uppercase font-black tracking-wider">
                  {currentUser.role === 'COACH' ? 'Treinador' : 'Atleta'}
                </span>
              </div>
              <button
                onClick={onLogout}
                title="Sair / Trocar Usuário"
                className="p-2.5 rounded-xl bg-gray-900 border border-gray-800 hover:bg-gray-800 text-gray-400 hover:text-rose-400 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl gradient-btn text-xs font-bold text-white shadow-md cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Entrar</span>
            </button>
          )}

        </div>
      </div>
    </header>
  );
};
