import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { SummaryCards } from './components/dashboard/SummaryCards';
import { WeeklyCalendar } from './components/calendar/WeeklyCalendar';
import { WorkoutModal } from './components/workout/WorkoutModal';
import { SyncModal } from './components/garmin/SyncModal';
import { PdfImportModal } from './components/pdf/PdfImportModal';
import { LoginModal } from './components/auth/LoginModal';
import { AdminPanel } from './components/admin/AdminPanel';
import { WorkoutResultModal } from './components/workout/WorkoutResultModal';
import { PaceZonesModal } from './components/admin/PaceZonesModal';
import { LoginPage } from './pages/LoginPage';
import { PaceAI } from './pages/PaceAI';
import {
  Week, WeekMetrics, Workout, TrainingDay,
  GarminConnectionStatus, UserProfile, AthleteItem
} from './types/workout';
import {
  getCurrentWeek,
  createWorkout,
  updateWorkout,
  deleteWorkout,
  duplicateWorkout,
  getGarminStatus,
  toggleGarminMock,
  createWeek,
  getMeApi
} from './services/api';
import { Activity, Info, Users, User, ArrowLeft, Plus, Edit2 } from 'lucide-react';

export function App() {
  const [currentView, setCurrentView] = useState<'CALENDAR' | 'PACE_AI'>('CALENDAR');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [selectedAthlete, setSelectedAthlete] = useState<AthleteItem | null>(null);

  const [week, setWeek] = useState<Week | null>(null);
  const [metrics, setMetrics] = useState<WeekMetrics | null>(null);
  const [garminStatus, setGarminStatus] = useState<GarminConnectionStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState<boolean>(false);
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState<boolean>(false);
  const [selectedDayId, setSelectedDayId] = useState<string | undefined>(undefined);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState<boolean>(false);
  const [resultWorkout, setResultWorkout] = useState<Workout | null>(null);
  const [isPaceZonesModalOpen, setIsPaceZonesModalOpen] = useState<boolean>(false);

  // Carregar usuário logado do localStorage no início
  useEffect(() => {
    const savedUser = localStorage.getItem('pace_user');
    const token = localStorage.getItem('pace_token');

    if (savedUser && token) {
      try {
        const parsed = JSON.parse(savedUser) as UserProfile;
        setCurrentUser(parsed);
      } catch (e) {
        localStorage.removeItem('pace_user');
        localStorage.removeItem('pace_token');
      }
    }
  }, []);

  const loadData = async (athleteId?: string) => {
    try {
      setLoading(true);
      setError(null);

      // Se um atleta estiver selecionado ou o usuário logado for atleta, busca a semana dele
      const targetAthleteId = athleteId || selectedAthlete?.id || (currentUser?.role === 'ATHLETE' ? currentUser.id : undefined);

      const data = await getCurrentWeek(targetAthleteId);
      setWeek(data.week);
      setMetrics(data.metrics);

      const conn = await getGarminStatus();
      setGarminStatus(conn);
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      const errMsg = err.response?.data?.error || err.message || 'Não foi possível conectar ao servidor backend.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Checar se a URL possui retorno do OAuth Garmin
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('garmin_connected') === 'true') {
      alert('Sua conta Garmin Connect foi autorizada com sucesso!');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [selectedAthlete, currentUser]);

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setIsLoginModalOpen(false);
    if (user.role === 'COACH') {
      // Abre o painel do professor automaticamente para gerenciar alunos
      setIsAdminPanelOpen(true);
    } else {
      setSelectedAthlete(null);
    }
    loadData();
  };

  const handleLogout = () => {
    localStorage.removeItem('pace_token');
    localStorage.removeItem('pace_user');
    setCurrentUser(null);
    setSelectedAthlete(null);
    setIsLoginModalOpen(true);
  };

  const handleToggleMock = async () => {
    try {
      await toggleGarminMock();
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAddWorkout = (day?: TrainingDay) => {
    setEditingWorkout(null);
    setSelectedDayId(day?.id);
    setIsWorkoutModalOpen(true);
  };

  const handleOpenEditWorkout = (workout: Workout) => {
    setEditingWorkout(workout);
    setSelectedDayId(workout.trainingDayId);
    setIsWorkoutModalOpen(true);
  };

  const handleSaveWorkout = async (data: Partial<Workout>) => {
    if (data.id) {
      await updateWorkout(data.id, data);
    } else {
      await createWorkout(data);
    }
    await loadData();
  };

  const handleDeleteWorkout = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este treino?')) {
      await deleteWorkout(id);
      await loadData();
    }
  };

  const handleDuplicateWorkout = async (workoutOrId: Workout | string) => {
    const id = typeof workoutOrId === 'string' ? workoutOrId : workoutOrId.id;
    await duplicateWorkout(id);
    await loadData();
  };

  const handleNewWeek = async () => {
    // Fuso de Brasília: No domingo, a nova semana planejada começa amanhã (+1 dia na segunda-feira)
    const todayStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());
    const [y, m, d] = todayStr.split('-').map(Number);
    const today = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    const dayOfWeek = today.getUTCDay();
    const diffToMonday = dayOfWeek === 0 ? 1 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setUTCDate(today.getUTCDate() + diffToMonday);
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);

    const startDate = monday.toISOString().split('T')[0];
    const endDate = sunday.toISOString().split('T')[0];

    const targetName = selectedAthlete?.name || currentUser?.name || 'Pace Club';

    await createWeek({
      title: `Semana ${startDate} - ${targetName}`,
      startDate,
      endDate,
      plannedVolumeKm: 0,
      athleteId: selectedAthlete?.id || (currentUser?.role === 'ATHLETE' ? currentUser.id : undefined)
    });
    await loadData();
  };

  const handleSelectAthleteForTraining = (athlete: AthleteItem) => {
    setSelectedAthlete(athlete);
    loadData(athlete.id);
  };

  // Se não estiver logado, exibe a Página de Login como tela principal do site
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  if (loading && !week) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center space-y-4">
        <Activity className="w-10 h-10 text-blue-500 animate-pulse" />
        <span className="text-sm font-semibold text-zinc-400">Carregando Pace Training...</span>
      </div>
    );
  }

  const activeAthleteName = selectedAthlete?.name || (currentUser?.role === 'ATHLETE' ? currentUser.name : week?.user?.name || 'Paulo Henrique');
  const activeAthlete = week?.user || selectedAthlete || (currentUser?.role === 'ATHLETE' ? currentUser : null);
  const currentPaceZones = {
    paceLeve: activeAthlete?.paceLeve || selectedAthlete?.paceLeve || '5:10–5:40/km',
    paceModerado: activeAthlete?.paceModerado || selectedAthlete?.paceModerado || '4:40–5:10/km',
    paceControlado: activeAthlete?.paceControlado || selectedAthlete?.paceControlado || '3:50–4:10/km',
    paceTiros: activeAthlete?.paceTiros || selectedAthlete?.paceTiros || '3:00–3:30/km'
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onSelectView={setCurrentView}
        garminStatus={garminStatus}
        onToggleMock={handleToggleMock}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onNewWeek={handleNewWeek}
        onImportPdfClick={() => setIsPdfModalOpen(true)}
        onRefreshStatus={loadData}
        currentUser={currentUser}
        onOpenAdmin={() => setIsAdminPanelOpen(true)}
        onLogout={handleLogout}
        onOpenLogin={() => setIsLoginModalOpen(true)}
      />

      {/* Banner de Contexto do Treinador (Quando o Professor está gerenciando a planilha de um aluno) */}
      {currentUser?.role === 'COACH' && (
        <div className="bg-indigo-950/60 border-b border-indigo-800/50 py-2.5 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-bold uppercase tracking-wider text-[10px]">
                Modo Treinador
              </span>
              <span className="text-zinc-300">
                Você está prescrevendo treinos para:{' '}
                <strong className="text-white font-extrabold text-sm ml-1">{activeAthleteName}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAdminPanelOpen(true)}
                className="py-1 px-2.5 rounded-lg bg-indigo-600/40 hover:bg-indigo-600 text-indigo-200 hover:text-white font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Trocar Aluno</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic View Container */}
      {currentView === 'CALENDAR' ? (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
              {error}
            </div>
          )}

          {/* Dashboard Metrics */}
          <SummaryCards
            week={week}
            metrics={metrics}
            onNewWeek={handleNewWeek}
            isCoach={currentUser?.role === 'COACH'}
          />

          {/* Calendar Section Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Grade Semanal de Treinos</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                  {activeAthleteName}
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                {currentUser?.role === 'COACH'
                  ? 'Como professor, você pode prescrever, duplicar ou editar treinos para este aluno'
                  : 'Sua planilha semanal individualizada. Clique no botão de enviar resultado para anexar comprovante ou foto'}
              </p>
            </div>

            {currentUser?.role === 'COACH' && (
              <button
                onClick={() => handleOpenAddWorkout()}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 hover:bg-blue-600/30 text-blue-400 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Treino</span>
              </button>
            )}
          </div>

          {/* Weekly Calendar Component */}
          {week && (
            <WeeklyCalendar
              trainingDays={week.trainingDays}
              onAddWorkout={handleOpenAddWorkout}
              onEditWorkout={handleOpenEditWorkout}
              onDuplicateWorkout={handleDuplicateWorkout}
              onDeleteWorkout={handleDeleteWorkout}
              onOpenResultWorkout={(w) => {
                setResultWorkout(w);
                setIsResultModalOpen(true);
              }}
              isCoach={currentUser?.role === 'COACH'}
            />
          )}

          {/* Pace References Box */}
          <div className="mt-8 p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <div>
                <span className="font-semibold text-zinc-200">Zonas de Ritmo / Referência Pace Club:</span>
                <span className="ml-1.5 text-[11px] text-zinc-400 font-normal">({activeAthleteName})</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 font-mono text-[11px]">
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Leve: {currentPaceZones.paceLeve}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-teal-500/10 text-teal-400 border border-teal-500/20">
                Moderado: {currentPaceZones.paceModerado}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Controlado: {currentPaceZones.paceControlado}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
                Tiros: {currentPaceZones.paceTiros}
              </span>

              {currentUser?.role === 'COACH' && (
                <button
                  type="button"
                  onClick={() => setIsPaceZonesModalOpen(true)}
                  className="px-2.5 py-1 rounded-md bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Editar Zonas de Ritmo do Aluno"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Editar Zonas</span>
                </button>
              )}
            </div>
          </div>

        </main>
      ) : (
        /* PACE AI View Page */
        <PaceAI week={week} metrics={metrics} />
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-850 bg-zinc-950 py-6 text-center text-xs text-zinc-500">
        <p>PACE CLUB © 2026 — Plataforma de Prescrição & Gestão de Treinamento</p>
      </footer>

      {/* Modals */}
      {week && (
        <WorkoutModal
          isOpen={isWorkoutModalOpen}
          onClose={() => setIsWorkoutModalOpen(false)}
          onSave={handleSaveWorkout}
          trainingDays={week.trainingDays}
          selectedDayId={selectedDayId}
          initialWorkout={editingWorkout}
          paceZones={currentPaceZones}
          athleteName={activeAthleteName}
        />
      )}

      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        week={week}
        garminStatus={garminStatus}
        onSyncComplete={loadData}
      />

      <PdfImportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        onConfirmImport={loadData}
        athleteId={selectedAthlete?.id || (currentUser?.role === 'ATHLETE' ? currentUser.id : undefined)}
        athleteName={activeAthleteName}
      />

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onSuccess={handleLoginSuccess}
      />

      {/* Admin Panel (Professor) */}
      <AdminPanel
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        onSelectAthleteForTraining={handleSelectAthleteForTraining}
        selectedAthleteId={selectedAthlete?.id}
      />

      {/* Workout Result Modal */}
      <WorkoutResultModal
        isOpen={isResultModalOpen}
        onClose={() => setIsResultModalOpen(false)}
        workout={resultWorkout}
        onSuccess={loadData}
      />

      {/* Pace Zones Modal (Professor) */}
      <PaceZonesModal
        isOpen={isPaceZonesModalOpen}
        onClose={() => setIsPaceZonesModalOpen(false)}
        athleteId={activeAthlete?.id || selectedAthlete?.id || ''}
        athleteName={activeAthleteName}
        initialZones={currentPaceZones}
        onSaved={(newZones) => {
          if (week && week.user) {
            setWeek({
              ...week,
              user: { ...week.user, ...newZones }
            });
          }
          if (selectedAthlete) {
            setSelectedAthlete({
              ...selectedAthlete,
              ...newZones
            });
          }
          loadData();
        }}
      />

    </div>
  );
}
