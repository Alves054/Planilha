import React, { useState, useEffect } from 'react';
import {
  X, CheckCircle2, Upload, Camera, Clock, Activity,
  Heart, MessageSquare, AlertCircle, Trash2, Eye, Loader2, Sparkles,
  Flame, Repeat, FileText, Zap
} from 'lucide-react';
import { Workout } from '../../types/workout';
import { submitWorkoutResultApi, resetWorkoutResultApi } from '../../services/api';

interface WorkoutResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  workout: Workout | null;
  onSuccess: () => void;
}

export const WorkoutResultModal: React.FC<WorkoutResultModalProps> = ({
  isOpen,
  onClose,
  workout,
  onSuccess
}) => {
  const [actualDistance, setActualDistance] = useState<string>('');
  const [actualPace, setActualPace] = useState<string>('');
  const [actualDuration, setActualDuration] = useState<string>('');
  const [actualHeartRate, setActualHeartRate] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (workout && isOpen) {
      setActualDistance(workout.actualDistanceKm ? String(workout.actualDistanceKm) : (workout.targetDistanceKm ? String(workout.targetDistanceKm) : ''));
      setActualPace(workout.actualPace || workout.targetPaceMin || '');
      setActualDuration(workout.actualDurationMinutes ? String(workout.actualDurationMinutes) : '');
      setActualHeartRate(workout.actualHeartRate ? String(workout.actualHeartRate) : '');
      setFeedback(workout.feedback || '');
      setImagePreview(workout.proofImageUrl || null);
      setImageFile(null);
      setError(null);
    }
  }, [workout, isOpen]);

  if (!isOpen || !workout) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workout) return;

    try {
      setSaving(true);
      setError(null);

      const formData = new FormData();
      if (actualDistance) formData.append('actualDistanceKm', actualDistance);
      if (actualPace) formData.append('actualPace', actualPace);
      if (actualDuration) formData.append('actualDurationMinutes', actualDuration);
      if (actualHeartRate) formData.append('actualHeartRate', actualHeartRate);
      if (feedback) formData.append('feedback', feedback);
      formData.append('isCompleted', 'true');

      if (imageFile) {
        formData.append('image', imageFile);
      } else if (imagePreview && !imagePreview.startsWith('blob:')) {
        formData.append('proofImageUrl', imagePreview);
      }

      await submitWorkoutResultApi(workout.id, formData);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Erro ao registrar resultado do treino.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!workout) return;
    if (confirm('Deseja realmente desmarcar a conclusão deste treino e limpar os resultados?')) {
      try {
        setResetting(true);
        await resetWorkoutResultApi(workout.id);
        onSuccess();
        onClose();
      } catch (err: any) {
        alert(err.response?.data?.error || 'Erro ao reverter resultado.');
      } finally {
        setResetting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-800/80 bg-gradient-to-r from-zinc-900 via-zinc-900 to-indigo-950/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                Resultado da Execução
                {workout.isCompleted && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Concluído
                  </span>
                )}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                {workout.name} • Planejado: {workout.targetDistanceKm || workout.estimatedDistanceKm || 0} km
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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Card com Detalhes do Treino Prescrito (Tiros, Etapas e Orientações) */}
          <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-200 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                Prescrição: {workout.name}
              </span>
              <div className="flex items-center gap-1.5">
                {workout.repeatCount > 1 && (
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold text-[10px] border border-purple-500/30 flex items-center gap-1">
                    <Repeat className="w-3 h-3" />
                    {workout.repeatCount}× Repetições
                  </span>
                )}
                {(workout.targetPaceMin || workout.targetPaceMax) && (
                  <span className="font-mono text-[11px] text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    Pace: {workout.targetPaceMin}{workout.targetPaceMax ? `–${workout.targetPaceMax}` : ''} /km
                  </span>
                )}
              </div>
            </div>

            {/* Etapas / Tiros se cadastrados */}
            {workout.steps && workout.steps.length > 0 && (
              <div className="pt-2 border-t border-zinc-800/80 space-y-1">
                <span className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider block">
                  Etapas / Tiros ({workout.steps.length}):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 font-mono text-[11px]">
                  {workout.steps.map((st, i) => {
                    const dur = st.durationType === 'DISTANCE'
                      ? (st.durationValue >= 1000 ? `${st.durationValue / 1000} km` : `${st.durationValue}m`)
                      : (st.durationValue >= 60 ? `${Math.floor(st.durationValue / 60)} min` : `${st.durationValue}s`);
                    const typeLabel = st.stepType === 'WARMUP' ? 'Aquec.' : (st.stepType === 'RUN' ? (workout.category === 'TIROS' ? 'Tiro' : 'Corrida') : (st.stepType === 'RECOVERY' ? 'Recup.' : (st.stepType === 'COOL_DOWN' ? 'Soltura' : 'Descanso')));
                    return (
                      <div key={i} className="flex items-center justify-between p-1.5 rounded-lg bg-zinc-950 border border-zinc-850">
                        <span className="text-zinc-300 font-bold">
                          {i + 1}. {typeLabel} {dur}
                        </span>
                        {(st.targetMin || st.targetMax) && (
                          <span className="text-amber-400 font-bold text-[10px]">
                            @{st.targetMin}{st.targetMax ? `–${st.targetMax}` : ''}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Observações / Instruções */}
            {workout.notes && (
              <div className="pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-300 flex items-start gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                <span className="italic leading-relaxed">{workout.notes}</span>
              </div>
            )}
          </div>

          {/* Grid de Métricas Principais */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3 focus-within:border-emerald-500 transition-colors">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                Distância (km) *
              </label>
              <div className="flex items-baseline gap-1">
                <input
                  type="number"
                  step="0.01"
                  required
                  value={actualDistance}
                  onChange={(e) => setActualDistance(e.target.value)}
                  placeholder="12.5"
                  className="w-full bg-transparent text-lg font-black text-white focus:outline-none"
                />
                <span className="text-xs text-zinc-500 font-bold">km</span>
              </div>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3 focus-within:border-emerald-500 transition-colors">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                Pace Médio
              </label>
              <div className="flex items-baseline gap-1">
                <input
                  type="text"
                  value={actualPace}
                  onChange={(e) => setActualPace(e.target.value)}
                  placeholder="4:50"
                  className="w-full bg-transparent text-lg font-black text-white focus:outline-none font-mono"
                />
                <span className="text-xs text-zinc-500 font-bold">/km</span>
              </div>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3 focus-within:border-emerald-500 transition-colors">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                Duração Total
              </label>
              <div className="flex items-baseline gap-1">
                <input
                  type="number"
                  step="1"
                  value={actualDuration}
                  onChange={(e) => setActualDuration(e.target.value)}
                  placeholder="55"
                  className="w-full bg-transparent text-lg font-black text-white focus:outline-none"
                />
                <span className="text-xs text-zinc-500 font-bold">min</span>
              </div>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3 focus-within:border-emerald-500 transition-colors">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                FC Média
              </label>
              <div className="flex items-baseline gap-1">
                <input
                  type="number"
                  step="1"
                  value={actualHeartRate}
                  onChange={(e) => setActualHeartRate(e.target.value)}
                  placeholder="156"
                  className="w-full bg-transparent text-lg font-black text-white focus:outline-none"
                />
                <span className="text-xs text-zinc-500 font-bold">bpm</span>
              </div>
            </div>
          </div>

          {/* Comentários / Feedback da Sensação de Esforço */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
              <span>Feedback & Percepção de Esforço</span>
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Como se sentiu no treino? Ex: 'Ritmo fluiu muito bem nos tiros, hidratação ok, sem dores.'"
              rows={3}
              className="w-full p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 focus:border-indigo-500 text-xs text-white placeholder-zinc-500 outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Anexo de Foto / Print do Relógio / Comprovante */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-emerald-400" />
              <span>Foto do Relógio / Comprovante Strava / Garmin</span>
            </label>

            {imagePreview ? (
              <div className="relative rounded-2xl border border-zinc-700 overflow-hidden bg-black/60 group">
                <img
                  src={imagePreview}
                  alt="Comprovante de Treino"
                  className="w-full h-48 object-contain bg-zinc-950"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <a
                    href={imagePreview}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Ver Ampliado</span>
                  </a>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="p-2.5 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Trocar Foto</span>
                  </button>
                </div>
              </div>
            ) : (
              <label className="border-2 border-dashed border-zinc-800 hover:border-emerald-500/50 bg-zinc-900/40 hover:bg-zinc-900/80 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <div className="p-3 rounded-2xl bg-zinc-800 text-zinc-300">
                  <Upload className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-white">Clique para enviar foto ou print</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">JPG, PNG ou WEBP do relógio ou aplicativo</p>
                </div>
              </label>
            )}
          </div>

          {/* Rodapé com Ações */}
          <div className="pt-2 flex items-center justify-between gap-3 border-t border-zinc-800/80">
            {workout.isCompleted ? (
              <button
                type="button"
                onClick={handleReset}
                disabled={resetting || saving}
                className="px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {resetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Desmarcar Treino</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Salvar Resultado</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
