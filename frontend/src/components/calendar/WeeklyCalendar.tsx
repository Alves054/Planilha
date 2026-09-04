import React from 'react';
import { Plus, Moon, Dumbbell } from 'lucide-react';
import { TrainingDay, Workout } from '../../types/workout';
import { WorkoutCard } from './WorkoutCard';

interface WeeklyCalendarProps {
  trainingDays: TrainingDay[];
  onAddWorkout: (day: TrainingDay) => void;
  onEditWorkout: (workout: Workout) => void;
  onDuplicateWorkout: (workout: Workout) => void;
  onDeleteWorkout: (id: string) => void;
}

const dayDisplayNames: Record<string, string> = {
  SEGUNDA: 'Segunda',
  TERCA: 'Terça',
  QUARTA: 'Quarta',
  QUINTA: 'Quinta',
  SEXTA: 'Sexta',
  SABADO: 'Sábado',
  DOMINGO: 'Domingo'
};

export const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({
  trainingDays,
  onAddWorkout,
  onEditWorkout,
  onDuplicateWorkout,
  onDeleteWorkout
}) => {
  const formatDateDay = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
      {trainingDays.map((day) => {
        const totalKm = day.workouts.reduce(
          (sum, w) => sum + (w.targetDistanceKm || w.estimatedDistanceKm || 0),
          0
        );
        const formattedKm = Math.round(totalKm * 10) / 10;
        const dayName = dayDisplayNames[day.dayOfWeek] || day.dayOfWeek;

        return (
          <div
            key={day.id}
            className={`flex flex-col rounded-2xl border transition-all ${
              day.isRestDay
                ? 'bg-zinc-950/60 border-zinc-850 opacity-90'
                : 'bg-zinc-950 border-zinc-800 hover:border-zinc-750'
            }`}
          >
            {/* Day Header */}
            <div className="p-3.5 border-b border-zinc-850 flex items-center justify-between bg-zinc-900/60 rounded-t-2xl">
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-sm text-zinc-100 uppercase tracking-wide">
                    {dayName}
                  </h3>
                  <span className="text-[11px] font-mono text-zinc-500">
                    {formatDateDay(day.date)}
                  </span>
                </div>

                <div className="mt-0.5 text-xs font-bold text-blue-400 font-mono">
                  {day.isRestDay ? (
                    <span className="text-zinc-500 font-normal">Descanso</span>
                  ) : (
                    <span>{formattedKm} km</span>
                  )}
                </div>
              </div>

              {/* Add Workout Button */}
              <button
                onClick={() => onAddWorkout(day)}
                title="Adicionar Treino neste dia"
                className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-blue-600 hover:text-white text-zinc-400 flex items-center justify-center transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Day Body: Workout List */}
            <div className="p-2.5 space-y-2.5 flex-1 min-h-[160px]">
              {day.workouts.length > 0 ? (
                day.workouts.map((workout) => (
                  <WorkoutCard
                    key={workout.id}
                    workout={workout}
                    onEdit={onEditWorkout}
                    onDuplicate={onDuplicateWorkout}
                    onDelete={onDeleteWorkout}
                  />
                ))
              ) : day.isRestDay ? (
                <div className="h-full flex flex-col items-center justify-center p-4 text-center border-2 border-dashed border-zinc-850 rounded-xl">
                  <Moon className="w-6 h-6 text-zinc-600 mb-1" />
                  <span className="text-xs font-semibold text-zinc-500">Dia de Descanso</span>
                  <span className="text-[10px] text-zinc-600 mt-0.5">Recuperação</span>
                </div>
              ) : (
                <div
                  onClick={() => onAddWorkout(day)}
                  className="h-full flex flex-col items-center justify-center p-4 text-center border border-dashed border-zinc-800 rounded-xl hover:border-zinc-700 cursor-pointer text-zinc-600 hover:text-zinc-400 transition-colors group"
                >
                  <Dumbbell className="w-5 h-5 mb-1 text-zinc-600 group-hover:text-blue-400 transition-colors" />
                  <span className="text-xs font-medium">Nenhum treino</span>
                  <span className="text-[10px] text-zinc-500 mt-0.5">+ Adicionar</span>
                </div>
              )}
            </div>

          </div>
        );
      })}
    </div>
  );
};
