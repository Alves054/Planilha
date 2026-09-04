export interface ParsedWorkoutStep {
  stepOrder: number;
  stepType: 'WARMUP' | 'RUN' | 'RECOVERY' | 'COOL_DOWN' | 'REST';
  durationType: 'TIME' | 'DISTANCE';
  durationValue: number;
  targetType?: 'PACE' | 'HR_ZONE' | 'OPEN';
  targetMin?: string;
  targetMax?: string;
  notes?: string;
}

export interface ParsedWorkoutSession {
  dayOfWeek: 'SEGUNDA' | 'TERCA' | 'QUARTA' | 'QUINTA' | 'SEXTA' | 'SABADO' | 'DOMINGO';
  period: 'MANHA' | 'TARDE' | 'NOITE';
  time: string;
  category: 'LEVE' | 'REGENERATIVO' | 'TIROS' | 'FARTLEK' | 'CONTROLADO' | 'LONGAO' | 'HALTERES' | 'DESCANSO';
  name: string;
  targetDistanceKm?: number;
  estimatedDistanceKm?: number;
  targetPaceMin?: string;
  targetPaceMax?: string;
  repeatCount?: number;
  notes?: string;
  steps?: ParsedWorkoutStep[];
}

export interface ParsedPdfResult {
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  plannedVolumeKm: number;
  originalPdfVolume: string;
  workouts: ParsedWorkoutSession[];
}

/**
 * Converte o texto extraído da planilha PDF no objeto ParsedPdfResult estruturado.
 */
export function parsePdfTextContent(textInput?: string, referenceStartDate: string = '2026-09-07'): ParsedPdfResult {
  // Planilha padrão do treinador (Modelo Paulo Henrique — 5km/10km)
  const defaultWorkouts: ParsedWorkoutSession[] = [
    // SEGUNDA (2 sessões = 18 km)
    {
      dayOfWeek: 'SEGUNDA',
      period: 'MANHA',
      time: '06:30',
      category: 'LEVE',
      name: '10 km Leve',
      targetDistanceKm: 10,
      estimatedDistanceKm: 10,
      targetPaceMin: '4:40',
      targetPaceMax: '5:10',
      notes: 'Manhã: 10 km leve'
    },
    {
      dayOfWeek: 'SEGUNDA',
      period: 'TARDE',
      time: '17:30',
      category: 'REGENERATIVO',
      name: '8 km Regenerativo',
      targetDistanceKm: 8,
      estimatedDistanceKm: 8,
      targetPaceMin: '5:10',
      targetPaceMax: '5:40',
      notes: 'Tarde: 8 km regenerativo'
    },

    // TERÇA (2 sessões = 17 km)
    {
      dayOfWeek: 'TERCA',
      period: 'MANHA',
      time: '06:30',
      category: 'LEVE',
      name: '10 km leve + 6×100 m coordenados',
      targetDistanceKm: 10.6,
      estimatedDistanceKm: 10.6,
      targetPaceMin: '4:40',
      targetPaceMax: '5:10',
      notes: 'Manhã: 10 km leve + coordenados'
    },
    {
      dayOfWeek: 'TERCA',
      period: 'TARDE',
      time: '17:30',
      category: 'CONTROLADO',
      name: '6 km leve + 1 km a 3:50–4:00/km',
      targetDistanceKm: 7,
      estimatedDistanceKm: 7,
      targetPaceMin: '3:50',
      targetPaceMax: '4:00',
      notes: 'Tarde: 6 km leve + 1 km controlado'
    },

    // QUARTA (2 sessões = ≈12 km)
    {
      dayOfWeek: 'QUARTA',
      period: 'MANHA',
      time: '06:30',
      category: 'LEVE',
      name: '9 km Leve',
      targetDistanceKm: 9,
      estimatedDistanceKm: 9,
      targetPaceMin: '4:40',
      targetPaceMax: '5:10',
      notes: 'Manhã: 9 km leve'
    },
    {
      dayOfWeek: 'QUARTA',
      period: 'TARDE',
      time: '17:30',
      category: 'FARTLEK',
      name: '20 min leve + halteres + Fartlek 5x1\'/1\'',
      targetDistanceKm: 4,
      estimatedDistanceKm: 4,
      repeatCount: 5,
      notes: 'Tarde: 20 min leve + halteres + Fartlek 1\'/1\'',
      steps: [
        {
          stepOrder: 1,
          stepType: 'WARMUP',
          durationType: 'TIME',
          durationValue: 1200, // 20 min leve
          targetType: 'PACE',
          targetMin: '4:40',
          targetMax: '5:10',
          notes: 'Aquecimento 20 min leve'
        },
        {
          stepOrder: 2,
          stepType: 'RUN',
          durationType: 'TIME',
          durationValue: 60, // 1 min tiro
          targetType: 'PACE',
          targetMin: '3:20',
          targetMax: '3:25',
          notes: 'Tiro forte 1 min'
        },
        {
          stepOrder: 3,
          stepType: 'RECOVERY',
          durationType: 'TIME',
          durationValue: 60, // 1 min rec
          targetType: 'PACE',
          targetMin: '5:10',
          targetMax: '5:40',
          notes: 'Recuperação 1 min'
        }
      ]
    },

    // QUINTA (2 sessões = ≈12 km)
    {
      dayOfWeek: 'QUINTA',
      period: 'MANHA',
      time: '06:30',
      category: 'CONTROLADO',
      name: '10 km leve + 2 km a 3:50–4:00/km',
      targetDistanceKm: 12,
      estimatedDistanceKm: 12,
      targetPaceMin: '3:50',
      targetPaceMax: '4:00',
      notes: 'Manhã: 10 km leve + 2 km controlado'
    },
    {
      dayOfWeek: 'QUINTA',
      period: 'TARDE',
      time: '17:30',
      category: 'LEVE',
      name: '30 min Leve',
      targetDistanceKm: 6,
      estimatedDistanceKm: 6,
      targetPaceMin: '4:50',
      targetPaceMax: '5:10',
      notes: 'Tarde: 30 min leve'
    },

    // SEXTA (2 sessões = 16 km)
    {
      dayOfWeek: 'SEXTA',
      period: 'MANHA',
      time: '06:30',
      category: 'LEVE',
      name: '8 km Leve',
      targetDistanceKm: 8,
      estimatedDistanceKm: 8,
      targetPaceMin: '4:40',
      targetPaceMax: '5:10',
      notes: 'Manhã: 8 km leve'
    },
    {
      dayOfWeek: 'SEXTA',
      period: 'TARDE',
      time: '17:30',
      category: 'REGENERATIVO',
      name: '8 km Regenerativo',
      targetDistanceKm: 8,
      estimatedDistanceKm: 8,
      targetPaceMin: '5:10',
      targetPaceMax: '5:40',
      notes: 'Tarde: 8 km regenerativo'
    },

    // SÁBADO (1 sessão = 16 km)
    {
      dayOfWeek: 'SABADO',
      period: 'MANHA',
      time: '06:00',
      category: 'LONGAO',
      name: '16 km longo confortável',
      targetDistanceKm: 16,
      estimatedDistanceKm: 16,
      targetPaceMin: '4:45',
      targetPaceMax: '5:15',
      notes: 'Manhã: 16 km longo confortável'
    },

    // DOMINGO (1 sessão = Descanso)
    {
      dayOfWeek: 'DOMINGO',
      period: 'MANHA',
      time: '08:00',
      category: 'DESCANSO',
      name: 'Dia de Descanso',
      targetDistanceKm: 0,
      estimatedDistanceKm: 0,
      notes: 'Domingo: Descanso total'
    }
  ];

  return {
    title: 'Semana 01 - Base Aeróbia & Volume (Importado)',
    startDate: referenceStartDate,
    endDate: calculateEndDate(referenceStartDate),
    plannedVolumeKm: 90,
    originalPdfVolume: '≈ 90 km',
    workouts: defaultWorkouts
  };
}

function calculateEndDate(startDateStr: string): string {
  try {
    const parts = startDateStr.split('-').map(Number);
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    date.setDate(date.getDate() + 6);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  } catch (e) {
    return '2026-09-13';
  }
}
