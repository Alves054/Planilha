import React from 'react';
import { Clock, Zap, Repeat, Copy, Trash2, Edit2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Workout, WorkoutCategory } from '../../types/workout';

interface WorkoutCardProps {
  workout: Workout;
  onEdit: (workout: Workout) => void;
  onDuplicate: (workout: Workout) => void;
  onDelete: (id: string) => void;
}

const categoryStyles: Record<WorkoutCategory, { bg: string; text: string; border: string }> = {
  LEVE: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  REGENERATIVO: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/20' },
  TIROS: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
  FARTLEK: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  CONTROLADO: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  LONGAO: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  HALTERES: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  DESCANSO: { bg: 'bg-zinc-800', text: 'text-zinc-400', border: 'border-zinc-700' }
};

export const WorkoutCard: React.FC<WorkoutCardProps> = ({
  workout,
  onEdit,
  onDuplicate,
  onDelete
}) => {
  const catStyle = categoryStyles[workout.category] || categoryStyles.LEVE;
  const distance = workout.targetDistanceKm || workout.estimatedDistanceKm;

  return (
    <div className="group relative p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5">
      
      {/* Header: Period/Time & Category Badge */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
          <Clock className="w-3.5 h-3.5 text-zinc-500" />
          <span>{workout.time || (workout.period === 'MANHA' ? 'Manhã' : workout.period === 'TARDE' ? 'Tarde' : 'Noite')}</span>
        </div>

        <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-md border uppercase ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
          {workout.category}
        </span>
      </div>

      {/* Title & Distance */}
      <div className="mb-2">
        <h4 className="text-sm font-semibold text-zinc-100 line-clamp-2 leading-snug group-hover:text-blue-300 transition-colors">
          {workout.name}
        </h4>

        {distance !== null && distance !== undefined && distance > 0 && (
          <div className="mt-1 flex items-baseline gap-1 text-blue-400 font-bold text-base tracking-tight">
            <span>{distance}</span>
            <span className="text-xs font-medium text-zinc-400">km</span>
          </div>
        )}
      </div>

      {/* Pace Range or HR */}
      {(workout.targetPaceMin || workout.targetPaceMax) && (
        <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono mb-2">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>
            {workout.targetPaceMin}
            {workout.targetPaceMax ? `–${workout.targetPaceMax}` : ''} /km
          </span>
        </div>
      )}

      {/* Repeat block badge */}
      {workout.repeatCount > 1 && (
        <div className="flex items-center gap-1 text-[11px] text-purple-400 font-medium mb-2 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 w-fit">
          <Repeat className="w-3 h-3" />
          <span>{workout.repeatCount}× Repetições</span>
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
        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
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
        </div>

      </div>

    </div>
  );
};
