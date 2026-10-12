import React, { useState, useEffect } from 'react';
import {
  Sparkles, Calendar, Plus, Trash2, Edit3, CheckCircle2,
  AlertCircle, X, Loader2, Save, Layers, Clock, Zap,
  Flame, ChevronDown, ChevronRight, Activity, ArrowRight
} from 'lucide-react';
import {
  TrainingCycleItem,
  CycleWeek,
  CycleDay,
  CycleWorkout,
  CycleWorkoutStep,
  WorkoutCategory
} from '../../types/workout';
import { createCycleApi, updateCycleApi } from '../../services/api';

interface CycleBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  cycleToEdit?: TrainingCycleItem | null;
  onSuccess: (message: string) => void;
}

const CATEGORIES: { value: WorkoutCategory; label: string; color: string }[] = [
  { value: 'LEVE', label: 'Leve / Rodagem', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { value: 'REGENERATIVO', label: 'Regenerativo', color: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
  { value: 'TIROS', label: 'Tiros / Intervalado', color: 'bg-red-500/20 text-red-300 border-red-500/30' },
  { value: 'FARTLEK', label: 'Fartlek', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { value: 'CONTROLADO', label: 'Ritmo Controlado / Limiar', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  { value: 'LONGAO', label: 'Longão', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  { value: 'DESCANSO', label: 'Descanso / Off', color: 'bg-zinc-700/30 text-zinc-400 border-zinc-700' }
];

const DAY_NAMES = ['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO', 'DOMINGO'];
const DAY_LABELS: Record<string, string> = {
  SEGUNDA: 'Segunda-feira',
  TERCA: 'Terça-feira',
  QUARTA: 'Quarta-feira',
  QUINTA: 'Quinta-feira',
  SEXTA: 'Sexta-feira',
  SABADO: 'Sábado',
  DOMINGO: 'Domingo'
};

function createEmptyWeeks(): CycleWeek[] {
  return [1, 2, 3, 4].map(wNum => ({
    weekNumber: wNum,
    title: `Semana ${wNum}`,
    days: DAY_NAMES.map((dName, dIdx) => ({
      dayOffset: dIdx,
      dayOfWeek: dName,
      workouts: []
    }))
  }));
}

export const CycleBuilderModal: React.FC<CycleBuilderModalProps> = ({
  isOpen,
  onClose,
  cycleToEdit,
  onSuccess
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('5KM');
  const [targetPace, setTargetPace] = useState('3:12/km');
  const [durationDays, setDurationDays] = useState(30);
  const [description, setDescription] = useState('');
  const [weeks, setWeeks] = useState<CycleWeek[]>(createEmptyWeeks());
  const [activeWeekTab, setActiveWeekTab] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado para adicionar treino em um dia específico
  const [addingWorkoutDay, setAddingWorkoutDay] = useState<string | null>(null); // ex: "SEGUNDA"
  const [newWorkoutName, setNewWorkoutName] = useState('');
  const [newWorkoutCat, setNewWorkoutCat] = useState<WorkoutCategory>('LEVE');
  const [newWorkoutDist, setNewWorkoutDist] = useState<string>('8');
  const [newWorkoutPaceMin, setNewWorkoutPaceMin] = useState<string>('4:40');
  const [newWorkoutPaceMax, setNewWorkoutPaceMax] = useState<string>('5:00');
  const [newWorkoutRepeats, setNewWorkoutRepeats] = useState<number>(1);
  const [newWorkoutNotes, setNewWorkoutNotes] = useState<string>('');

  useEffect(() => {
    if (cycleToEdit) {
      setName(cycleToEdit.name);
      setCategory(cycleToEdit.category || '5KM');
      setTargetPace(cycleToEdit.targetPace || '');
      setDurationDays(cycleToEdit.durationDays || 30);
      setDescription(cycleToEdit.description || '');
      try {
        const parsed = JSON.parse(cycleToEdit.weeksData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setWeeks(parsed);
        } else {
          setWeeks(createEmptyWeeks());
        }
      } catch (e) {
        setWeeks(createEmptyWeeks());
      }
    } else {
      setName('Ciclo 5km 16min (30 Dias / 4 Semanas)');
      setCategory('5KM');
      setTargetPace('3:12/km');
      setDurationDays(30);
      setDescription('Periodização focada em velocidade e limiar para bater a marca de 16 minutos nos 5km.');
      setWeeks(createEmptyWeeks());
    }
    setActiveWeekTab(1);
    setAddingWorkoutDay(null);
    setError(null);
  }, [cycleToEdit, isOpen]);

  if (!isOpen) return null;

  const handleAddWorkoutToDay = (dayOfWeek: string) => {
    if (!newWorkoutName.trim()) {
      alert('Digite o nome do treino.');
      return;
    }

    const newWorkout: CycleWorkout = {
      name: newWorkoutName.trim(),
      category: newWorkoutCat,
      sport: 'RUNNING',
      time: '07:00',
      period: 'MANHA',
      targetDistanceKm: parseFloat(newWorkoutDist) || 0,
      targetPaceMin: newWorkoutPaceMin.trim() || undefined,
      targetPaceMax: newWorkoutPaceMax.trim() || undefined,
      repeatCount: newWorkoutRepeats || 1,
      notes: newWorkoutNotes.trim() || undefined,
      steps: newWorkoutCat === 'TIROS' && newWorkoutRepeats > 1 ? [
        { stepType: 'WARMUP', durationType: 'DISTANCE', durationValue: 2000, targetMin: '4:50', targetMax: '5:15', notes: 'Aquecimento' },
        { stepType: 'RUN', durationType: 'DISTANCE', durationValue: 400, targetMin: newWorkoutPaceMin || '3:00', targetMax: newWorkoutPaceMax || '3:10', notes: 'Tiro forte' },
        { stepType: 'RECOVERY', durationType: 'DISTANCE', durationValue: 200, targetMin: '5:30', targetMax: '6:00', notes: 'Recuperação ativa' },
        { stepType: 'COOL_DOWN', durationType: 'DISTANCE', durationValue: 1500, targetMin: '5:10', targetMax: '5:40', notes: 'Soltura' }
      ] : undefined
    };

    setWeeks(prevWeeks => {
      return prevWeeks.map(w => {
        if (w.weekNumber !== activeWeekTab) return w;
        return {
          ...w,
          days: w.days.map(d => {
            if (d.dayOfWeek !== dayOfWeek) return d;
            return {
              ...d,
              workouts: [...d.workouts, newWorkout]
            };
          })
        };
      });
    });

    // Reset formulário do treino
    setAddingWorkoutDay(null);
    setNewWorkoutName('');
    setNewWorkoutDist('8');
    setNewWorkoutNotes('');
    setNewWorkoutRepeats(1);
  };

  const handleRemoveWorkout = (dayOfWeek: string, workoutIdx: number) => {
    setWeeks(prevWeeks => {
      return prevWeeks.map(w => {
        if (w.weekNumber !== activeWeekTab) return w;
        return {
          ...w,
          days: w.days.map(d => {
            if (d.dayOfWeek !== dayOfWeek) return d;
            return {
              ...d,
              workouts: d.workouts.filter((_, idx) => idx !== workoutIdx)
            };
          })
        };
      });
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('O nome do ciclo é obrigatório.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const payload = {
        name: name.trim(),
        category,
        targetPace: targetPace.trim() || undefined,
        durationDays,
        description: description.trim() || undefined,
        weeksData: weeks
      };

      if (cycleToEdit) {
        await updateCycleApi(cycleToEdit.id, payload);
        onSuccess(`Ciclo "${name}" atualizado com sucesso!`);
      } else {
        await createCycleApi(payload);
        onSuccess(`Ciclo "${name}" criado com sucesso na sua biblioteca!`);
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Erro ao salvar ciclo de treino.');
    } finally {
      setSaving(false);
    }
  };

  const currentWeek = weeks.find(w => w.weekNumber === activeWeekTab) || weeks[0];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl animate-fadeIn">
      <div className="relative w-full max-w-5xl h-[92vh] bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl text-zinc-100 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-5 sm:px-8 border-b border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-red-500 p-0.5 shadow-lg shadow-orange-500/20">
              <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                {cycleToEdit ? 'Editar Ciclo de Treino' : 'Criar Novo Ciclo / Planejamento'}
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                  30 Dias • 4 Semanas
                </span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Monte a estrutura de treinos, tiros e volumes para reutilizar com qualquer aluno
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

        {/* Corpo do Editor */}
        <form onSubmit={handleSave} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6">
            
            {error && (
              <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-800/60 text-red-200 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Metadados Básicos do Ciclo */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                  Nome do Ciclo / Programa:
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Ciclo 5km Sub 16min (30 Dias)"
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-white font-bold text-sm focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                  Distância Alvo:
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-white font-bold text-sm focus:outline-none focus:border-amber-500"
                >
                  <option value="5KM">5 km</option>
                  <option value="10KM">10 km</option>
                  <option value="21KM">21 km (Meia)</option>
                  <option value="42KM">42 km (Maratona)</option>
                  <option value="GERAL">Geral / Base</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                  Pace / Objetivo:
                </label>
                <input
                  type="text"
                  value={targetPace}
                  onChange={(e) => setTargetPace(e.target.value)}
                  placeholder="Ex: 3:12/km ou Sub 16"
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-amber-400 font-black text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                  Instruções & Metodologia do Ciclo:
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Foco no limiar anaeróbio, tiros curtos em pista e transição para o ritmo de prova."
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-300 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Abas das 4 Semanas do Ciclo */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Estrutura Semanal do Ciclo:
                  </span>
                </div>
                <div className="text-xs text-zinc-400">
                  {weeks.reduce((acc, w) => acc + w.days.reduce((dAcc, d) => dAcc + d.workouts.length, 0), 0)} treinos adicionados no total
                </div>
              </div>

              <div className="flex p-1.5 bg-zinc-900 border border-zinc-800 rounded-2xl gap-2 overflow-x-auto">
                {weeks.map(w => (
                  <button
                    key={w.weekNumber}
                    type="button"
                    onClick={() => {
                      setActiveWeekTab(w.weekNumber);
                      setAddingWorkoutDay(null);
                    }}
                    className={`flex-1 py-2 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                      activeWeekTab === w.weekNumber
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg shadow-orange-500/20'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                    }`}
                  >
                    <span>Semana {w.weekNumber}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      activeWeekTab === w.weekNumber ? 'bg-black/20 text-black font-black' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {w.days.reduce((acc, d) => acc + d.workouts.length, 0)} treinos
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Grid dos 7 Dias da Semana Ativa */}
            <div className="space-y-3">
              {currentWeek?.days.map(day => (
                <div
                  key={day.dayOfWeek}
                  className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700/80 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                        {DAY_LABELS[day.dayOfWeek]}
                      </span>
                      <span className="text-[11px] text-zinc-400 font-bold">
                        ({day.workouts.length} {day.workouts.length === 1 ? 'treino' : 'treinos'})
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (addingWorkoutDay === day.dayOfWeek) {
                          setAddingWorkoutDay(null);
                        } else {
                          setAddingWorkoutDay(day.dayOfWeek);
                          setNewWorkoutName('');
                          setNewWorkoutDist('8');
                          setNewWorkoutCat('LEVE');
                          setNewWorkoutRepeats(1);
                        }
                      }}
                      className="py-1 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-amber-400" />
                      <span>+ Adicionar Treino</span>
                    </button>
                  </div>

                  {/* Lista de Treinos do Dia */}
                  {day.workouts.length === 0 && addingWorkoutDay !== day.dayOfWeek ? (
                    <p className="text-[11px] text-zinc-400 italic py-1">
                      Descanso / Sem treino programado
                    </p>
                  ) : (
                    <div className="space-y-2 mb-2">
                      {day.workouts.map((wo, wIdx) => {
                        const catStyle = CATEGORIES.find(c => c.value === wo.category) || CATEGORIES[0];
                        return (
                          <div
                            key={wIdx}
                            className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/90 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border uppercase tracking-wider shrink-0 ${catStyle.color}`}>
                                {catStyle.label}
                              </span>
                              <span className="font-extrabold text-white truncate">
                                {wo.name}
                              </span>
                              {wo.targetDistanceKm ? (
                                <span className="text-zinc-400 font-bold shrink-0">
                                  {wo.targetDistanceKm} km
                                </span>
                              ) : null}
                              {wo.targetPaceMin && (
                                <span className="text-amber-400 font-bold shrink-0">
                                  @{wo.targetPaceMin}
                                  {wo.targetPaceMax ? `–${wo.targetPaceMax}` : ''}/km
                                </span>
                              )}
                              {wo.repeatCount && wo.repeatCount > 1 ? (
                                <span className="text-indigo-400 font-bold shrink-0">
                                  {wo.repeatCount}× Tiros
                                </span>
                              ) : null}
                              {wo.notes && (
                                <span className="text-zinc-400 italic truncate text-[11px] hidden md:inline">
                                  • {wo.notes}
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveWorkout(day.dayOfWeek, wIdx)}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                              title="Remover treino"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Formulário Inline de Novo Treino para este Dia */}
                  {addingWorkoutDay === day.dayOfWeek && (
                    <div className="mt-3 p-4 rounded-xl bg-zinc-950 border border-amber-500/40 space-y-3 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                          Novo Treino para {DAY_LABELS[day.dayOfWeek]}:
                        </span>
                        <button
                          type="button"
                          onClick={() => setAddingWorkoutDay(null)}
                          className="text-zinc-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Nome do Treino:</label>
                          <input
                            type="text"
                            value={newWorkoutName}
                            onChange={(e) => setNewWorkoutName(e.target.value)}
                            placeholder="Ex: Tiros 10× 400m na Pista"
                            className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white font-bold text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Categoria:</label>
                          <select
                            value={newWorkoutCat}
                            onChange={(e) => setNewWorkoutCat(e.target.value as WorkoutCategory)}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white font-bold text-xs"
                          >
                            {CATEGORIES.map(c => (
                              <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Distância (km):</label>
                          <input
                            type="number"
                            step="0.1"
                            value={newWorkoutDist}
                            onChange={(e) => setNewWorkoutDist(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white font-bold text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Pace Mín (ex: 3:00):</label>
                          <input
                            type="text"
                            value={newWorkoutPaceMin}
                            onChange={(e) => setNewWorkoutPaceMin(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Pace Máx (ex: 3:10):</label>
                          <input
                            type="text"
                            value={newWorkoutPaceMax}
                            onChange={(e) => setNewWorkoutPaceMax(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Repetições (Tiros):</label>
                          <input
                            type="number"
                            min="1"
                            max="30"
                            value={newWorkoutRepeats}
                            onChange={(e) => setNewWorkoutRepeats(parseInt(e.target.value, 10) || 1)}
                            className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white font-bold text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Notas / Dicas:</label>
                          <input
                            type="text"
                            value={newWorkoutNotes}
                            onChange={(e) => setNewWorkoutNotes(e.target.value)}
                            placeholder="Ex: Recup 200m trote leve"
                            className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-xs"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setAddingWorkoutDay(null)}
                          className="px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-300 text-xs font-bold"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddWorkoutToDay(day.dayOfWeek)}
                          className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-black text-xs shadow-md shadow-amber-500/20"
                        >
                          Confirmar Treino
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              ))}
            </div>

          </div>

          {/* Footer com Salvar */}
          <div className="p-4 sm:px-8 border-t border-zinc-800/80 bg-zinc-950/80 flex items-center justify-between gap-4">
            <div className="text-xs text-zinc-400">
              Total de semanas: <strong className="text-white">4 semanas</strong> • Duração: <strong className="text-amber-400">30 dias</strong>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2.5 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-400 hover:to-red-400 text-black font-black text-xs flex items-center gap-2 shadow-lg shadow-orange-500/25 transition-all cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Salvando Ciclo...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-black" />
                    <span>Salvar Ciclo na Biblioteca</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
