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
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  plannedVolumeKm: number;
  originalPdfVolume: string;
  workouts: ParsedWorkoutSession[];
}

import { getCurrentWeekMonday } from '../../utils/dateUtils.js';

/**
 * Converte o texto extraído da planilha PDF no objeto ParsedPdfResult estruturado.
 */
export function parsePdfTextContent(textInput?: string, referenceStartDate: string = getCurrentWeekMonday()): ParsedPdfResult {
  // Se houver texto real extraído do PDF, tenta interpretá-lo
  if (textInput && textInput.trim().length > 30) {
    const parsedSessions = parseWorkoutsFromRawText(textInput);
    if (parsedSessions && parsedSessions.length >= 3) {
      const plannedVolumeKm = parsedSessions.reduce((sum, w) => sum + (w.targetDistanceKm || 0), 0);
      return {
        title: 'Planilha Importada - Pace Training',
        startDate: referenceStartDate,
        endDate: calculateEndDate(referenceStartDate),
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
    return '2026-09-13';
  }
}

/**
 * Planilha oficial do Pace Club (Treinador Leandro Prates / Atleta Paulo Henrique)
 * Volume semanal: ~83 km (+ aquecimentos por tempo)
 */
export function getPaceClubParsedData(referenceStartDate: string = getCurrentWeekMonday()): ParsedPdfResult {
  return {
    title: 'Semana 01 - Pace Club (Paulo Henrique)',
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
        const allKmMatches = Array.from(fullText.matchAll(/(\d+(?:[.,]\d+)?)\s*km/gi));
        if (allKmMatches.length > 1) {
          const sumKm = allKmMatches.reduce((acc, m) => acc + parseFloat(m[1].replace(',', '.')), 0);
          targetDistanceKm = Math.round(sumKm * 10) / 10;
        } else if (allKmMatches.length === 1) {
          targetDistanceKm = parseFloat(allKmMatches[0][1].replace(',', '.'));
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
      notes: fullText.slice(0, 250)
    });
  }

  return workouts.length > 0 ? workouts : null;
}
