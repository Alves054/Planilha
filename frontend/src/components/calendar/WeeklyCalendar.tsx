import React from 'react';
import { Plus, Moon, Dumbbell, Sparkles } from 'lucide-react';
import { TrainingDay, Workout } from '../../types/workout';
import { WorkoutCard } from './WorkoutCard';

interface WeeklyCalendarProps {
  trainingDays: TrainingDay[];
  onAddWorkout: (day: TrainingDay) => void;
  onEditWorkout: (workout: Workout) => void;
  onDuplicateWorkout: (workout: Workout) => void;
  onDeleteWorkout: (id: string) => void;
  onOpenResultWorkout?: (workout: Workout) => void;
  isCoach?: boolean;
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
  onDeleteWorkout,
  onOpenResultWorkout,
  isCoach = true
}) => {
  const formatDateDay = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}`;
  };

  // Data atual no horário oficial de Brasília (YYYY-MM-DD)
  const todayBrasilia = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3.5">
      {trainingDays.map((day) => {
        const totalKm = day.workouts.reduce(
          (sum, w) => sum + (w.targetDistanceKm || w.estimatedDistanceKm || 0),
          0
        );
        const formattedKm = Math.round(totalKm * 10) / 10;
        const dayName = dayDisplayNames[day.dayOfWeek] || day.dayOfWeek;
        const isToday = day.date === todayBrasilia;

        return (
          <div
            key={day.id}
            className={`flex flex-col rounded-3xl border transition-all ${
              isToday
                ? 'bg-[#111827]/90 border-blue-500/80 shadow-2xl shadow-blue-500/15 ring-2 ring-blue-500/30'
                : day.isRestDay
                ? 'bg-[#0f172a]/50 border-gray-800/60 opacity-90'
                : 'glass-panel border-gray-800/80 hover:border-gray-700'
            }`}
          >
            {/* Day Header */}
            <div className={`p-4 border-b flex items-center justify-between rounded-t-3xl ${
              isToday 
                ? 'bg-gradient-to-r from-blue-900/40 via-blue-950/50 to-indigo-950/40 border-blue-500/30' 
                : 'bg-gray-900/40 border-gray-800/80'
            }`}>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className={`font-black text-sm uppercase tracking-wide flex items-center gap-1.5 ${
                    isToday ? 'text-white' : 'text-gray-200'
                  }`}>
                    <span>{dayName}</span>
                    {isToday && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-500 text-white font-black tracking-wider shadow-sm">
                        HOJE
                      </span>
                    )}
                  </h3>
                  <span className={`text-[11px] font-mono ${isToday ? 'text-cyan-400 font-bold' : 'text-gray-500'}`}>
                    {formatDateDay(day.date)}
                  </span>
                </div>

                <div className="mt-1 text-xs font-bold text-cyan-400 font-mono">
                  {day.isRestDay ? (
                    <span className="text-gray-500 font-medium">Descanso</span>
                  ) : (
                    <span>{formattedKm} km</span>
                  )}
                </div>
              </div>

              {/* Add Workout Button - Coach only */}
              {isCoach && (
                <button
                  onClick={() => onAddWorkout(day)}
                  title="Adicionar Treino neste dia"
                  className="w-8 h-8 rounded-xl bg-gray-800/80 hover:bg-blue-600 hover:text-white text-gray-400 flex items-center justify-center transition-all shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Day Body: Workout List */}
            <div className="p-3 space-y-3 flex-1 min-h-[170px]">
              {day.workouts.length > 0 ? (
                day.workouts.map((workout) => (
                  <WorkoutCard
                    key={workout.id}
                    workout={workout}
                    onEdit={onEditWorkout}
                    onDuplicate={onDuplicateWorkout}
                    onDelete={onDeleteWorkout}
                    onOpenResult={onOpenResultWorkout}
                    isCoach={isCoach}
                  />
                ))
              ) : day.isRestDay ? (
                <div className="h-full flex flex-col items-center justify-center p-5 text-center border-2 border-dashed border-gray-800/60 rounded-2xl">
                  <Moon className="w-6 h-6 text-gray-600 mb-1.5" />
                  <span className="text-xs font-bold text-gray-400">Descanso</span>
                  <span className="text-[10px] text-gray-500 mt-0.5">Recuperação</span>
                </div>
              ) : (
                <div
                  onClick={() => isCoach && onAddWorkout(day)}
                  className={`h-full flex flex-col items-center justify-center p-5 text-center border border-dashed border-gray-800/80 rounded-2xl text-gray-500 transition-all ${
                    isCoach ? 'hover:border-blue-500/50 hover:bg-blue-500/5 cursor-pointer hover:text-blue-400 group' : 'cursor-default'
                  }`}
                >
                  <Dumbbell className={`w-5 h-5 mb-1.5 text-gray-600 ${isCoach ? 'group-hover:text-blue-400 group-hover:scale-110 transition-transform' : ''}`} />
                  <span className="text-xs font-semibold">Sem treinos</span>
                  {isCoach && <span className="text-[10px] text-cyan-400/80 mt-1 font-bold">+ Adicionar</span>}
                </div>
              )}
            </div>

          </div>
        );
      })}
    </div>
  );
};
