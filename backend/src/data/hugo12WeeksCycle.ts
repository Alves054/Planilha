export interface CycleWorkoutStep {
  stepType: 'WARMUP' | 'RUN' | 'RECOVERY' | 'COOL_DOWN' | 'REST';
  durationType: 'TIME' | 'DISTANCE';
  durationValue: number;
  targetType?: 'PACE' | 'HR_ZONE' | 'OPEN';
  targetMin?: string;
  targetMax?: string;
  notes?: string;
}

export interface CycleWorkout {
  name: string;
  category: 'LEVE' | 'REGENERATIVO' | 'TIROS' | 'FARTLEK' | 'CONTROLADO' | 'LONGAO' | 'DESCANSO';
  sport: string;
  time?: string;
  period?: 'MANHA' | 'TARDE' | 'NOITE';
  targetDistanceKm?: number;
  targetPaceMin?: string;
  targetPaceMax?: string;
  repeatCount?: number;
  notes?: string;
  steps?: CycleWorkoutStep[];
}

export interface CycleDay {
  dayOffset: number;
  dayOfWeek: 'SEGUNDA' | 'TERCA' | 'QUARTA' | 'QUINTA' | 'SEXTA' | 'SABADO' | 'DOMINGO';
  workouts: CycleWorkout[];
}

export interface CycleWeek {
  weekNumber: number;
  title: string;
  days: CycleDay[];
}

export interface DefaultCycleDefinition {
  name: string;
  category: string;
  targetPace: string;
  durationDays: number;
  description: string;
  weeks: CycleWeek[];
}

export const HUGO_12_WEEKS_CYCLE: DefaultCycleDefinition = {
  name: 'Hugo — Evolução nos 5 km (Ciclo Completo — 12 semanas)',
  category: '5KM',
  targetPace: '4:24/km',
  durationDays: 84,
  description: 'Ciclo completo de 12 semanas para evolução nos 5 km (Meta: 22:00 — 4:24/km). Frequência de 6 dias por semana com domingo livre. Foco em recuperação pós-prova, aumento de resistência aeróbia, intervalados controlados e polimento final.',
  weeks: [
    // ─── SEMANA 1 (19 a 25 de outubro) ──────────────────────────────────────
    {
      weekNumber: 1,
      title: 'Semana 1 — Recuperação da Prova de 7 km (~26 km)',
      days: [
        {
          dayOffset: 0,
          dayOfWeek: 'SEGUNDA',
          workouts: [{
            name: '4 km Leve (Ritmo Confortável)',
            category: 'LEVE',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 4,
            targetPaceMin: '5:20',
            targetPaceMax: '5:50',
            repeatCount: 1,
            notes: '4 km leves, a 5:20–5:50/km, somente se recuperado da prova.'
          }]
        },
        {
          dayOffset: 1,
          dayOfWeek: 'TERCA',
          workouts: [{
            name: '5 km Leve (Sem Tiros)',
            category: 'LEVE',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 5,
            targetPaceMin: '5:10',
            targetPaceMax: '5:50',
            repeatCount: 1,
            notes: '5 km leves contínuos, sem tiros ou acelerações.'
          }]
        },
        {
          dayOffset: 2,
          dayOfWeek: 'QUARTA',
          workouts: [{
            name: '4 km Regenerativo',
            category: 'REGENERATIVO',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 4,
            targetPaceMin: '5:25',
            targetPaceMax: '6:00',
            repeatCount: 1,
            notes: '4 km regenerativos bem confortáveis, soltando a musculatura.'
          }]
        },
        {
          dayOffset: 3,
          dayOfWeek: 'QUINTA',
          workouts: [{
            name: '5 km Leve + 4× 15s Acelerações Relaxadas',
            category: 'LEVE',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 5,
            targetPaceMin: '5:10',
            targetPaceMax: '5:50',
            repeatCount: 4,
            notes: '5 km leves + 4 acelerações relaxadas de 15 segundos, se estiver bem.'
          }]
        },
        {
          dayOffset: 4,
          dayOfWeek: 'SEXTA',
          workouts: [{
            name: '4 km Regenerativo',
            category: 'REGENERATIVO',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 4,
            targetPaceMin: '5:25',
            targetPaceMax: '6:00',
            repeatCount: 1,
            notes: '4 km regenerativos, ritmo bem confortável.'
          }]
        },
        {
          dayOffset: 5,
          dayOfWeek: 'SABADO',
          workouts: [{
            name: '4 km Leve (Sem Intervalado)',
            category: 'LEVE',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 4,
            targetPaceMin: '5:10',
            targetPaceMax: '5:50',
            repeatCount: 1,
            notes: '4 km leves, sem intervalado.'
          }]
        },
        {
          dayOffset: 6,
          dayOfWeek: 'DOMINGO',
          workouts: [{
            name: 'Descanso Completo',
            category: 'DESCANSO',
            sport: 'RUNNING',
            time: '08:00',
            period: 'MANHA',
            targetDistanceKm: 0,
            repeatCount: 1,
            notes: 'Descanso total, boa alimentação e hidratação.'
          }]
        }
      ]
    },

    // ─── SEMANA 2 (26 de outubro a 1º de novembro) ──────────────────────────
    {
      weekNumber: 2,
      title: 'Semana 2 — Retomada dos Estímulos (~29 km)',
      days: [
        {
          dayOffset: 0,
          dayOfWeek: 'SEGUNDA',
          workouts: [{
            name: '5 km Leve',
            category: 'LEVE',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 5,
            targetPaceMin: '5:10',
            targetPaceMax: '5:50',
            repeatCount: 1,
            notes: '5 km leves em ritmo confortável.'
          }]
        },
        {
          dayOffset: 1,
          dayOfWeek: 'TERCA',
          workouts: [{
            name: '6 km Total: 2 km Leve + 6× 1 min Moderado (Rec. 2 min) + Soltura',
            category: 'FARTLEK',
            sport: 'RUNNING',
            time: '06:30',
            period: 'MANHA',
            targetDistanceKm: 6,
            targetPaceMin: '4:40',
            targetPaceMax: '5:00',
            repeatCount: 6,
            notes: '6 km total: 2 km leves + 6 × 1 min moderado (RPE 5–6/10), com 2 min de trote leve + completar leve.'
          }]
        },
        {
          dayOffset: 2,
          dayOfWeek: 'QUARTA',
          workouts: [{
            name: '4 km Regenerativo',
            category: 'REGENERATIVO',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 4,
            targetPaceMin: '5:25',
            targetPaceMax: '6:00',
            repeatCount: 1,
            notes: '4 km regenerativos.'
          }]
        },
        {
          dayOffset: 3,
          dayOfWeek: 'QUINTA',
          workouts: [{
            name: '5 km Total: 2 km Leve + 6× 20s Aceleração (Rec. 60–90s) + Soltura',
            category: 'LEVE',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 5,
            targetPaceMin: '5:10',
            targetPaceMax: '5:50',
            repeatCount: 6,
            notes: '5 km total: 2 km leves + 6 × 20 s de aceleração relaxada, recuperando 60–90 s caminhando ou trotando + completar leve.'
          }]
        },
        {
          dayOffset: 4,
          dayOfWeek: 'SEXTA',
          workouts: [{
            name: '4 km Leve',
            category: 'LEVE',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 4,
            targetPaceMin: '5:10',
            targetPaceMax: '5:50',
            repeatCount: 1,
            notes: '4 km leves.'
          }]
        },
        {
          dayOffset: 5,
          dayOfWeek: 'SABADO',
          workouts: [{
            name: '5 km Total: 2 km Leve + 6× 30s Ritmo Vivo (Rec. 90s) + Soltura',
            category: 'FARTLEK',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 5,
            targetPaceMin: '4:30',
            targetPaceMax: '4:50',
            repeatCount: 6,
            notes: '5 km total: 2 km leves + 6 × 30 s em ritmo vivo, sem sprint, com 90 s de trote + completar leve.'
          }]
        },
        {
          dayOffset: 6,
          dayOfWeek: 'DOMINGO',
          workouts: [{
            name: 'Descanso Completo',
            category: 'DESCANSO',
            sport: 'RUNNING',
            time: '08:00',
            period: 'MANHA',
            targetDistanceKm: 0,
            repeatCount: 1,
            notes: 'Descanso.'
          }]
        }
      ]
    },

    // ─── SEMANA 3 (2 a 8 de novembro) ───────────────────────────────────────
    {
      weekNumber: 3,
      title: 'Semana 3 — Resistência e Regularidade (~30 km)',
      days: [
        {
          dayOffset: 0,
          dayOfWeek: 'SEGUNDA',
          workouts: [{
            name: '5 km Leve',
            category: 'LEVE',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 5,
            targetPaceMin: '5:10',
            targetPaceMax: '5:50',
            repeatCount: 1,
            notes: '5 km leves.'
          }]
        },
        {
          dayOffset: 1,
          dayOfWeek: 'TERCA',
          workouts: [{
            name: '6 km Total: 2 km Leve + 4× 3 min Moderado (Rec. 2 min) + Soltura',
            category: 'FARTLEK',
            sport: 'RUNNING',
            time: '06:30',
            period: 'MANHA',
            targetDistanceKm: 6,
            targetPaceMin: '4:40',
            targetPaceMax: '5:00',
            repeatCount: 4,
            notes: '6 km total: 2 km leves + 4 × 3 min moderados, recuperando 2 min de trote + completar leve.'
          }]
        },
        {
          dayOffset: 2,
          dayOfWeek: 'QUARTA',
          workouts: [{
            name: '4 km Regenerativo',
            category: 'REGENERATIVO',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 4,
            targetPaceMin: '5:25',
            targetPaceMax: '6:00',
            repeatCount: 1,
            notes: '4 km regenerativos.'
          }]
        },
        {
          dayOffset: 3,
          dayOfWeek: 'QUINTA',
          workouts: [{
            name: '5 km Leve + 4× 15s Acelerações Relaxadas',
            category: 'LEVE',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 5,
            targetPaceMin: '5:10',
            targetPaceMax: '5:50',
            repeatCount: 4,
            notes: '5 km leves + 4 acelerações relaxadas de 15 s.'
          }]
        },
        {
          dayOffset: 4,
          dayOfWeek: 'SEXTA',
          workouts: [{
            name: '4 km Regenerativo',
            category: 'REGENERATIVO',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 4,
            targetPaceMin: '5:25',
            targetPaceMax: '6:00',
            repeatCount: 1,
            notes: '4 km regenerativos.'
          }]
        },
        {
          dayOffset: 5,
          dayOfWeek: 'SABADO',
          workouts: [{
            name: '6 km Total: 2 km Leve + 6× 1 min Moderado (Rec. 2 min) + Soltura',
            category: 'FARTLEK',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 6,
            targetPaceMin: '4:40',
            targetPaceMax: '5:00',
            repeatCount: 6,
            notes: '6 km total: 2 km leves + 6 × 1 min em esforço moderado, com 2 min de trote + completar leve.'
          }]
        },
        {
          dayOffset: 6,
          dayOfWeek: 'DOMINGO',
          workouts: [{
            name: 'Descanso Completo',
            category: 'DESCANSO',
            sport: 'RUNNING',
            time: '08:00',
            period: 'MANHA',
            targetDistanceKm: 0,
            repeatCount: 1,
            notes: 'Descanso.'
          }]
        }
      ]
    },

    // ─── SEMANA 4 (9 a 15 de novembro) ──────────────────────────────────────
    {
      weekNumber: 4,
      title: 'Semana 4 — Consolidação (~29 km)',
      days: [
        {
          dayOffset: 0,
          dayOfWeek: 'SEGUNDA',
          workouts: [{
            name: '5 km Leve',
            category: 'LEVE',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 5,
            targetPaceMin: '5:10',
            targetPaceMax: '5:50',
            repeatCount: 1,
            notes: '5 km leves.'
          }]
        },
        {
          dayOffset: 1,
          dayOfWeek: 'TERCA',
          workouts: [{
            name: '6 km Total: 2 km Leve + 5× 2 min Moderado (Rec. 2 min) + Soltura',
            category: 'FARTLEK',
            sport: 'RUNNING',
            time: '06:30',
            period: 'MANHA',
            targetDistanceKm: 6,
            targetPaceMin: '4:40',
            targetPaceMax: '5:00',
            repeatCount: 5,
            notes: '6 km total: 2 km leves + 5 × 2 min moderados, com 2 min de trote + completar leve.'
          }]
        },
        {
          dayOffset: 2,
          dayOfWeek: 'QUARTA',
          workouts: [{
            name: '4 km Regenerativo',
            category: 'REGENERATIVO',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 4,
            targetPaceMin: '5:25',
            targetPaceMax: '6:00',
            repeatCount: 1,
            notes: '4 km regenerativos.'
          }]
        },
        {
          dayOffset: 3,
          dayOfWeek: 'QUINTA',
          workouts: [{
            name: '5 km Leve + 4× 15s Acelerações Relaxadas',
            category: 'LEVE',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 5,
            targetPaceMin: '5:10',
            targetPaceMax: '5:50',
            repeatCount: 4,
            notes: '5 km leves + 4 acelerações relaxadas de 15 s.'
          }]
        },
        {
          dayOffset: 4,
          dayOfWeek: 'SEXTA',
          workouts: [{
            name: '4 km Regenerativo',
            category: 'REGENERATIVO',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 4,
            targetPaceMin: '5:25',
            targetPaceMax: '6:00',
            repeatCount: 1,
            notes: '4 km regenerativos.'
          }]
        },
        {
          dayOffset: 5,
          dayOfWeek: 'SABADO',
          workouts: [{
            name: '5 km Leve com 6× 20s Acelerações Relaxadas',
            category: 'LEVE',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 5,
            targetPaceMin: '5:10',
            targetPaceMax: '5:50',
            repeatCount: 6,
            notes: '5 km leves com 6 × 20 s de aceleração relaxada.'
          }]
        },
        {
          dayOffset: 6,
          dayOfWeek: 'DOMINGO',
          workouts: [{
            name: 'Descanso Completo',
            category: 'DESCANSO',
            sport: 'RUNNING',
            time: '08:00',
            period: 'MANHA',
            targetDistanceKm: 0,
            repeatCount: 1,
            notes: 'Descanso.'
          }]
        }
      ]
    },

    // ─── SEMANA 5 (16 a 22 de novembro) ─────────────────────────────────────
    {
      weekNumber: 5,
      title: 'Semana 5 — Repetições Curtas & Limiar (~30–31 km)',
      days: [
        {
          dayOffset: 0,
          dayOfWeek: 'SEGUNDA',
          workouts: [{
            name: '5 km Leve',
            category: 'LEVE',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 5,
            targetPaceMin: '5:10',
            targetPaceMax: '5:50',
            repeatCount: 1,
            notes: '5 km leves.'
          }]
        },
        {
          dayOffset: 1,
          dayOfWeek: 'TERCA',
          workouts: [{
            name: '6.5 km Total: 2 km Aquec. + 5× 400m (4:00–4:15/km) + Desaquec.',
            category: 'TIROS',
            sport: 'RUNNING',
            time: '06:30',
            period: 'MANHA',
            targetDistanceKm: 6.5,
            targetPaceMin: '4:00',
            targetPaceMax: '4:15',
            repeatCount: 5,
            notes: '6–7 km total: 2 km leves + 5 × 400 m a 4:00–4:15/km, com 200 m de trote entre repetições + desaquecimento.'
          }]
        },
        {
          dayOffset: 2,
          dayOfWeek: 'QUARTA',
          workouts: [{
            name: '4 km Regenerativo',
            category: 'REGENERATIVO',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 4,
            targetPaceMin: '5:25',
            targetPaceMax: '6:00',
            repeatCount: 1,
            notes: '4 km regenerativos.'
          }]
        },
        {
          dayOffset: 3,
          dayOfWeek: 'QUINTA',
          workouts: [{
            name: '5 km Leve + 6× 20s Acelerações Relaxadas',
            category: 'LEVE',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 5,
            targetPaceMin: '5:10',
            targetPaceMax: '5:50',
            repeatCount: 6,
            notes: '5 km leves + 6 × 20 s de aceleração relaxada.'
          }]
        },
        {
          dayOffset: 4,
          dayOfWeek: 'SEXTA',
          workouts: [{
            name: '4 km Regenerativo',
            category: 'REGENERATIVO',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 4,
            targetPaceMin: '5:25',
            targetPaceMax: '6:00',
            repeatCount: 1,
            notes: '4 km regenerativos.'
          }]
        },
        {
          dayOffset: 5,
          dayOfWeek: 'SABADO',
          workouts: [{
            name: '6 km Total, incluindo 6× 1 min Moderado (Rec. 2 min)',
            category: 'FARTLEK',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 6,
            targetPaceMin: '4:40',
            targetPaceMax: '5:00',
            repeatCount: 6,
            notes: '6 km total, incluindo 6 × 1 min moderado com 2 min de trote.'
          }]
        },
        {
          dayOffset: 6,
          dayOfWeek: 'DOMINGO',
          workouts: [{
            name: 'Descanso Completo',
            category: 'DESCANSO',
            sport: 'RUNNING',
            time: '08:00',
            period: 'MANHA',
            targetDistanceKm: 0,
            repeatCount: 1,
            notes: 'Descanso.'
          }]
        }
      ]
    },

    // ─── SEMANA 6 (23 a 29 de novembro) ─────────────────────────────────────
    {
      weekNumber: 6,
      title: 'Semana 6 — Consistência de Esforço (~30–31 km)',
      days: [
        {
          dayOffset: 0,
          dayOfWeek: 'SEGUNDA',
          workouts: [{
            name: '5 km Leve',
            category: 'LEVE',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 5,
            targetPaceMin: '5:10',
            targetPaceMax: '5:50',
            repeatCount: 1,
            notes: '5 km leves.'
          }]
        },
        {
          dayOffset: 1,
          dayOfWeek: 'TERCA',
          workouts: [{
            name: '6.5 km Total: 2 km Aquec. + 4× 600m (4:00–4:15/km) + Desaquec.',
            category: 'TIROS',
            sport: 'RUNNING',
            time: '06:30',
            period: 'MANHA',
            targetDistanceKm: 6.5,
            targetPaceMin: '4:00',
            targetPaceMax: '4:15',
            repeatCount: 4,
            notes: '6–7 km total: 2 km leves + 4 × 600 m a 4:00–4:15/km, recuperando 2–3 min de trote + desaquecimento.'
          }]
        },
        {
          dayOffset: 2,
          dayOfWeek: 'QUARTA',
          workouts: [{
            name: '4 km Regenerativo',
            category: 'REGENERATIVO',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 4,
            targetPaceMin: '5:25',
            targetPaceMax: '6:00',
            repeatCount: 1,
            notes: '4 km regenerativos.'
          }]
        },
        {
          dayOffset: 3,
          dayOfWeek: 'QUINTA',
          workouts: [{
            name: '5 km Leve + 4× 15s Acelerações',
            category: 'LEVE',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 5,
            targetPaceMin: '5:10',
            targetPaceMax: '5:50',
            repeatCount: 4,
            notes: '5 km leves + 4 acelerações de 15 s.'
          }]
        },
        {
          dayOffset: 4,
          dayOfWeek: 'SEXTA',
          workouts: [{
            name: '4 km Regenerativo',
            category: 'REGENERATIVO',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 4,
            targetPaceMin: '5:25',
            targetPaceMax: '6:00',
            repeatCount: 1,
            notes: '4 km regenerativos.'
          }]
        },
        {
          dayOffset: 5,
          dayOfWeek: 'SABADO',
          workouts: [{
            name: '6 km Leve com 6× 30s Vivos e Relaxados (Rec. 90s)',
            category: 'FARTLEK',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 6,
            targetPaceMin: '4:30',
            targetPaceMax: '4:50',
            repeatCount: 6,
            notes: '6 km leves, com 6 × 30 s vivos e relaxados, recuperando 90 s de trote.'
          }]
        },
        {
          dayOffset: 6,
          dayOfWeek: 'DOMINGO',
          workouts: [{
            name: 'Descanso Completo',
            category: 'DESCANSO',
            sport: 'RUNNING',
            time: '08:00',
            period: 'MANHA',
            targetDistanceKm: 0,
            repeatCount: 1,
            notes: 'Descanso.'
          }]
        }
      ]
    },

    // ─── SEMANA 7 (30 de novembro a 6 de dezembro) ──────────────────────────
    {
      weekNumber: 7,
      title: 'Semana 7 — Ritmo Específico & Qualidade (~30–31 km)',
      days: [
        {
          dayOffset: 0,
          dayOfWeek: 'SEGUNDA',
          workouts: [{
            name: '5 km Leve',
            category: 'LEVE',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 5,
            targetPaceMin: '5:10',
            targetPaceMax: '5:50',
            repeatCount: 1,
            notes: '5 km leves.'
          }]
        },
        {
          dayOffset: 1,
          dayOfWeek: 'TERCA',
          workouts: [{
            name: '6.5 km Total: 2 km Aquec. + 6× 400m (4:00–4:15/km) + Desaquec.',
            category: 'TIROS',
            sport: 'RUNNING',
            time: '06:30',
            period: 'MANHA',
            targetDistanceKm: 6.5,
            targetPaceMin: '4:00',
            targetPaceMax: '4:15',
            repeatCount: 6,
            notes: '6–7 km total: 2 km leves + 6 × 400 m a 4:00–4:15/km, com 200 m de trote + desaquecimento.'
          }]
        },
        {
          dayOffset: 2,
          dayOfWeek: 'QUARTA',
          workouts: [{
            name: '4 km Regenerativo',
            category: 'REGENERATIVO',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 4,
            targetPaceMin: '5:25',
            targetPaceMax: '6:00',
            repeatCount: 1,
            notes: '4 km regenerativos.'
          }]
        },
        {
          dayOffset: 3,
          dayOfWeek: 'QUINTA',
          workouts: [{
            name: '5 km Leve + 4× 15s Acelerações',
            category: 'LEVE',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 5,
            targetPaceMin: '5:10',
            targetPaceMax: '5:50',
            repeatCount: 4,
            notes: '5 km leves + 4 acelerações de 15 s.'
          }]
        },
        {
          dayOffset: 4,
          dayOfWeek: 'SEXTA',
          workouts: [{
            name: '4 km Regenerativo',
            category: 'REGENERATIVO',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 4,
            targetPaceMin: '5:25',
            targetPaceMax: '6:00',
            repeatCount: 1,
            notes: '4 km regenerativos.'
          }]
        },
        {
          dayOffset: 5,
          dayOfWeek: 'SABADO',
          workouts: [{
            name: '6 km Total: 4× 2 min Moderados (Rec. 2 min) + Soltura',
            category: 'FARTLEK',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 6,
            targetPaceMin: '4:40',
            targetPaceMax: '5:00',
            repeatCount: 4,
            notes: '6 km total, com 4 × 2 min moderados e 2 min de trote entre repetições.'
          }]
        },
        {
          dayOffset: 6,
          dayOfWeek: 'DOMINGO',
          workouts: [{
            name: 'Descanso Completo',
            category: 'DESCANSO',
            sport: 'RUNNING',
            time: '08:00',
            period: 'MANHA',
            targetDistanceKm: 0,
            repeatCount: 1,
            notes: 'Descanso.'
          }]
        }
      ]
    },

    // ─── SEMANA 8 (7 a 13 de dezembro) ──────────────────────────────────────
    {
      weekNumber: 8,
      title: 'Semana 8 — Semana de Consolidação & Alívio (~28–29 km)',
      days: [
        {
          dayOffset: 0,
          dayOfWeek: 'SEGUNDA',
          workouts: [{
            name: '5 km Leve',
            category: 'LEVE',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 5,
            targetPaceMin: '5:10',
            targetPaceMax: '5:50',
            repeatCount: 1,
            notes: '5 km leves.'
          }]
        },
        {
          dayOffset: 1,
          dayOfWeek: 'TERCA',
          workouts: [{
            name: '5.5 km Leve com 4× 1 min Moderado (Rec. 2 min)',
            category: 'FARTLEK',
            sport: 'RUNNING',
            time: '06:30',
            period: 'MANHA',
            targetDistanceKm: 5.5,
            targetPaceMin: '4:40',
            targetPaceMax: '5:00',
            repeatCount: 4,
            notes: '5–6 km leves, com 4 × 1 min moderados e 2 min de trote.'
          }]
        },
        {
          dayOffset: 2,
          dayOfWeek: 'QUARTA',
          workouts: [{
            name: '4 km Regenerativo',
            category: 'REGENERATIVO',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 4,
            targetPaceMin: '5:25',
            targetPaceMax: '6:00',
            repeatCount: 1,
            notes: '4 km regenerativos.'
          }]
        },
        {
          dayOffset: 3,
          dayOfWeek: 'QUINTA',
          workouts: [{
            name: '5 km Leve',
            category: 'LEVE',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 5,
            targetPaceMin: '5:10',
            targetPaceMax: '5:50',
            repeatCount: 1,
            notes: '5 km leves.'
          }]
        },
        {
          dayOffset: 4,
          dayOfWeek: 'SEXTA',
          workouts: [{
            name: '4 km Regenerativo',
            category: 'REGENERATIVO',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 4,
            targetPaceMin: '5:25',
            targetPaceMax: '6:00',
            repeatCount: 1,
            notes: '4 km regenerativos.'
          }]
        },
        {
          dayOffset: 5,
          dayOfWeek: 'SABADO',
          workouts: [{
            name: '5 km Leve + 4× 15s Acelerações Relaxadas',
            category: 'LEVE',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 5,
            targetPaceMin: '5:10',
            targetPaceMax: '5:50',
            repeatCount: 4,
            notes: '5 km leves + 4 acelerações relaxadas de 15 s.'
          }]
        },
        {
          dayOffset: 6,
          dayOfWeek: 'DOMINGO',
          workouts: [{
            name: 'Descanso Completo',
            category: 'DESCANSO',
            sport: 'RUNNING',
            time: '08:00',
            period: 'MANHA',
            targetDistanceKm: 0,
            repeatCount: 1,
            notes: 'Descanso.'
          }]
        }
      ]
    },

    // ─── SEMANA 9 (14 a 20 de dezembro) ─────────────────────────────────────
    {
      weekNumber: 9,
      title: 'Semana 9 — Intensidade Específica 5 km (~30–31 km)',
      days: [
        {
          dayOffset: 0,
          dayOfWeek: 'SEGUNDA',
          workouts: [{
            name: '5 km Leve',
            category: 'LEVE',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 5,
            targetPaceMin: '5:10',
            targetPaceMax: '5:50',
            repeatCount: 1,
            notes: '5 km leves.'
          }]
        },
        {
          dayOffset: 1,
          dayOfWeek: 'TERCA',
          workouts: [{
            name: '6.5 km Total: 2 km Aquec. + 4× 600m (3:55–4:10/km) + Desaquec.',
            category: 'TIROS',
            sport: 'RUNNING',
            time: '06:30',
            period: 'MANHA',
            targetDistanceKm: 6.5,
            targetPaceMin: '3:55',
            targetPaceMax: '4:10',
            repeatCount: 4,
            notes: '6–7 km total: 2 km leves + 4 × 600 m a 3:55–4:10/km, recuperando 2–3 min de trote + desaquecimento.'
          }]
        },
        {
          dayOffset: 2,
          dayOfWeek: 'QUARTA',
          workouts: [{
            name: '4 km Regenerativo',
            category: 'REGENERATIVO',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 4,
            targetPaceMin: '5:25',
            targetPaceMax: '6:00',
            repeatCount: 1,
            notes: '4 km regenerativos.'
          }]
        },
        {
          dayOffset: 3,
          dayOfWeek: 'QUINTA',
          workouts: [{
            name: '5 km Leve + 4× 15s Acelerações',
            category: 'LEVE',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 5,
            targetPaceMin: '5:10',
            targetPaceMax: '5:50',
            repeatCount: 4,
            notes: '5 km leves + 4 acelerações de 15 s.'
          }]
        },
        {
          dayOffset: 4,
          dayOfWeek: 'SEXTA',
          workouts: [{
            name: '4 km Regenerativo',
            category: 'REGENERATIVO',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 4,
            targetPaceMin: '5:25',
            targetPaceMax: '6:00',
            repeatCount: 1,
            notes: '4 km regenerativos.'
          }]
        },
        {
          dayOffset: 5,
          dayOfWeek: 'SABADO',
          workouts: [{
            name: '6 km Total: 6× 1 min Moderado (Rec. 2 min) + Soltura',
            category: 'FARTLEK',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 6,
            targetPaceMin: '4:40',
            targetPaceMax: '5:00',
            repeatCount: 6,
            notes: '6 km total, com 6 × 1 min moderados e 2 min de trote.'
          }]
        },
        {
          dayOffset: 6,
          dayOfWeek: 'DOMINGO',
          workouts: [{
            name: 'Descanso Completo',
            category: 'DESCANSO',
            sport: 'RUNNING',
            time: '08:00',
            period: 'MANHA',
            targetDistanceKm: 0,
            repeatCount: 1,
            notes: 'Descanso.'
          }]
        }
      ]
    },

    // ─── SEMANA 10 (21 a 27 de dezembro) ────────────────────────────────────
    {
      weekNumber: 10,
      title: 'Semana 10 — Regularidade & Séries Longas (~28–31 km)',
      days: [
        {
          dayOffset: 0,
          dayOfWeek: 'SEGUNDA',
          workouts: [{
            name: '5 km Leve',
            category: 'LEVE',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 5,
            targetPaceMin: '5:10',
            targetPaceMax: '5:50',
            repeatCount: 1,
            notes: '5 km leves.'
          }]
        },
        {
          dayOffset: 1,
          dayOfWeek: 'TERCA',
          workouts: [{
            name: '6.5 km Total: 2 km Aquec. + 3× 800m (4:00–4:15/km) + Desaquec.',
            category: 'TIROS',
            sport: 'RUNNING',
            time: '06:30',
            period: 'MANHA',
            targetDistanceKm: 6.5,
            targetPaceMin: '4:00',
            targetPaceMax: '4:15',
            repeatCount: 3,
            notes: '6–7 km total: 2 km leves + 3 × 800 m a 4:00–4:15/km, recuperando 2–3 min de trote + desaquecimento.'
          }]
        },
        {
          dayOffset: 2,
          dayOfWeek: 'QUARTA',
          workouts: [{
            name: '4 km Regenerativo',
            category: 'REGENERATIVO',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 4,
            targetPaceMin: '5:25',
            targetPaceMax: '6:00',
            repeatCount: 1,
            notes: '4 km regenerativos.'
          }]
        },
        {
          dayOffset: 3,
          dayOfWeek: 'QUINTA',
          workouts: [{
            name: '4.5 km Leve',
            category: 'LEVE',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 4.5,
            targetPaceMin: '5:10',
            targetPaceMax: '5:50',
            repeatCount: 1,
            notes: '4–5 km leves.'
          }]
        },
        {
          dayOffset: 4,
          dayOfWeek: 'SEXTA',
          workouts: [{
            name: '4 km Regenerativo (ou Descanso)',
            category: 'REGENERATIVO',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 4,
            targetPaceMin: '5:25',
            targetPaceMax: '6:00',
            repeatCount: 1,
            notes: '4 km regenerativos, ou descanso se a rotina familiar exigir.'
          }]
        },
        {
          dayOffset: 5,
          dayOfWeek: 'SABADO',
          workouts: [{
            name: '5.5 km Leve com 5× 20s Acelerações Relaxadas',
            category: 'LEVE',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 5.5,
            targetPaceMin: '5:10',
            targetPaceMax: '5:50',
            repeatCount: 5,
            notes: '5–6 km leves, incluindo 4–6 acelerações relaxadas de 20 s.'
          }]
        },
        {
          dayOffset: 6,
          dayOfWeek: 'DOMINGO',
          workouts: [{
            name: 'Descanso Completo',
            category: 'DESCANSO',
            sport: 'RUNNING',
            time: '08:00',
            period: 'MANHA',
            targetDistanceKm: 0,
            repeatCount: 1,
            notes: 'Descanso.'
          }]
        }
      ]
    },

    // ─── SEMANA 11 (28 de dezembro a 3 de janeiro) ──────────────────────────
    {
      weekNumber: 11,
      title: 'Semana 11 — Polimento & Qualidade (~28–31 km)',
      days: [
        {
          dayOffset: 0,
          dayOfWeek: 'SEGUNDA',
          workouts: [{
            name: '5 km Leve',
            category: 'LEVE',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 5,
            targetPaceMin: '5:10',
            targetPaceMax: '5:50',
            repeatCount: 1,
            notes: '5 km leves.'
          }]
        },
        {
          dayOffset: 1,
          dayOfWeek: 'TERCA',
          workouts: [{
            name: '6.5 km Total: 2 km Aquec. + 5× 400m (3:55–4:10/km) + Desaquec.',
            category: 'TIROS',
            sport: 'RUNNING',
            time: '06:30',
            period: 'MANHA',
            targetDistanceKm: 6.5,
            targetPaceMin: '3:55',
            targetPaceMax: '4:10',
            repeatCount: 5,
            notes: '6–7 km total: 2 km leves + 5 × 400 m a 3:55–4:10/km, com 200 m de trote + desaquecimento.'
          }]
        },
        {
          dayOffset: 2,
          dayOfWeek: 'QUARTA',
          workouts: [{
            name: '4 km Regenerativo',
            category: 'REGENERATIVO',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 4,
            targetPaceMin: '5:25',
            targetPaceMax: '6:00',
            repeatCount: 1,
            notes: '4 km regenerativos.'
          }]
        },
        {
          dayOffset: 3,
          dayOfWeek: 'QUINTA',
          workouts: [{
            name: '4.5 km Leve',
            category: 'LEVE',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 4.5,
            targetPaceMin: '5:10',
            targetPaceMax: '5:50',
            repeatCount: 1,
            notes: '4–5 km leves.'
          }]
        },
        {
          dayOffset: 4,
          dayOfWeek: 'SEXTA',
          workouts: [{
            name: '4 km Regenerativo (ou Descanso Adicional)',
            category: 'REGENERATIVO',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 4,
            targetPaceMin: '5:25',
            targetPaceMax: '6:00',
            repeatCount: 1,
            notes: '4 km regenerativos, ou descanso adicional se necessário.'
          }]
        },
        {
          dayOffset: 5,
          dayOfWeek: 'SABADO',
          workouts: [{
            name: '5.5 km Total: 4× 2 min Moderados (Rec. 2 min) + Soltura',
            category: 'FARTLEK',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 5.5,
            targetPaceMin: '4:40',
            targetPaceMax: '5:00',
            repeatCount: 4,
            notes: '5–6 km total, incluindo 4 × 2 min moderados, com 2 min de trote.'
          }]
        },
        {
          dayOffset: 6,
          dayOfWeek: 'DOMINGO',
          workouts: [{
            name: 'Descanso Completo',
            category: 'DESCANSO',
            sport: 'RUNNING',
            time: '08:00',
            period: 'MANHA',
            targetDistanceKm: 0,
            repeatCount: 1,
            notes: 'Descanso.'
          }]
        }
      ]
    },

    // ─── SEMANA 12 (4 a 10 de janeiro) ──────────────────────────────────────
    {
      weekNumber: 12,
      title: 'Semana 12 — Redução de Carga & Polimento Final (~26–29 km)',
      days: [
        {
          dayOffset: 0,
          dayOfWeek: 'SEGUNDA',
          workouts: [{
            name: '5 km Leve',
            category: 'LEVE',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 5,
            targetPaceMin: '5:10',
            targetPaceMax: '5:50',
            repeatCount: 1,
            notes: '5 km leves.'
          }]
        },
        {
          dayOffset: 1,
          dayOfWeek: 'TERCA',
          workouts: [{
            name: '5.5 km Total: 2 km Aquec. + 4× 400m (4:00–4:15/km) + Desaquec.',
            category: 'TIROS',
            sport: 'RUNNING',
            time: '06:30',
            period: 'MANHA',
            targetDistanceKm: 5.5,
            targetPaceMin: '4:00',
            targetPaceMax: '4:15',
            repeatCount: 4,
            notes: '5–6 km total: 2 km leves + 4 × 400 m a 4:00–4:15/km, com 200 m de trote + desaquecimento.'
          }]
        },
        {
          dayOffset: 2,
          dayOfWeek: 'QUARTA',
          workouts: [{
            name: '4 km Regenerativo',
            category: 'REGENERATIVO',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 4,
            targetPaceMin: '5:25',
            targetPaceMax: '6:00',
            repeatCount: 1,
            notes: '4 km regenerativos.'
          }]
        },
        {
          dayOffset: 3,
          dayOfWeek: 'QUINTA',
          workouts: [{
            name: '4.5 km Leve + 4× 15s Acelerações Relaxadas',
            category: 'LEVE',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 4.5,
            targetPaceMin: '5:10',
            targetPaceMax: '5:50',
            repeatCount: 4,
            notes: '4–5 km leves + 4 acelerações relaxadas de 15 s.'
          }]
        },
        {
          dayOffset: 4,
          dayOfWeek: 'SEXTA',
          workouts: [{
            name: '4 km Regenerativo',
            category: 'REGENERATIVO',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 4,
            targetPaceMin: '5:25',
            targetPaceMax: '6:00',
            repeatCount: 1,
            notes: '4 km regenerativos.'
          }]
        },
        {
          dayOffset: 5,
          dayOfWeek: 'SABADO',
          workouts: [{
            name: '4.5 km Leve (Soltura Pré-Prova)',
            category: 'LEVE',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 4.5,
            targetPaceMin: '5:10',
            targetPaceMax: '5:50',
            repeatCount: 1,
            notes: '4–5 km leves bem soltos.'
          }]
        },
        {
          dayOffset: 6,
          dayOfWeek: 'DOMINGO',
          workouts: [{
            name: 'Descanso Completo / Prova 5 km',
            category: 'DESCANSO',
            sport: 'RUNNING',
            time: '08:00',
            period: 'MANHA',
            targetDistanceKm: 0,
            repeatCount: 1,
            notes: 'Descanso total ou dia do Desafio / Prova dos 5 km!'
          }]
        }
      ]
    },

    // ─── SEMANA 13 (Complementar — 11 a 17 de janeiro) ──────────────────────
    {
      weekNumber: 13,
      title: 'Semana Complementar — Recuperação & Avaliação (~20 km)',
      days: [
        {
          dayOffset: 0,
          dayOfWeek: 'SEGUNDA',
          workouts: [{
            name: '4.5 km Leve',
            category: 'LEVE',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 4.5,
            targetPaceMin: '5:10',
            targetPaceMax: '5:50',
            repeatCount: 1,
            notes: '4–5 km leves.'
          }]
        },
        {
          dayOffset: 1,
          dayOfWeek: 'TERCA',
          workouts: [{
            name: '5 km Total, incluindo 4× 1 min Moderados (Rec. 2 min)',
            category: 'FARTLEK',
            sport: 'RUNNING',
            time: '06:30',
            period: 'MANHA',
            targetDistanceKm: 5,
            targetPaceMin: '4:40',
            targetPaceMax: '5:00',
            repeatCount: 4,
            notes: '5 km total, incluindo 4 × 1 min moderados, com 2 min de trote.'
          }]
        },
        {
          dayOffset: 2,
          dayOfWeek: 'QUARTA',
          workouts: [{
            name: '4 km Regenerativo',
            category: 'REGENERATIVO',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 4,
            targetPaceMin: '5:25',
            targetPaceMax: '6:00',
            repeatCount: 1,
            notes: '4 km regenerativos.'
          }]
        },
        {
          dayOffset: 3,
          dayOfWeek: 'QUINTA',
          workouts: [{
            name: '4 km Leve + 4× 15s Acelerações',
            category: 'LEVE',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 4,
            targetPaceMin: '5:10',
            targetPaceMax: '5:50',
            repeatCount: 4,
            notes: '4 km leves + 4 acelerações relaxadas de 15 s.'
          }]
        },
        {
          dayOffset: 4,
          dayOfWeek: 'SEXTA',
          workouts: [{
            name: 'Descanso ou 3 km Regenerativo',
            category: 'REGENERATIVO',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 3,
            targetPaceMin: '5:25',
            targetPaceMax: '6:00',
            repeatCount: 1,
            notes: 'Descanso ou 3 km regenerativos bem leves.'
          }]
        },
        {
          dayOffset: 5,
          dayOfWeek: 'SABADO',
          workouts: [{
            name: '3 km Leve (Apenas se Descansado)',
            category: 'LEVE',
            sport: 'RUNNING',
            time: '07:00',
            period: 'MANHA',
            targetDistanceKm: 3,
            targetPaceMin: '5:10',
            targetPaceMax: '5:50',
            repeatCount: 1,
            notes: '3 km leves, apenas se estiver descansado.'
          }]
        },
        {
          dayOffset: 6,
          dayOfWeek: 'DOMINGO',
          workouts: [{
            name: 'Descanso Completo',
            category: 'DESCANSO',
            sport: 'RUNNING',
            time: '08:00',
            period: 'MANHA',
            targetDistanceKm: 0,
            repeatCount: 1,
            notes: 'Descanso.'
          }]
        }
      ]
    }
  ]
};
