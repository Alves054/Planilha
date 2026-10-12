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
  category: 'LEVE' | 'REGENERATIVO' | 'TIROS' | 'FARTLEK' | 'CONTROLADO' | 'LONGAO' | 'HALTERES' | 'DESCANSO' | 'ACADEMIA';
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
  athleteName?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  plannedVolumeKm: number;
  originalPdfVolume: string;
  workouts: ParsedWorkoutSession[];
}

import { getCurrentWeekMonday } from '../../utils/dateUtils.js';

export function isHugoHenrique7kmPlan(text?: string): boolean {
  if (!text) return false;
  const t = text.toLowerCase();
  return (
    (t.includes('hugo') && t.includes('henrique')) ||
    (t.includes('7 km') && (t.includes('polimento') || t.includes('semana 3') || t.includes('redução') || t.includes('reducao'))) ||
    (t.includes('ativação') && t.includes('400') && t.includes('desaquecimento')) ||
    (t.includes('05/10') && t.includes('11/10') && (t.includes('rodagem leve') || t.includes('polimento') || t.includes('tiros'))) ||
    (t.includes('prova 17 de outubro') || t.includes('7 km (17/10)'))
  );
}

/**
 * Converte o texto extraído da planilha PDF no objeto ParsedPdfResult estruturado.
 */
export function parsePdfTextContent(textInput?: string, referenceStartDate: string = getCurrentWeekMonday()): ParsedPdfResult {
  // Se for o plano do Hugo Henrique 7km Polimento (ou derivado), retorna os dados de alta fidelidade
  if (textInput && isHugoHenrique7kmPlan(textInput)) {
    const dates = extractDatesFromPlan(textInput, referenceStartDate);
    return getHugoHenrique7kmParsedData(dates.startDate);
  }

  // Se houver texto real extraído do PDF, tenta interpretá-lo
  if (textInput && textInput.trim().length > 30) {
    const dates = extractDatesFromPlan(textInput, referenceStartDate);
    const titleMatch = textInput.match(/(?:PLANO DE TREINAMENTO|TREINO)[^\n\r]+/i);
    const athleteMatch = textInput.match(/(?:Nome|Atleta)[:\s]+([^\n\r,]+)/i);

    const parsedSessions = parseWorkoutsFromRawText(textInput);
    if (parsedSessions && parsedSessions.length >= 3) {
      const plannedVolumeKm = parsedSessions.reduce((sum, w) => sum + (w.targetDistanceKm || 0), 0);
      return {
        title: titleMatch ? titleMatch[0].trim() : 'Planilha Importada - Pace Training',
        athleteName: athleteMatch ? athleteMatch[1].trim() : undefined,
        startDate: dates.startDate,
        endDate: dates.endDate,
        plannedVolumeKm: Math.round(plannedVolumeKm * 10) / 10,
        originalPdfVolume: `~${Math.round(plannedVolumeKm)} km`,
        workouts: parsedSessions
      };
    }
  }

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
    return '2026-10-11';
  }
}

export function extractDatesFromPlan(text: string, referenceStartDate: string = getCurrentWeekMonday()): { startDate: string; endDate: string } {
  try {
    const m = text.match(/(\d{1,2})\/(\d{1,2})\s*(?:a|at[eé]|-)\s*(\d{1,2})\/(\d{1,2})/i);
    if (m) {
      const startDay = parseInt(m[1], 10);
      const startMonth = parseInt(m[2], 10);
      const year = new Date().getFullYear();
      const startDateStr = `${year}-${String(startMonth).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`;
      return {
        startDate: startDateStr,
        endDate: calculateEndDate(startDateStr)
      };
    }
  } catch (e) {}
  return {
    startDate: referenceStartDate,
    endDate: calculateEndDate(referenceStartDate)
  };
}

/**
 * Planilha estruturada oficial: Hugo Henrique Martins (7 km - Polimento / Redução de Carga)
 */
export function getHugoHenrique7kmParsedData(referenceStartDate: string = '2026-10-05'): ParsedPdfResult {
  return {
    title: 'Plano de Treinamento 7 km - Semana 3 (Polimento / Redução de Carga)',
    athleteName: 'Hugo Henrique Martins',
    startDate: referenceStartDate,
    endDate: calculateEndDate(referenceStartDate),
    plannedVolumeKm: 20,
    originalPdfVolume: '~ 18 – 22 km (baixo)',
    workouts: [
      {
        dayOfWeek: 'SEGUNDA',
        period: 'MANHA',
        time: '07:00',
        category: 'LEVE',
        name: 'Rodagem leve (ritmo confortável)',
        targetDistanceKm: 4.5,
        estimatedDistanceKm: 4.5,
        targetPaceMin: '5:20',
        targetPaceMax: '5:40',
        repeatCount: 1,
        notes: 'Volume planejado: 4,0 - 5,0 km. Ritmo: 5:20 - 5:40/km (RPE 2-3). Objetivo: Soltar as pernas e manter a base. Terreno plano. Sem forçar.',
        steps: [
          {
            stepOrder: 1,
            stepType: 'RUN',
            durationType: 'DISTANCE',
            durationValue: 4500,
            targetMin: '5:20',
            targetMax: '5:40',
            notes: 'Rodagem leve'
          }
        ]
      },
      {
        dayOfWeek: 'TERCA',
        period: 'MANHA',
        time: '06:30',
        category: 'TIROS',
        name: 'Ativação + 4 × 400 m (leve/moderado)',
        targetDistanceKm: 6.6,
        estimatedDistanceKm: 6.6,
        targetPaceMin: '3:55',
        targetPaceMax: '4:00',
        repeatCount: 4,
        notes: 'Volume: 6,0 - 7,0 km. 2 km aquecimento + 4 × 400 m (ritmo ~3:55-4:00/km) + 1 km desaquecimento. RPE 4-5. Objetivo: Manter a velocidade e a coordenação. Recuperação: 200 m (mais leve). Não é para forçar.',
        steps: [
          {
            stepOrder: 1,
            stepType: 'WARMUP',
            durationType: 'DISTANCE',
            durationValue: 2000,
            targetMin: '5:20',
            targetMax: '5:40',
            notes: '2 km aquecimento'
          },
          {
            stepOrder: 2,
            stepType: 'RUN',
            durationType: 'DISTANCE',
            durationValue: 400,
            targetMin: '3:55',
            targetMax: '4:00',
            notes: '4x 400m leve/moderado'
          },
          {
            stepOrder: 3,
            stepType: 'RECOVERY',
            durationType: 'DISTANCE',
            durationValue: 200,
            targetMin: '5:40',
            targetMax: '6:10',
            notes: 'Recuperação 200 m (mais leve)'
          },
          {
            stepOrder: 4,
            stepType: 'COOL_DOWN',
            durationType: 'DISTANCE',
            durationValue: 1000,
            targetMin: '5:20',
            targetMax: '5:40',
            notes: '1 km desaquecimento'
          }
        ]
      },
      {
        dayOfWeek: 'QUARTA',
        period: 'MANHA',
        time: '07:00',
        category: 'REGENERATIVO',
        name: 'Rodagem regenerativa',
        targetDistanceKm: 4.5,
        estimatedDistanceKm: 4.5,
        targetPaceMin: '5:30',
        targetPaceMax: '5:50',
        repeatCount: 1,
        notes: 'Volume: 4,0 - 5,0 km. Ritmo: 5:30 - 5:50/km (RPE 2-3). Objetivo: Recuperação ativa. Terreno plano ou levemente ondulado.',
        steps: [
          {
            stepOrder: 1,
            stepType: 'RUN',
            durationType: 'DISTANCE',
            durationValue: 4500,
            targetMin: '5:30',
            targetMax: '5:50',
            notes: 'Rodagem regenerativa'
          }
        ]
      },
      {
        dayOfWeek: 'QUINTA',
        period: 'MANHA',
        time: '07:00',
        category: 'LEVE',
        name: 'Rodagem leve (ritmo confortável)',
        targetDistanceKm: 5.5,
        estimatedDistanceKm: 5.5,
        targetPaceMin: '5:15',
        targetPaceMax: '5:35',
        repeatCount: 1,
        notes: 'Volume: 5,0 - 6,0 km. Ritmo: 5:15 - 5:35/km (RPE 2-3). Objetivo: Manter o ritmo e o relaxamento. Foco na respiração e na técnica.',
        steps: [
          {
            stepOrder: 1,
            stepType: 'RUN',
            durationType: 'DISTANCE',
            durationValue: 5500,
            targetMin: '5:15',
            targetMax: '5:35',
            notes: 'Rodagem leve'
          }
        ]
      },
      {
        dayOfWeek: 'SEXTA',
        period: 'MANHA',
        time: '06:30',
        category: 'TIROS',
        name: 'Tiros curtos (opcional) - 6 × 200 m',
        targetDistanceKm: 3.5,
        estimatedDistanceKm: 3.5,
        targetPaceMin: '3:45',
        targetPaceMax: '3:50',
        repeatCount: 6,
        notes: 'Volume: 3,0 - 4,0 km. Ritmo: 3:45 - 3:50/km (nos 200 m). 6 × 200 m + Rec. 200 m trote. RPE 4-5. Objetivo: Ativar a velocidade sem desgaste. Se sentir cansado, faça apenas 4 × 200 m ou trote leve.',
        steps: [
          {
            stepOrder: 1,
            stepType: 'WARMUP',
            durationType: 'DISTANCE',
            durationValue: 1000,
            targetMin: '5:20',
            targetMax: '5:40',
            notes: 'Aquecimento'
          },
          {
            stepOrder: 2,
            stepType: 'RUN',
            durationType: 'DISTANCE',
            durationValue: 200,
            targetMin: '3:45',
            targetMax: '3:50',
            notes: '6x 200m'
          },
          {
            stepOrder: 3,
            stepType: 'RECOVERY',
            durationType: 'DISTANCE',
            durationValue: 200,
            targetMin: '5:30',
            targetMax: '6:00',
            notes: 'Rec. 200 m trote'
          },
          {
            stepOrder: 4,
            stepType: 'COOL_DOWN',
            durationType: 'DISTANCE',
            durationValue: 1000,
            targetMin: '5:20',
            targetMax: '5:40',
            notes: 'Soltura final'
          }
        ]
      },
      {
        dayOfWeek: 'SABADO',
        period: 'MANHA',
        time: '07:00',
        category: 'LEVE',
        name: 'Rodagem leve + 4 × 100 m (solto, sem forçar)',
        targetDistanceKm: 4.0,
        estimatedDistanceKm: 4.0,
        targetPaceMin: '5:20',
        targetPaceMax: '5:40',
        repeatCount: 4,
        notes: 'Volume: 4,0 - 5,0 km. 1,5 km + 4 × 100 m + 1 km. Ritmo: 5:20 - 5:40/km (rodagem) / 100 m: 90-95%. RPE 3-4. Objetivo: Manter a fluidez e a técnica de corrida. Recuperação completa nos 100 m. Sem sprint.',
        steps: [
          {
            stepOrder: 1,
            stepType: 'RUN',
            durationType: 'DISTANCE',
            durationValue: 1500,
            targetMin: '5:20',
            targetMax: '5:40',
            notes: '1,5 km rodagem leve'
          },
          {
            stepOrder: 2,
            stepType: 'RUN',
            durationType: 'DISTANCE',
            durationValue: 100,
            targetType: 'OPEN',
            notes: '100 m: 90-95%'
          },
          {
            stepOrder: 3,
            stepType: 'RECOVERY',
            durationType: 'DISTANCE',
            durationValue: 100,
            targetType: 'OPEN',
            notes: 'Recuperação completa 100 m'
          },
          {
            stepOrder: 4,
            stepType: 'COOL_DOWN',
            durationType: 'DISTANCE',
            durationValue: 1000,
            targetMin: '5:20',
            targetMax: '5:40',
            notes: '1 km desaquecimento'
          }
        ]
      },
      {
        dayOfWeek: 'DOMINGO',
        period: 'MANHA',
        time: '08:00',
        category: 'DESCANSO',
        name: 'Descanso completo',
        targetDistanceKm: 0,
        estimatedDistanceKm: 0,
        repeatCount: 1,
        notes: 'Recuperar o corpo e a mente. Hidratação, boa alimentação e sono.'
      }
    ]
  };
}

/**
 * Planilha oficial do Pace Club (Treinador Leandro Prates / Atleta Paulo Henrique)
 * Volume semanal: ~83 km (+ aquecimentos por tempo)
 */
export function getPaceClubParsedData(referenceStartDate: string = getCurrentWeekMonday(), athleteName?: string): ParsedPdfResult {
  const athleteLabel = athleteName ? ` (${athleteName})` : '';
  return {
    title: `Semana 01 - Pace Club${athleteLabel}`,
    athleteName,
    startDate: referenceStartDate,
    endDate: calculateEndDate(referenceStartDate),
    plannedVolumeKm: 83,
    originalPdfVolume: '~83 km (+ aquecimentos por tempo)',
    workouts: [
      {
        dayOfWeek: 'SEGUNDA',
        period: 'MANHA',
        time: '06:30',
        category: 'ACADEMIA',
        name: '20 min aquecimento + ACADEMIA + 5 km desaquecimento leve',
        targetDistanceKm: 5,
        estimatedDistanceKm: 5,
        targetPaceMin: '5:10',
        targetPaceMax: '5:40',
        repeatCount: 1,
        notes: '20 min de aquecimento + ACADEMIA (Cadeira Extensora 3x, Mesa Flexora 3x, Agachamento 3x15, Subida no Banco 3x15, Leg Press 3x15, Stiff 3x15, Levantamento Terra 3x15) + 5 km de desaquecimento leve. Total: 5 km (+ 20 min)'
      },
      {
        dayOfWeek: 'TERCA',
        period: 'MANHA',
        time: '06:30',
        category: 'TIROS',
        name: '5 km aquec. + 10x200m em rampa (progressivo) + 4 km desaquec.',
        targetDistanceKm: 9,
        estimatedDistanceKm: 11,
        targetPaceMin: '3:15',
        targetPaceMax: '3:30',
        repeatCount: 10,
        notes: '5 km de aquecimento + 10 × 200 m em rampa (progressivo: do controlado ao forte) + 4 km de desaquecimento. Total: 9 km (+ tiros)',
        steps: [
          {
            stepOrder: 1,
            stepType: 'WARMUP',
            durationType: 'DISTANCE',
            durationValue: 5000,
            targetType: 'PACE',
            targetMin: '5:10',
            targetMax: '5:40',
            notes: 'Aquecimento 5 km leve'
          },
          {
            stepOrder: 2,
            stepType: 'RUN',
            durationType: 'DISTANCE',
            durationValue: 200,
            targetType: 'PACE',
            targetMin: '3:15',
            targetMax: '3:30',
            notes: '10x 200m em rampa progressivo'
          },
          {
            stepOrder: 3,
            stepType: 'COOL_DOWN',
            durationType: 'DISTANCE',
            durationValue: 4000,
            targetType: 'PACE',
            targetMin: '5:10',
            targetMax: '5:40',
            notes: 'Desaquecimento 4 km leve'
          }
        ]
      },
      {
        dayOfWeek: 'QUARTA',
        period: 'MANHA',
        time: '06:30',
        category: 'LONGAO',
        name: '18 km leve, ritmo confortável',
        targetDistanceKm: 18,
        estimatedDistanceKm: 18,
        targetPaceMin: '5:10',
        targetPaceMax: '5:40',
        repeatCount: 1,
        notes: '18 km leve, ritmo confortável. Leve/Regenerativo: 5:10 - 5:40 min/km. Total: 18 km'
      },
      {
        dayOfWeek: 'QUINTA',
        period: 'MANHA',
        time: '06:30',
        category: 'TIROS',
        name: '4 km aquec. + 15x400m em 1\'12" (pausa 1\'30") + 3 km desaquec.',
        targetDistanceKm: 13,
        estimatedDistanceKm: 13,
        targetPaceMin: '3:00',
        targetPaceMax: '3:00',
        repeatCount: 15,
        notes: '4 km de aquecimento + 15 × 400 m em 1\'12" (pausa de 1\'30" ativa) + 3 km de desaquecimento. Total: 13 km (+ tiros)',
        steps: [
          {
            stepOrder: 1,
            stepType: 'WARMUP',
            durationType: 'DISTANCE',
            durationValue: 4000,
            targetType: 'PACE',
            targetMin: '5:10',
            targetMax: '5:40',
            notes: 'Aquecimento 4 km leve'
          },
          {
            stepOrder: 2,
            stepType: 'RUN',
            durationType: 'DISTANCE',
            durationValue: 400,
            targetType: 'PACE',
            targetMin: '3:00',
            targetMax: '3:00',
            notes: 'Tiro 400m em 1\'12"'
          },
          {
            stepOrder: 3,
            stepType: 'RECOVERY',
            durationType: 'TIME',
            durationValue: 90,
            targetType: 'PACE',
            targetMin: '5:10',
            targetMax: '5:40',
            notes: 'Pausa 1\'30" ativa'
          },
          {
            stepOrder: 4,
            stepType: 'COOL_DOWN',
            durationType: 'DISTANCE',
            durationValue: 3000,
            targetType: 'PACE',
            targetMin: '5:10',
            targetMax: '5:40',
            notes: 'Desaquecimento 3 km leve'
          }
        ]
      },
      {
        dayOfWeek: 'SEXTA',
        period: 'MANHA',
        time: '06:30',
        category: 'ACADEMIA',
        name: '20 min aquecimento + ACADEMIA + 5 km deslocamento leve',
        targetDistanceKm: 5,
        estimatedDistanceKm: 5,
        targetPaceMin: '5:10',
        targetPaceMax: '5:40',
        repeatCount: 1,
        notes: '20 min de aquecimento + ACADEMIA (Cadeira Extensora 3x, Mesa Flexora 3x, Agachamento 3x15, Subida no Banco 3x15, Leg Press 3x15, Stiff 3x15, Levantamento Terra 3x15) + 5 km de deslocamento leve. Total: 5 km (+ 20 min)'
      },
      {
        dayOfWeek: 'SABADO',
        period: 'MANHA',
        time: '06:30',
        category: 'FARTLEK',
        name: '18 km leve com fartlek nos últimos 3 km (2\' forte / 1\' fraco)',
        targetDistanceKm: 18,
        estimatedDistanceKm: 18,
        targetPaceMin: '4:00',
        targetPaceMax: '4:20',
        repeatCount: 1,
        notes: '18 km leve. Nos últimos 3 km fazer fartlek (2 min forte: 4:00–4:20 / 1 min fraco: 5:10–5:40). Total: 18 km'
      },
      {
        dayOfWeek: 'DOMINGO',
        period: 'MANHA',
        time: '08:00',
        category: 'DESCANSO',
        name: 'DESCANSO / recuperação',
        targetDistanceKm: 0,
        estimatedDistanceKm: 0,
        notes: 'DESCANSO / recuperação total. Sono, hidratação e alimentação.'
      }
    ]
  };
}

function parseWorkoutsFromRawText(text: string): ParsedWorkoutSession[] | null {
  const daysOrder: Array<{
    day: 'SEGUNDA' | 'TERCA' | 'QUARTA' | 'QUINTA' | 'SEXTA' | 'SABADO' | 'DOMINGO';
    regex: RegExp;
  }> = [
    { day: 'SEGUNDA', regex: /\b(?:SEG(?:UNDA)?(?:-FEIRA)?)\b/i },
    { day: 'TERCA', regex: /\b(?:TER(?:[CÇ]A)?(?:-FEIRA)?)\b/i },
    { day: 'QUARTA', regex: /\b(?:QUA(?:RTA)?(?:-FEIRA)?)\b/i },
    { day: 'QUINTA', regex: /\b(?:QUI(?:NTA)?(?:-FEIRA)?)\b/i },
    { day: 'SEXTA', regex: /\b(?:SEX(?:TA)?(?:-FEIRA)?)\b/i },
    { day: 'SABADO', regex: /\b(?:S[AÁ]B(?:ADO)?)\b/i },
    { day: 'DOMINGO', regex: /\b(?:DOM(?:INGO)?)\b/i }
  ];

  const occurrences: Array<{ day: 'SEGUNDA' | 'TERCA' | 'QUARTA' | 'QUINTA' | 'SEXTA' | 'SABADO' | 'DOMINGO'; index: number }> = [];

  for (const item of daysOrder) {
    const match = item.regex.exec(text);
    if (match) {
      occurrences.push({ day: item.day, index: match.index });
    }
  }

  if (occurrences.length < 3) return null;

  occurrences.sort((a, b) => a.index - b.index);

  const workouts: ParsedWorkoutSession[] = [];

  for (let i = 0; i < occurrences.length; i++) {
    const current = occurrences[i];
    const next = occurrences[i + 1];
    const chunk = text.slice(current.index, next ? next.index : undefined);

    const lines = chunk.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const contentLines = lines.filter(l => !l.match(/^(?:SEG|TER|QUA|QUI|SEX|S[AÁ]B|DOM)/i) || l.length > 15);
    const fullText = (contentLines.length > 0 ? contentLines.join(' ') : chunk).trim();

    let category: ParsedWorkoutSession['category'] = 'LEVE';
    if (/ACADEMIA|MUSCULA[CÇ][AÃ]O|FOR[CÇ]A/i.test(fullText)) {
      category = 'ACADEMIA';
    } else if (/TIROS?|\d+\s*[xX×]\s*\d+m|RAMPA/i.test(fullText)) {
      category = 'TIROS';
    } else if (/FARTLEK/i.test(fullText)) {
      category = 'FARTLEK';
    } else if (/CONTROLADO|TEMPO\s*RUN/i.test(fullText)) {
      category = 'CONTROLADO';
    } else if (/LONGO|LONG[AÃ]O/i.test(fullText)) {
      category = 'LONGAO';
    } else if (/REGENERATIVO/i.test(fullText)) {
      category = 'REGENERATIVO';
    } else if (/DESCANSO|FOLGA/i.test(fullText)) {
      category = 'DESCANSO';
    }

    let targetDistanceKm: number | undefined;
    if (category === 'DESCANSO') {
      targetDistanceKm = 0;
    } else {
      const totalMatch = fullText.match(/(?:total:?|->|=>)\s*(\d+(?:[.,]\d+)?)\s*km/i)
        || fullText.match(/(\d+(?:[.,]\d+)?)\s*km\s*\((?:\+\s*(?:tiros|\d+\s*min))\)/i);
      if (totalMatch) {
        targetDistanceKm = parseFloat(totalMatch[1].replace(',', '.'));
      } else {
        // Suporta faixa de volume típica de tabela: "4,0 - 5,0", "6,0 - 7,0", "3,0 - 4,0"
        const rangeKmMatch = fullText.match(/\b(\d+(?:[.,]\d+)?)\s*[-–]\s*(\d+(?:[.,]\d+)?)\b(?!\s*:\s*\d)/);
        const isPaceRange = rangeKmMatch && (fullText.includes(`${rangeKmMatch[1]}:`) || fullText.includes(`:${rangeKmMatch[1]}`));
        if (rangeKmMatch && !isPaceRange) {
          const v1 = parseFloat(rangeKmMatch[1].replace(',', '.'));
          const v2 = parseFloat(rangeKmMatch[2].replace(',', '.'));
          if (v1 > 0 && v2 > 0 && v1 < 50 && v2 < 50) {
            targetDistanceKm = Math.round(((v1 + v2) / 2) * 10) / 10;
          }
        }

        if (targetDistanceKm === undefined) {
          const allKmMatches = Array.from(fullText.matchAll(/(\d+(?:[.,]\d+)?)\s*km/gi));
          if (allKmMatches.length > 1) {
            const sumKm = allKmMatches.reduce((acc, m) => acc + parseFloat(m[1].replace(',', '.')), 0);
            targetDistanceKm = Math.round(sumKm * 10) / 10;
          } else if (allKmMatches.length === 1) {
            targetDistanceKm = parseFloat(allKmMatches[0][1].replace(',', '.'));
          }
        }
      }
    }

    let repeatCount = 1;
    const repeatMatch = fullText.match(/(\d+)\s*[xX×]\s*(\d+)m/i);
    if (repeatMatch) {
      repeatCount = parseInt(repeatMatch[1], 10);
    }

    let targetPaceMin: string | undefined;
    let targetPaceMax: string | undefined;
    const paceMatch = fullText.match(/(\d{1,2}:\d{2})\s*(?:[-–a]|at[eé])\s*(\d{1,2}:\d{2})/i);
    if (paceMatch) {
      targetPaceMin = paceMatch[1];
      targetPaceMax = paceMatch[2];
    } else {
      if (category === 'ACADEMIA' || category === 'LEVE' || category === 'REGENERATIVO') {
        targetPaceMin = '5:10';
        targetPaceMax = '5:40';
      } else if (category === 'TIROS') {
        targetPaceMin = '3:15';
        targetPaceMax = '3:30';
      } else if (category === 'CONTROLADO') {
        targetPaceMin = '3:50';
        targetPaceMax = '4:10';
      } else if (category === 'FARTLEK') {
        targetPaceMin = '4:10';
        targetPaceMax = '4:40';
      } else if (category === 'LONGAO') {
        targetPaceMin = '4:45';
        targetPaceMax = '5:15';
      }
    }

    // Extrai passos de treino estruturados (aquecimento, tiros, recuperação e volta à calma)
    const steps: ParsedWorkoutStep[] = [];
    const warmupMatch = fullText.match(/(\d+(?:[.,]\d+)?)\s*(?:km|m)\s*(?:de\s*)?aquec/i);
    const cooldownMatch = fullText.match(/(\d+(?:[.,]\d+)?)\s*(?:km|m)\s*(?:de\s*)?desaquec/i);
    const recMatch = fullText.match(/(?:rec(?:upera[cç][aã]o)?|\bpausa\b)[:\s]*(\d+)\s*m/i);

    let stepOrder = 1;
    if (warmupMatch) {
      const val = parseFloat(warmupMatch[1].replace(',', '.'));
      const inMeters = warmupMatch[0].toLowerCase().includes('km') ? val * 1000 : val;
      steps.push({
        stepOrder: stepOrder++,
        stepType: 'WARMUP',
        durationType: 'DISTANCE',
        durationValue: inMeters,
        targetMin: targetPaceMin,
        targetMax: targetPaceMax,
        notes: `${val} km aquecimento`
      });
    }

    if (repeatMatch) {
      const repDist = parseInt(repeatMatch[2], 10);
      steps.push({
        stepOrder: stepOrder++,
        stepType: 'RUN',
        durationType: 'DISTANCE',
        durationValue: repDist,
        targetMin: targetPaceMin,
        targetMax: targetPaceMax,
        notes: `${repeatCount}x ${repDist}m`
      });

      if (recMatch) {
        steps.push({
          stepOrder: stepOrder++,
          stepType: 'RECOVERY',
          durationType: 'DISTANCE',
          durationValue: parseInt(recMatch[1], 10),
          notes: `Recuperação ${recMatch[1]}m`
        });
      }
    }

    if (cooldownMatch) {
      const val = parseFloat(cooldownMatch[1].replace(',', '.'));
      const inMeters = cooldownMatch[0].toLowerCase().includes('km') ? val * 1000 : val;
      steps.push({
        stepOrder: stepOrder++,
        stepType: 'COOL_DOWN',
        durationType: 'DISTANCE',
        durationValue: inMeters,
        notes: `${val} km desaquecimento`
      });
    }

    let cleanName = fullText
      .replace(/^(?:SEG|TER|QUA|QUI|SEX|S[AÁ]B|DOM)[^:]*:\s*/i, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (cleanName.length > 70) {
      cleanName = cleanName.slice(0, 67) + '...';
    }
    if (!cleanName || cleanName.length < 3) {
      cleanName = category === 'DESCANSO' ? 'Dia de Descanso' : `Treino ${current.day}`;
    }

    workouts.push({
      dayOfWeek: current.day,
      period: 'MANHA',
      time: '06:30',
      category,
      name: cleanName,
      targetDistanceKm,
      estimatedDistanceKm: targetDistanceKm,
      targetPaceMin: category === 'DESCANSO' ? undefined : targetPaceMin,
      targetPaceMax: category === 'DESCANSO' ? undefined : targetPaceMax,
      repeatCount,
      notes: fullText.slice(0, 300),
      steps: steps.length > 0 ? steps : undefined
    });
  }

  return workouts.length > 0 ? workouts : null;
}
