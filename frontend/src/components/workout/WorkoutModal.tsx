import React, { useState, useEffect } from 'react';
import { X, Dumbbell, Calendar, Clock, Zap, Save, HelpCircle } from 'lucide-react';
import { Workout, TrainingDay, WorkoutCategory, WorkoutPeriod, WorkoutStep } from '../../types/workout';
import { StepBuilder } from './StepBuilder';

interface WorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Workout>) => Promise<void>;
  trainingDays: TrainingDay[];
  selectedDayId?: string;
  initialWorkout?: Workout | null;
}

export const WorkoutModal: React.FC<WorkoutModalProps> = ({
  isOpen,
  onClose,
  onSave,
  trainingDays,
  selectedDayId,
  initialWorkout
}) => {
  const [trainingDayId, setTrainingDayId] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<WorkoutCategory>('LEVE');
  const [period, setPeriod] = useState<WorkoutPeriod>('MANHA');
  const [time, setTime] = useState<string>('07:00');
  const [targetDistanceKm, setTargetDistanceKm] = useState<string>('');
  const [targetPaceMin, setTargetPaceMin] = useState<string>('');
  const [targetPaceMax, setTargetPaceMax] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [repeatCount, setRepeatCount] = useState<number>(1);
  const [steps, setSteps] = useState<WorkoutStep[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (initialWorkout) {
      setTrainingDayId(initialWorkout.trainingDayId);
      setName(initialWorkout.name);
      setCategory(initialWorkout.category);
      setPeriod(initialWorkout.period || 'MANHA');
      setTime(initialWorkout.time || '07:00');
      setTargetDistanceKm(initialWorkout.targetDistanceKm ? String(initialWorkout.targetDistanceKm) : '');
      setTargetPaceMin(initialWorkout.targetPaceMin || '');
      setTargetPaceMax(initialWorkout.targetPaceMax || '');
      setNotes(initialWorkout.notes || '');
      setRepeatCount(initialWorkout.repeatCount || 1);
      setSteps(initialWorkout.steps || []);
    } else {
      setTrainingDayId(selectedDayId || (trainingDays[0]?.id || ''));
      setName('');
      setCategory('LEVE');
      setPeriod('MANHA');
      setTime('07:00');
      setTargetDistanceKm('');
      setTargetPaceMin('');
      setTargetPaceMax('');
      setNotes('');
      setRepeatCount(1);
      setSteps([]);
    }
  }, [initialWorkout, selectedDayId, trainingDays, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !trainingDayId) return;

    setIsSubmitting(true);
    try {
      await onSave({
        id: initialWorkout?.id,
        trainingDayId,
        name: name.trim(),
        category,
        period,
        time,
        targetDistanceKm: targetDistanceKm ? parseFloat(targetDistanceKm) : null,
        targetPaceMin: targetPaceMin.trim() || null,
        targetPaceMax: targetPaceMax.trim() || null,
        notes: notes.trim() || null,
        repeatCount,
        steps
      });
      onClose();
    } catch (err) {
      console.error('Erro ao salvar treino:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {initialWorkout ? 'Editar Treino' : 'Adicionar Novo Treino'}
              </h3>
              <p className="text-xs text-zinc-400">
                Preencha os detalhes e estrutura da sessão
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

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Day & Period selection */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Dia da Semana</label>
              <select
                value={trainingDayId}
                onChange={(e) => setTrainingDayId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
              >
                {trainingDays.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.dayOfWeek} ({d.date.split('-').reverse().slice(0, 2).join('/')})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Período</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as WorkoutPeriod)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
              >
                <option value="MANHA">Manhã</option>
                <option value="TARDE">Tarde</option>
                <option value="NOITE">Noite</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Horário (Opcional)</label>
              <input
                type="text"
                placeholder="Ex: 06:30"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-sm text-zinc-100 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Nome do Treino *</label>
              <input
                type="text"
                required
                placeholder="Ex: 10 km leve ou Fartlek 5x1'/1'"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Categoria / Tipo</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as WorkoutCategory)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
              >
                <option value="LEVE">Leve</option>
                <option value="REGENERATIVO">Regenerativo</option>
                <option value="TIROS">Tiros</option>
                <option value="FARTLEK">Fartlek</option>
                <option value="CONTROLADO">Tempo / Controlado</option>
                <option value="LONGAO">Longão</option>
                <option value="HALTERES">Força / Halteres</option>
                <option value="DESCANSO">Descanso</option>
              </select>
            </div>
          </div>

          {/* Distance & Pace Range */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Distância Alvo (km)</label>
              <input
                type="number"
                step="0.1"
                placeholder="Ex: 10.5"
                value={targetDistanceKm}
                onChange={(e) => setTargetDistanceKm(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-sm text-zinc-100 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Pace Mínimo (MM:SS)</label>
              <input
                type="text"
                placeholder="Ex: 4:40"
                value={targetPaceMin}
                onChange={(e) => setTargetPaceMin(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-sm text-zinc-100 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Pace Máximo (MM:SS)</label>
              <input
                type="text"
                placeholder="Ex: 5:10"
                value={targetPaceMax}
                onChange={(e) => setTargetPaceMax(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-sm text-zinc-100 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Step Builder Component */}
          <StepBuilder
            steps={steps}
            repeatCount={repeatCount}
            onStepsChange={setSteps}
            onRepeatCountChange={setRepeatCount}
          />

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Observações do Treinador</label>
            <textarea
              rows={2}
              placeholder="Instruções adicionais..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Salvando...' : 'Salvar Treino'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
