export interface WorkoutStepInput {
  stepOrder: number;
  stepType: string; // WARMUP, RUN, RECOVERY, COOL_DOWN, REST
  durationType: string; // TIME, DISTANCE
  durationValue: number; // segundos ou metros
  targetType?: string; // PACE, HR_ZONE, OPEN
  targetMin?: string; // ex: "3:20"
  targetMax?: string; // ex: "3:25"
  notes?: string;
}

export interface WorkoutInput {
  id?: string;
  trainingDayId: string;
  time?: string;
  period?: 'MANHA' | 'TARDE' | 'NOITE';
  sport?: string;
  category?: string;
  name: string;
  targetDistanceKm?: number | null;
  targetPaceMin?: string | null;
  targetPaceMax?: string | null;
  targetHeartRateZone?: string | null;
  repeatCount?: number;
  notes?: string | null;
  steps?: WorkoutStepInput[];
}

/**
 * Converte pace formatado "MM:SS" em segundos por km (ex: "4:30" => 270)
 */
export function parsePaceToSeconds(paceStr?: string | null): number | null {
  if (!paceStr) return null;
  const cleaned = paceStr.trim();
  const parts = cleaned.split(':');
  if (parts.length !== 2) return null;
  const min = parseInt(parts[0], 10);
  const sec = parseInt(parts[1], 10);
  if (isNaN(min) || isNaN(sec)) return null;
  return min * 60 + sec;
}

/**
 * Converte segundos por km em formato string "MM:SS" (ex: 270 => "4:30")
 */
export function formatSecondsToPace(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

/**
 * Estima a distância de uma etapa individual em km.
 */
export function estimateStepDistanceKm(step: WorkoutStepInput): number {
  if (step.durationType === 'DISTANCE') {
    // Se a duração for em metros, converter para km
    return step.durationValue / 1000;
  }

  if (step.durationType === 'TIME' && (step.targetMin || step.targetMax)) {
    // Se for em tempo (segundos) e houver pace definido
    const minPaceSec = parsePaceToSeconds(step.targetMin);
    const maxPaceSec = parsePaceToSeconds(step.targetMax);
    let avgPaceSec = 300; // Padrão 5:00/km se não puder calcular

    if (minPaceSec && maxPaceSec) {
      avgPaceSec = (minPaceSec + maxPaceSec) / 2;
    } else if (minPaceSec) {
      avgPaceSec = minPaceSec;
    } else if (maxPaceSec) {
      avgPaceSec = maxPaceSec;
    }

    if (avgPaceSec <= 0) return 0;
    // distância (km) = tempo (segundos) / pace (segundos por km)
    return step.durationValue / avgPaceSec;
  }

  return 0;
}

/**
 * Estima a distância total de um treino (considerando repetições e etapas).
 */
export function calculateWorkoutEstimatedDistance(workout: WorkoutInput): number {
  // Se o treino tem uma distância explícita definida (ex: 10 km leve), usar essa distância
  if (workout.targetDistanceKm && workout.targetDistanceKm > 0) {
    return workout.targetDistanceKm;
  }

  // Se houver etapas estruturadas
  if (workout.steps && workout.steps.length > 0) {
    const stepsDistance = workout.steps.reduce((acc, step) => acc + estimateStepDistanceKm(step), 0);
    const totalDistance = stepsDistance * (workout.repeatCount || 1);
    return Math.round(totalDistance * 100) / 100;
  }

  return 0;
}

/**
 * Calcula os volumes de uma semana inteira agrupados por dia e por período.
 */
export function calculateWeekMetrics(weekWithDays: any) {
  let totalCalculatedKm = 0;
  let totalWorkoutsCount = 0;
  let totalRestDays = 0;
  let synchronizedCount = 0;
  let pendingCount = 0;

  const daySummaries: Record<string, { date: string; dayOfWeek: string; volumeKm: number; count: number; isRestDay: boolean }> = {};

  if (weekWithDays && weekWithDays.trainingDays) {
    for (const day of weekWithDays.trainingDays) {
      let dayVolume = 0;
      let dayWorkoutsCount = 0;

      if (day.isRestDay || (day.workouts && day.workouts.length === 0)) {
        if (day.isRestDay) totalRestDays++;
      }

      if (day.workouts) {
        for (const workout of day.workouts) {
          totalWorkoutsCount++;
          const dist = workout.targetDistanceKm || workout.estimatedDistanceKm || 0;
          dayVolume += dist;

          if (workout.syncStatus === 'SINCRONIZADO' || workout.syncStatus === 'ENVIADO_GARMIN') {
            synchronizedCount++;
          } else {
            pendingCount++;
          }
        }
      }

      dayVolume = Math.round(dayVolume * 100) / 100;
      totalCalculatedKm += dayVolume;
      dayWorkoutsCount = day.workouts ? day.workouts.length : 0;

      daySummaries[day.dayOfWeek] = {
        date: day.date,
        dayOfWeek: day.dayOfWeek,
        volumeKm: dayVolume,
        count: dayWorkoutsCount,
        isRestDay: day.isRestDay
      };
    }
  }

  return {
    totalCalculatedKm: Math.round(totalCalculatedKm * 100) / 100,
    plannedVolumeKm: weekWithDays?.plannedVolumeKm || 0,
    originalPdfVolume: weekWithDays?.originalPdfVolume || null,
    totalWorkoutsCount,
    totalRestDays,
    synchronizedCount,
    pendingCount,
    daySummaries
  };
}
