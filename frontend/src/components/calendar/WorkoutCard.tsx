import React, { useState } from 'react';
import {
  Clock, Zap, Repeat, Copy, Trash2, Edit2, CheckCircle2,
  AlertCircle, Camera, Check, Flame, FileText, ChevronDown,
  ChevronUp, RotateCcw, Wind, Pause, Info
} from 'lucide-react';
import { Workout, WorkoutCategory, WorkoutStep } from '../../types/workout';

interface WorkoutCardProps {
  workout: Workout;
  onEdit: (workout: Workout) => void;
  onDuplicate: (workout: Workout) => void;
  onDelete: (id: string) => void;
  onOpenResult?: (workout: Workout) => void;
  isCoach?: boolean;
}

const categoryStyles: Record<WorkoutCategory, { bg: string; text: string; border: string }> = {
  LEVE: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  REGENERATIVO: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/20' },
  TIROS: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
  FARTLEK: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  CONTROLADO: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  LONGAO: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  HALTERES: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  ACADEMIA: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20' },
  DESCANSO: { bg: 'bg-zinc-800', text: 'text-zinc-400', border: 'border-zinc-700' }
};

const formatStepDuration = (step: WorkoutStep): string => {
  if (step.durationType === 'DISTANCE') {
    const meters = step.durationValue || 0;
    if (meters >= 1000) {
      return meters % 1000 === 0 ? `${meters / 1000} km` : `${(meters / 1000).toFixed(1)} km`;
    }
    return `${meters}m`;
  }
  const seconds = step.durationValue || 0;
  if (seconds >= 60) {
    const mins = Math.floor(seconds / 60);
    const rem = seconds % 60;
    return rem > 0 ? `${mins}m ${rem}s` : `${mins} min`;
  }
  return `${seconds}s`;
};

const getStepStyle = (type: string): string => {
  switch (type) {
    case 'WARMUP':
      return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    case 'RUN':
      return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    case 'RECOVERY':
      return 'bg-teal-500/15 text-teal-300 border-teal-500/30';
    case 'COOL_DOWN':
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    case 'REST':
      return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    default:
      return 'bg-zinc-800 text-zinc-300 border-zinc-700';
  }
};

const getStepLabel = (type: string, category: string): string => {
  switch (type) {
    case 'WARMUP':
      return 'Aquec.';
    case 'RUN':
      return category === 'TIROS' ? 'Tiro' : 'Corrida';
    case 'RECOVERY':
      return 'Recup.';
    case 'COOL_DOWN':
      return 'Soltura';
    case 'REST':
      return 'Descanso';
    default:
      return type;
  }
};

export const WorkoutCard: React.FC<WorkoutCardProps> = ({
  workout,
  onEdit,
  onDuplicate,
  onDelete,
  onOpenResult,
  isCoach = true
}) => {
  const [showAllSteps, setShowAllSteps] = useState(false);
  const catStyle = categoryStyles[workout.category] || categoryStyles.LEVE;
  const distance = workout.targetDistanceKm || workout.estimatedDistanceKm;
  const isCompleted = workout.isCompleted || Boolean(workout.actualDistanceKm);
  const hasSteps = Array.isArray(workout.steps) && workout.steps.length > 0;
  const displayedSteps = hasSteps ? (showAllSteps ? workout.steps : workout.steps.slice(0, 4)) : [];

  return (
    <div className={`group relative p-3.5 rounded-xl border transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5 ${
      isCompleted
        ? 'bg-zinc-900/95 border-emerald-500/40 hover:border-emerald-500/70'
        : 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700'
    }`}>
      
      {/* Header: Period/Time & Category Badge */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
          <Clock className="w-3.5 h-3.5 text-zinc-500" />
          <span>{workout.time || (workout.period === 'MANHA' ? 'Manhã' : workout.period === 'TARDE' ? 'Tarde' : 'Noite')}</span>
        </div>

        <div className="flex items-center gap-1">
          {isCompleted && (
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-0.5">
              <Check className="w-2.5 h-2.5" />
              FEITO
            </span>
          )}
          <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-md border uppercase ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
            {workout.category}
          </span>
        </div>
      </div>

      {/* Title & Distance */}
      <div className="mb-2">
        <h4 className="text-sm font-semibold text-zinc-100 line-clamp-2 leading-snug group-hover:text-blue-300 transition-colors">
          {workout.name}
        </h4>

        {distance !== null && distance !== undefined && distance > 0 && (
          <div className="mt-1 flex items-baseline gap-1 text-blue-400 font-bold text-base tracking-tight">
            <span>{distance}</span>
            <span className="text-xs font-medium text-zinc-400">km planejado</span>
          </div>
        )}
      </div>

      {/* Pace Range or HR */}
      {(workout.targetPaceMin || workout.targetPaceMax) && !isCompleted && (
        <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono mb-2">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>
            {workout.targetPaceMin}
            {workout.targetPaceMax ? `–${workout.targetPaceMax}` : ''} /km
          </span>
        </div>
      )}

      {/* Realizado Resultado Box se preenchido */}
      {isCompleted && (
        <div className="mb-2.5 p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-xs">
          <div className="flex items-center justify-between font-bold text-emerald-300">
            <span>Realizado: {workout.actualDistanceKm ? `${workout.actualDistanceKm} km` : 'Sim'}</span>
            {workout.actualPace && <span className="font-mono text-[11px]">@{workout.actualPace}</span>}
          </div>
          {workout.proofImageUrl && (
            <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium mt-1">
              <Camera className="w-3 h-3" />
              <span>Comprovante anexado</span>
            </div>
          )}
        </div>
      )}

      {/* ESTRUTURA COMPLETA DE TIROS E ETAPAS (SE TIVER PASSOS CADASTRADOS) */}
      {hasSteps && (
        <div className={`mb-2.5 p-2.5 rounded-lg border text-xs ${
          workout.repeatCount > 1
            ? 'bg-purple-950/20 border-purple-500/30'
            : 'bg-zinc-950/80 border-zinc-800'
        }`}>
          {/* Header das etapas / Tiros */}
          <div className="flex items-center justify-between text-[11px] font-bold mb-1.5 pb-1 border-b border-zinc-800/80">
            <span className="flex items-center gap-1 text-zinc-200">
              {workout.category === 'TIROS' ? (
                <Flame className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <Zap className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>Estrutura do Treino:</span>
            </span>

            {workout.repeatCount > 1 ? (
              <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold text-[10px] flex items-center gap-0.5">
                <Repeat className="w-2.5 h-2.5" />
                {workout.repeatCount}× Repetições
              </span>
            ) : (
              <span className="text-[10px] text-zinc-500 font-mono">
                {workout.steps.length} {workout.steps.length === 1 ? 'etapa' : 'etapas'}
              </span>
            )}
          </div>

          {/* Lista das Etapas */}
          <div className="space-y-1.5">
            {displayedSteps.map((step, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-[11px] font-mono py-0.5 px-1 rounded bg-zinc-900/60"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`px-1.5 py-0.2 rounded border text-[9px] uppercase font-bold tracking-tight ${getStepStyle(step.stepType)}`}>
                    {getStepLabel(step.stepType, workout.category)}
                  </span>
                  <span className="text-zinc-200 font-bold truncate">
                    {formatStepDuration(step)}
                  </span>
                </div>

                {(step.targetMin || step.targetMax) ? (
                  <span className="text-amber-400 text-[10px] font-bold shrink-0 ml-1">
                    @{step.targetMin}{step.targetMax ? `–${step.targetMax}` : ''}
                  </span>
                ) : step.notes ? (
                  <span className="text-zinc-400 text-[10px] truncate max-w-[90px]">{step.notes}</span>
                ) : null}
              </div>
            ))}
          </div>

          {/* Botão Ver Mais se houver mais de 4 etapas */}
          {workout.steps.length > 4 && (
            <button
              type="button"
              onClick={() => setShowAllSteps(!showAllSteps)}
              className="mt-1.5 w-full text-center text-[10px] font-semibold text-blue-400 hover:text-blue-300 py-0.5 transition-colors flex items-center justify-center gap-1"
            >
              <span>{showAllSteps ? 'Recolher etapas' : `+ Ver mais ${workout.steps.length - 4} etapas`}</span>
              {showAllSteps ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>
      )}

      {/* CASO TIROS SEM PASSOS INDIVIDUAIS CADASTRADOS, MOSTRAR O BADGE DE TIROS E REPETIÇÃO */}
      {!hasSteps && workout.repeatCount > 1 && (
        <div className="flex items-center gap-1 text-[11px] text-purple-400 font-medium mb-2 bg-purple-500/10 px-2 py-1 rounded-lg border border-purple-500/20 w-fit">
          <Repeat className="w-3.5 h-3.5" />
          <span>{workout.repeatCount}× Repetições</span>
          {workout.category === 'TIROS' && <span className="font-bold text-rose-400 ml-1">• Tiros</span>}
        </div>
      )}

      {/* INSTRUÇÕES E OBSERVAÇÕES DO PROFESSOR (SE HOUVER) */}
      {workout.notes && (
        <div className="mb-2.5 p-2 rounded-lg bg-blue-950/20 border border-blue-500/20 text-xs">
          <div className="flex items-start gap-1.5 text-zinc-300">
            <FileText className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
            <p className="text-[11px] leading-relaxed text-zinc-300 whitespace-pre-line">
              {workout.notes}
            </p>
          </div>
        </div>
      )}

      {/* Footer: Sync Status & Quick Actions */}
      <div className="flex items-center justify-between pt-2 mt-2 border-t border-zinc-800/80 text-xs">
        
        {/* Status Indicator */}
        <div className="flex items-center gap-1 text-[10px]">
          {workout.syncStatus === 'SINCRONIZADO' ? (
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <CheckCircle2 className="w-3 h-3" /> Sincronizado
            </span>
          ) : workout.syncStatus === 'PRONTO_PARA_SINCRONIZAR' ? (
            <span className="flex items-center gap-1 text-blue-400 font-medium">
              <CheckCircle2 className="w-3 h-3 text-blue-400" /> Pronto
            </span>
          ) : (
            <span className="flex items-center gap-1 text-zinc-500">
              <AlertCircle className="w-3 h-3" /> Rascunho
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
          {onOpenResult && (
            <button
              onClick={() => onOpenResult(workout)}
              title={isCompleted ? "Ver/Editar Resultado" : "Registrar Resultado / Enviar Foto"}
              className={`py-1 px-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                isCompleted
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                  : 'bg-zinc-800 hover:bg-emerald-600 hover:text-white text-zinc-300 border border-zinc-700'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{isCompleted ? 'Resultado' : 'Enviar Treino'}</span>
            </button>
          )}

          {isCoach && (
            <>
              <button
                onClick={() => onDuplicate(workout)}
                title="Duplicar Treino"
                className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onEdit(workout)}
                title="Editar Treino"
                className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-blue-400 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDelete(workout.id)}
                title="Excluir Treino"
                className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-rose-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>

      </div>

    </div>
  );
};

