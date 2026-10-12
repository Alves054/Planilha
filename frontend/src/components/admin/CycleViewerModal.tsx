import React, { useState, useEffect } from 'react';
import {
  X, Flame, Calendar, Dumbbell, Gauge, Target, Sparkles,
  ChevronRight, Trash2, Loader2, CheckCircle2, ArrowRight,
  Activity, Layers, HeartPulse, Clock, AlertTriangle
} from 'lucide-react';
import { AthleteItem, TrainingCycleItem, CycleWeek, CycleWorkout } from '../../types/workout';
import { removeCycleFromAthleteApi, getAthleteCycleWorkoutsApi } from '../../services/api';

interface CycleViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  cycle?: TrainingCycleItem | null;
  athlete?: {
    id: string;
    name: string;
    email?: string;
    [key: string]: any;
  } | null;
  onCycleRemoved?: (message: string) => void;
  onOpenApply?: (cycleId?: string, athleteId?: string) => void;
}

export const CycleViewerModal: React.FC<CycleViewerModalProps> = ({
  isOpen,
  onClose,
  cycle,
  athlete,
  onCycleRemoved,
  onOpenApply
}) => {
  const [selectedWeekTab, setSelectedWeekTab] = useState<number>(0); // 0 = Todas, 1..N = Semana X
  const [weeksList, setWeeksList] = useState<CycleWeek[]>([]);
  const [removing, setRemoving] = useState(false);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [athleteWeeks, setAthleteWeeks] = useState<any[]>([]);
  const [loadingAthleteWeeks, setLoadingAthleteWeeks] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setConfirmRemoveOpen(false);
      setRemoveError(null);
      setSelectedWeekTab(0);
      return;
    }

    // 1. Se foi passado um ciclo, extrai as semanas do JSON
    if (cycle?.weeksData) {
      try {
        const parsed = typeof cycle.weeksData === 'string' ? JSON.parse(cycle.weeksData) : cycle.weeksData;
        if (Array.isArray(parsed)) {
          setWeeksList(parsed);
        }
      } catch (e) {
        setWeeksList([]);
      }
    }

    // 2. Se foi passado um atleta, busca também as semanas reais do banco para conferir
    if (athlete?.id) {
      setLoadingAthleteWeeks(true);
      getAthleteCycleWorkoutsApi(athlete.id)
        .then(data => {
          if (data?.weeks) {
            setAthleteWeeks(data.weeks);
            // Se não tinha cycle, mas o atleta tem semanas no banco, reconstrói a visualização a partir do banco
            if (!cycle && data.weeks.length > 0) {
              const reconstructed: CycleWeek[] = data.weeks.map((w: any, wIdx: number) => ({
                weekNumber: wIdx + 1,
                title: w.title || `Semana ${wIdx + 1}`,
                days: w.trainingDays.map((td: any, dIdx: number) => ({
                  dayOffset: dIdx,
                  dayOfWeek: td.dayOfWeek,
                  workouts: td.workouts.map((wo: any) => ({
                    name: wo.name,
                    category: wo.category,
                    sport: wo.sport || 'RUNNING',
                    time: wo.time,
                    period: wo.period,
                    targetDistanceKm: wo.targetDistanceKm,
                    targetPaceMin: wo.targetPaceMin,
                    targetPaceMax: wo.targetPaceMax,
                    repeatCount: wo.repeatCount,
                    notes: wo.notes
                  }))
                }))
              }));
              setWeeksList(reconstructed);
            }
          }
        })
        .catch(err => console.error('Erro ao buscar semanas do atleta:', err))
        .finally(() => setLoadingAthleteWeeks(false));
    }
  }, [isOpen, cycle, athlete]);

  if (!isOpen) return null;

  // Cálculos de resumo
  const totalWeeks = weeksList.length;
  const totalWorkouts = weeksList.reduce((acc, w) => {
    return acc + (w.days?.reduce((dAcc, d) => dAcc + (d.workouts?.length || 0), 0) || 0);
  }, 0);

  const totalKm = weeksList.reduce((acc, w) => {
    return acc + (w.days?.reduce((dAcc, d) => {
      return dAcc + (d.workouts?.reduce((wAcc, wo) => wAcc + (wo.targetDistanceKm || 0), 0) || 0);
    }, 0) || 0);
  }, 0);

  const displayedWeeks = selectedWeekTab === 0
    ? weeksList
    : weeksList.filter(w => w.weekNumber === selectedWeekTab);

  // Manipulação de exclusão de ciclo do aluno
  const handleConfirmRemove = async () => {
    if (!athlete?.id) return;
    try {
      setRemoving(true);
      setRemoveError(null);
      const res = await removeCycleFromAthleteApi(athlete.id, cycle?.name, cycle?.id);
      setConfirmRemoveOpen(false);
      if (onCycleRemoved) {
        onCycleRemoved(res.message || 'Ciclo de treino removido da planilha do aluno com sucesso!');
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      setRemoveError(err.response?.data?.error || 'Erro ao remover ciclo do aluno.');
    } finally {
      setRemoving(false);
    }
  };

  const getCategoryColor = (cat?: string) => {
    switch (cat) {
      case 'TIROS': return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'FARTLEK': return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'CONTROLADO': return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
      case 'REGENERATIVO': return 'bg-teal-500/15 text-teal-300 border-teal-500/30';
      case 'LONGAO': return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      case 'DESCANSO': return 'bg-zinc-800 text-zinc-400 border-zinc-700';
      default: return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-2.5 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl text-zinc-100 overflow-hidden">

        {/* Top Header */}
        <div className="p-4 sm:p-6 border-b border-zinc-800/80 bg-gradient-to-r from-zinc-900 via-zinc-900 to-amber-950/30 flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-red-500 p-0.5 shadow-lg shadow-orange-500/20 shrink-0">
              <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center">
                <Flame className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  {cycle?.name || (athlete ? `Plano de Treino — ${athlete.name}` : 'Ciclo de Treino')}
                </h2>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wide">
                  {totalWeeks} Semanas
                </span>
                {athlete && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Aluno: {athlete.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
                {cycle?.description || 'Planejamento semanal completo com distâncias, ritmos, tiros e dias de descanso.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Métricas Rápidas */}
        <div className="px-4 sm:px-6 py-2.5 bg-zinc-900/50 border-b border-zinc-800/60 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex flex-wrap items-center gap-3 sm:gap-6 font-mono text-[11px]">
            <div className="flex items-center gap-1.5 text-zinc-300">
              <Gauge className="w-3.5 h-3.5 text-emerald-400" />
              <span>Volume Total:</span>
              <strong className="text-emerald-400 font-bold">~{Math.round(totalKm)} km</strong>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-300">
              <Dumbbell className="w-3.5 h-3.5 text-indigo-400" />
              <span>Sessões:</span>
              <strong className="text-indigo-400 font-bold">{totalWorkouts} treinos</strong>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-300">
              <Target className="w-3.5 h-3.5 text-amber-400" />
              <span>Meta:</span>
              <strong className="text-amber-400 font-bold">{cycle?.targetPace || '4:24/km (5 km em 22:00)'}</strong>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {athlete && (
              <button
                onClick={() => setConfirmRemoveOpen(true)}
                className="py-1 px-2.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3 h-3 text-rose-400" />
                <span>Remover Ciclo do Aluno</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal de Confirmação para Remover Ciclo */}
        {confirmRemoveOpen && (
          <div className="p-4 bg-rose-950/70 border-b border-rose-800/80 animate-fadeIn flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 text-xs text-rose-200">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <p className="font-bold text-white">Confirmar remoção do ciclo de {athlete?.name}?</p>
                <p className="text-[11px] text-rose-300">
                  Todas as semanas deste ciclo aplicadas na planilha deste aluno serão excluídas.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                onClick={() => setConfirmRemoveOpen(false)}
                disabled={removing}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmRemove}
                disabled={removing}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-rose-600/30 cursor-pointer disabled:opacity-50"
              >
                {removing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{removing ? 'Removendo...' : 'Sim, Remover Ciclo'}</span>
              </button>
            </div>
          </div>
        )}

        {removeError && (
          <div className="p-3 bg-red-950/60 border-b border-red-800 text-red-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{removeError}</span>
          </div>
        )}

        {/* Seletor de Semanas em Pílulas (Scroll Horizontal no celular) */}
        <div className="px-4 sm:px-6 py-2.5 bg-zinc-900/30 border-b border-zinc-800/60 overflow-x-auto scrollbar-none shrink-0 flex items-center gap-1.5">
          <button
            onClick={() => setSelectedWeekTab(0)}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
              selectedWeekTab === 0
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            Todas ({totalWeeks} Semanas)
          </button>

          {weeksList.map(w => (
            <button
              key={w.weekNumber}
              onClick={() => setSelectedWeekTab(w.weekNumber)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedWeekTab === w.weekNumber
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              Semana {w.weekNumber}
            </button>
          ))}
        </div>

        {/* Conteúdo das Semanas (Scroll Vertical Responsivo) */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
          {displayedWeeks.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <Calendar className="w-10 h-10 mx-auto text-zinc-600 mb-2" />
              <p className="text-sm font-semibold">Nenhuma semana encontrada para este ciclo.</p>
            </div>
          ) : (
            displayedWeeks.map(weekItem => {
              const weekKm = weekItem.days?.reduce((dAcc, d) => {
                return dAcc + (d.workouts?.reduce((wAcc, wo) => wAcc + (wo.targetDistanceKm || 0), 0) || 0);
              }, 0) || 0;

              return (
                <div
                  key={weekItem.weekNumber}
                  className="rounded-2xl bg-zinc-900/60 border border-zinc-800/80 overflow-hidden shadow-lg transition-all"
                >
                  {/* Cabeçalho da Semana */}
                  <div className="p-3.5 sm:px-5 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-900/80 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 font-black text-xs flex items-center justify-center">
                        {weekItem.weekNumber}
                      </span>
                      <h3 className="text-sm font-black text-white tracking-tight">
                        {weekItem.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                        ~{Math.round(weekKm * 10) / 10} km
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 border border-zinc-700">
                        {weekItem.days?.reduce((acc, d) => acc + d.workouts.length, 0)} treinos
                      </span>
                    </div>
                  </div>

                  {/* Grid de Dias da Semana (Responsivo 1 a 4 colunas) */}
                  <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {weekItem.days?.map(day => {
                      const dayName = day.dayOfWeek;
                      const hasWorkouts = day.workouts && day.workouts.length > 0;

                      return (
                        <div
                          key={day.dayOffset}
                          className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex flex-col justify-between hover:border-zinc-700 transition-colors"
                        >
                          <div>
                            {/* Topo do Card do Dia */}
                            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-zinc-800/60">
                              <span className="text-[11px] font-black text-zinc-300 uppercase tracking-wider">
                                {dayName}
                              </span>
                              <span className="text-[10px] font-mono text-zinc-500">
                                Dia {day.dayOffset + 1}
                              </span>
                            </div>

                            {/* Treinos do Dia */}
                            {!hasWorkouts ? (
                              <div className="py-4 text-center">
                                <span className="text-[11px] font-semibold text-zinc-500 italic">
                                  Descanso / Livre
                                </span>
                              </div>
                            ) : (
                              <div className="space-y-2.5">
                                {day.workouts.map((wo, woIdx) => (
                                  <div key={woIdx} className="space-y-1.5">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${getCategoryColor(wo.category)}`}>
                                        {wo.category}
                                      </span>
                                      {wo.repeatCount && wo.repeatCount > 1 && (
                                        <span className="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                          {wo.repeatCount}×
                                        </span>
                                      )}
                                      {typeof wo.targetDistanceKm === 'number' && wo.targetDistanceKm > 0 && (
                                        <span className="text-[10px] font-mono font-bold text-emerald-400 ml-auto">
                                          {wo.targetDistanceKm} km
                                        </span>
                                      )}
                                    </div>

                                    <h4 className="text-xs font-bold text-white leading-snug">
                                      {wo.name}
                                    </h4>

                                    {(wo.targetPaceMin || wo.targetPaceMax) && (
                                      <p className="text-[10px] font-mono text-amber-300/90 flex items-center gap-1">
                                        <Clock className="w-2.5 h-2.5 text-amber-400" />
                                        <span>Ritmo: {wo.targetPaceMin || '—'} a {wo.targetPaceMax || '—'}/km</span>
                                      </p>
                                    )}

                                    {wo.notes && (
                                      <p className="text-[10px] text-zinc-400 leading-relaxed bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/60 mt-1">
                                        {wo.notes}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Rodapé de Ações */}
        <div className="p-4 sm:px-6 border-t border-zinc-800/80 bg-zinc-900/60 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-zinc-400">
            <span>Total: <strong>{totalWeeks} semanas</strong> estruturadas • </span>
            <span className="text-emerald-400 font-bold">~{Math.round(totalKm)} km</span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenApply && (
              <button
                onClick={() => {
                  onClose();
                  onOpenApply(cycle?.id, athlete?.id);
                }}
                className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-zinc-950" />
                <span>Aplicar este Ciclo a um Aluno</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="py-2 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
