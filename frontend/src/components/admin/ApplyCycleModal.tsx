import React, { useState } from 'react';
import {
  Sparkles, Calendar, User, CheckCircle2, AlertCircle,
  X, Loader2, ArrowRight, Layers, Flame, Target
} from 'lucide-react';
import { AthleteItem, TrainingCycleItem, CycleWeek } from '../../types/workout';
import { applyCycleToAthleteApi } from '../../services/api';
import { getCurrentWeekMonday } from '../../utils/dateUtils';

interface ApplyCycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  cycles: TrainingCycleItem[];
  athletes: AthleteItem[];
  initialCycleId?: string;
  initialAthleteId?: string;
  onSuccess: (message: string) => void;
}

export const ApplyCycleModal: React.FC<ApplyCycleModalProps> = ({
  isOpen,
  onClose,
  cycles,
  athletes,
  initialCycleId,
  initialAthleteId,
  onSuccess
}) => {
  const [selectedCycleId, setSelectedCycleId] = useState<string>(initialCycleId || (cycles[0]?.id || ''));
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>(initialAthleteId || (athletes[0]?.id || ''));
  const [startDate, setStartDate] = useState<string>(getCurrentWeekMonday());
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialCycleId) {
      setSelectedCycleId(initialCycleId);
    } else if (cycles.length > 0 && (!selectedCycleId || !cycles.some(c => c.id === selectedCycleId))) {
      setSelectedCycleId(cycles[0].id);
    }

    if (initialAthleteId) {
      setSelectedAthleteId(initialAthleteId);
    } else if (athletes.length > 0 && (!selectedAthleteId || !athletes.some(a => a.id === selectedAthleteId))) {
      setSelectedAthleteId(athletes[0].id);
    }
  }, [initialCycleId, initialAthleteId, isOpen, cycles, athletes]);

  if (!isOpen) return null;

  const currentCycle = cycles.find(c => c.id === selectedCycleId) || (initialCycleId ? cycles.find(c => c.id === initialCycleId) : null) || cycles[0];
  const currentAthlete = athletes.find(a => a.id === selectedAthleteId) || (initialAthleteId ? athletes.find(a => a.id === initialAthleteId) : null) || athletes[0];

  let weeksList: CycleWeek[] = [];
  try {
    if (currentCycle?.weeksData) {
      weeksList = JSON.parse(currentCycle.weeksData);
    }
  } catch (e) {
    weeksList = [];
  }

  const totalWorkouts = weeksList.reduce((acc, w) => {
    return acc + (w.days?.reduce((dAcc, d) => dAcc + (d.workouts?.length || 0), 0) || 0);
  }, 0);

  const totalKm = weeksList.reduce((acc, w) => {
    return acc + (w.days?.reduce((dAcc, d) => {
      return dAcc + (d.workouts?.reduce((wAcc, wo) => wAcc + (wo.targetDistanceKm || 0), 0) || 0);
    }, 0) || 0);
  }, 0);

  const handleApply = async () => {
    const cycleId = selectedCycleId || currentCycle?.id || initialCycleId || cycles[0]?.id;
    const athleteId = selectedAthleteId || currentAthlete?.id || initialAthleteId || athletes[0]?.id;

    if (!cycleId || !athleteId) {
      setError('Selecione o ciclo e o aluno para continuar.');
      return;
    }

    try {
      setApplying(true);
      setError(null);
      const res = await applyCycleToAthleteApi(cycleId, athleteId, startDate);
      const targetAthleteName = athletes.find(a => a.id === athleteId)?.name || currentAthlete?.name || 'o aluno';
      onSuccess(res.message || `Ciclo aplicado com sucesso para ${targetAthleteName}!`);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Erro ao aplicar ciclo de treino ao aluno.');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl text-zinc-100 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-5 sm:px-6 border-b border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-red-500 p-0.5 shadow-lg shadow-orange-500/20">
              <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                Aplicar Ciclo de Treino
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                  1-Clique
                </span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Injeta automaticamente todas as semanas e treinos estruturados na planilha
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-800/60 text-red-200 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Seleção do Ciclo */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
              1. Escolha o Ciclo / Modelo de Planejamento:
            </label>
            <select
              value={selectedCycleId || currentCycle?.id || ''}
              onChange={(e) => {
                setSelectedCycleId(e.target.value);
                setError(null);
              }}
              className="w-full px-4 py-3 rounded-2xl bg-zinc-900 border border-zinc-700/80 text-white font-bold text-sm focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
            >
              {cycles.map(c => (
                <option key={c.id} value={c.id} className="bg-zinc-900 text-white">
                  {c.name} ({c.durationDays} dias / {c.category})
                </option>
              ))}
            </select>
          </div>

          {/* Preview do Ciclo Selecionado */}
          {currentCycle && (
            <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800/90 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-400 tracking-wide uppercase flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-500" />
                  {currentCycle.name}
                </span>
                <span className="text-[11px] font-bold text-zinc-400 px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700">
                  {currentCycle.durationDays} Dias • {weeksList.length} Semanas
                </span>
              </div>

              {currentCycle.description && (
                <p className="text-xs text-zinc-300 leading-relaxed italic">
                  "{currentCycle.description}"
                </p>
              )}

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800/80">
                <div className="bg-zinc-950/60 p-2 rounded-xl text-center">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase">Treinos</p>
                  <p className="text-sm font-black text-white">{totalWorkouts}</p>
                </div>
                <div className="bg-zinc-950/60 p-2 rounded-xl text-center">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase">Vol. Total</p>
                  <p className="text-sm font-black text-emerald-400">~{Math.round(totalKm)} km</p>
                </div>
                <div className="bg-zinc-950/60 p-2 rounded-xl text-center">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase">Pace Alvo</p>
                  <p className="text-sm font-black text-amber-400">{currentCycle.targetPace || 'Personalizado'}</p>
                </div>
              </div>
            </div>
          )}

          {/* 2. Seleção do Aluno */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
              2. Aluno que receberá a prescrição:
            </label>
            <div className="relative">
              <select
                value={selectedAthleteId || currentAthlete?.id || ''}
                onChange={(e) => {
                  setSelectedAthleteId(e.target.value);
                  setError(null);
                }}
                className="w-full px-4 py-3 pl-10 rounded-2xl bg-zinc-900 border border-zinc-700/80 text-white font-bold text-sm focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
              >
                {athletes.map(a => (
                  <option key={a.id} value={a.id} className="bg-zinc-900 text-white">
                    {a.name} ({a.email})
                  </option>
                ))}
              </select>
              <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 3. Data de Início da 1ª Semana */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
              3. Data de Início da 1ª Semana (Segunda-feira):
            </label>
            <div className="relative">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 pl-10 rounded-2xl bg-zinc-900 border border-zinc-700/80 text-white font-bold text-sm focus:outline-none focus:border-amber-500 transition-colors"
              />
              <Calendar className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <p className="text-[11px] text-zinc-400 mt-1.5">
              Cada semana subsequente do ciclo será agendada automaticamente a cada 7 dias a partir desta data.
            </p>
          </div>
        </div>

        {/* Footer com Botão de Ação */}
        <div className="p-4 sm:px-6 border-t border-zinc-800/80 bg-zinc-950/80 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={applying}
            className="px-4 py-2.5 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-xs font-bold transition-all cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={applying}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-400 hover:to-red-400 text-black font-black text-xs flex items-center gap-2 shadow-lg shadow-orange-500/25 transition-all cursor-pointer disabled:opacity-50"
          >
            {applying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>Aplicando Ciclo...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-black" />
                <span>Injetar Ciclo na Planilha do Aluno</span>
                <ArrowRight className="w-4 h-4 text-black" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
