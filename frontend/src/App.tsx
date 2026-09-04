import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { SummaryCards } from './components/dashboard/SummaryCards';
import { WeeklyCalendar } from './components/calendar/WeeklyCalendar';
import { WorkoutModal } from './components/workout/WorkoutModal';
import { SyncModal } from './components/garmin/SyncModal';
import { PdfImportModal } from './components/pdf/PdfImportModal';
import { PaceAI } from './pages/PaceAI';
import { Week, WeekMetrics, Workout, TrainingDay, GarminConnectionStatus } from './types/workout';
import {
  getCurrentWeek,
  createWorkout,
  updateWorkout,
  deleteWorkout,
  duplicateWorkout,
  getGarminStatus,
  toggleGarminMock,
  createWeek
} from './services/api';
import { Activity, Info } from 'lucide-react';

export function App() {
  const [currentView, setCurrentView] = useState<'CALENDAR' | 'PACE_AI'>('CALENDAR');
  const [week, setWeek] = useState<Week | null>(null);
  const [metrics, setMetrics] = useState<WeekMetrics | null>(null);
  const [garminStatus, setGarminStatus] = useState<GarminConnectionStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState<boolean>(false);
  const [selectedDayId, setSelectedDayId] = useState<string | undefined>(undefined);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCurrentWeek();
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
  }, []);

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

  const handleDuplicateWorkout = async (workout: Workout) => {
    await duplicateWorkout(workout.id);
    await loadData();
  };

  const handleNewWeek = async () => {
    const title = prompt('Título da nova semana:', 'Semana Base');
    if (!title) return;
    const startDate = prompt('Data inicial (YYYY-MM-DD):', '2026-09-14');
    if (!startDate) return;
    const endDate = prompt('Data final (YYYY-MM-DD):', '2026-09-20');
    if (!endDate) return;

    await createWeek({
      title,
      startDate,
      endDate,
      plannedVolumeKm: 90
    });
    await loadData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center space-y-4">
        <Activity className="w-10 h-10 text-blue-500 animate-pulse" />
        <span className="text-sm font-semibold text-zinc-400">Carregando Pace Training...</span>
      </div>
    );
  }

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
      />

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
          />

          {/* Calendar Section Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Grade Semanal de Treinos</h2>
              <p className="text-xs text-zinc-400">Clique em qualquer treino para editar ou no botão + para adicionar</p>
            </div>

            <button
              onClick={() => handleOpenAddWorkout()}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 hover:bg-blue-600/30 text-blue-400 text-xs font-semibold transition-colors"
            >
              + Adicionar Treino
            </button>
          </div>

          {/* Weekly Calendar Component */}
          {week && (
            <WeeklyCalendar
              trainingDays={week.trainingDays}
              onAddWorkout={handleOpenAddWorkout}
              onEditWorkout={handleOpenEditWorkout}
              onDuplicateWorkout={handleDuplicateWorkout}
              onDeleteWorkout={handleDeleteWorkout}
            />
          )}

          {/* Pace References Box */}
          <div className="mt-8 p-4 rounded-2xl bg-zinc-900/60 border border-zinc-850 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <span className="font-semibold text-zinc-200">Zonas de Pace de Referência:</span>
            </div>
            <div className="flex flex-wrap gap-4 font-mono text-[11px]">
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Leve: 4:40–5:10/km
              </span>
              <span className="px-2.5 py-1 rounded-md bg-teal-500/10 text-teal-400 border border-teal-500/20">
                Regenerativo: 5:10–5:40/km
              </span>
              <span className="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Longo: 4:45–5:15/km
              </span>
              <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Controlado: 3:50–4:00/km
              </span>
            </div>
          </div>

        </main>
      ) : (
        /* PACE AI View Page */
        <PaceAI week={week} metrics={metrics} />
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-850 bg-zinc-950 py-6 text-center text-xs text-zinc-500">
        <p>PACE TRAINING © 2026 — Plataforma de Gerenciamento & Assistente Pace AI</p>
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
      />

    </div>
  );
}
