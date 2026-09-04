import { prisma } from '../../prisma.js';
import { calculateWeekMetrics } from '../../engine/workoutEngine.js';

export async function buildTrainingContext(
  userId: string,
  weekId?: string | null,
  userQuery?: string
): Promise<{ contextText: string; weekTitle: string; startDate: string; endDate: string; plannedKm: number; calculatedKm: number; sessionsCount: number }> {
  // Always scope database queries by authenticated userId for privacy and user isolation
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    return {
      contextText: 'Nenhum usuário encontrado no sistema.',
      weekTitle: 'Sem Dados',
      startDate: '',
      endDate: '',
      plannedKm: 0,
      calculatedKm: 0,
      sessionsCount: 0
    };
  }

  // Localizar a semana solicitada ou a mais recente do usuário
  let currentWeek = null;
  if (weekId) {
    currentWeek = await prisma.week.findFirst({
      where: { id: weekId, userId: user.id },
      include: {
        trainingDays: {
          orderBy: { date: 'asc' },
          include: {
            workouts: {
              include: { steps: { orderBy: { stepOrder: 'asc' } } },
              orderBy: { time: 'asc' }
            }
          }
        }
      }
    });
  }

  if (!currentWeek) {
    currentWeek = await prisma.week.findFirst({
      where: { userId: user.id },
      orderBy: { startDate: 'desc' },
      include: {
        trainingDays: {
          orderBy: { date: 'asc' },
          include: {
            workouts: {
              include: { steps: { orderBy: { stepOrder: 'asc' } } },
              orderBy: { time: 'asc' }
            }
          }
        }
      }
    });
  }

  if (!currentWeek) {
    return {
      contextText: `Atleta: ${user.name} (${user.email})\nStatus: Nenhuma semana de treinos cadastrada no momento.`,
      weekTitle: 'Sem Semana Ativa',
      startDate: '',
      endDate: '',
      plannedKm: 0,
      calculatedKm: 0,
      sessionsCount: 0
    };
  }

  const metrics = calculateWeekMetrics(currentWeek);

  // Verificar se o usuário está pedindo comparação com a semana anterior
  const queryLower = (userQuery || '').toLowerCase();
  let previousWeekContext = '';
  if (queryLower.includes('passada') || queryLower.includes('anterior') || queryLower.includes('compar')) {
    const prevWeek = await prisma.week.findFirst({
      where: {
        userId: user.id,
        startDate: { lt: currentWeek.startDate }
      },
      orderBy: { startDate: 'desc' },
      include: {
        trainingDays: {
          include: { workouts: true }
        }
      }
    });

    if (prevWeek) {
      const prevMetrics = calculateWeekMetrics(prevWeek);
      previousWeekContext = `
--- DADOS DA SEMANA ANTERIOR (${prevWeek.startDate} a ${prevWeek.endDate}) ---
Título: ${prevWeek.title || 'Semana Anterior'}
Volume Planejado: ${prevWeek.originalPdfVolume || `${prevWeek.plannedVolumeKm} km`}
Volume Calculado: ${prevMetrics.totalCalculatedKm} km
Total de Sessões: ${prevMetrics.totalWorkoutsCount}
Treinos Sincronizados: ${prevMetrics.synchronizedCount}
`;
    }
  }

  // Formatação estrita do contexto da semana atual
  let daysSummaryText = '';
  for (const day of currentWeek.trainingDays) {
    daysSummaryText += `\n📅 ${day.dayOfWeek} (${day.date}):\n`;
    if (day.isRestDay || day.workouts.length === 0) {
      daysSummaryText += `  - STATUS: Dia de Descanso / Recuperação\n`;
    }

    for (const w of day.workouts) {
      const dist = w.targetDistanceKm || w.estimatedDistanceKm || 0;
      const paceInfo = w.targetPaceMin ? ` (Pace Alvo: ${w.targetPaceMin}${w.targetPaceMax ? '–' + w.targetPaceMax : ''}/km)` : '';
      const syncInfo = w.syncStatus === 'SINCRONIZADO' ? ' [SINCRONIZADO COM GARMIN CONNECT]' : ` [STATUS: ${w.syncStatus}]`;
      
      daysSummaryText += `  - SESSÃO (${w.period || 'MANHA'} - ${w.time || '07:00'}): ${w.name} — ${dist} km${paceInfo}${syncInfo}\n`;
      daysSummaryText += `    Categoria: ${w.category} | Esporte: ${w.sport}\n`;

      if (w.steps && w.steps.length > 0) {
        daysSummaryText += `    Etapas Estruturadas (${w.repeatCount > 1 ? `${w.repeatCount}x Repetições` : 'Passos'}):\n`;
        for (const s of w.steps) {
          const sPace = s.targetMin ? ` @ Pace ${s.targetMin}${s.targetMax ? '–' + s.targetMax : ''}` : '';
          const sDur = s.durationType === 'TIME' ? `${s.durationValue} segundos` : `${s.durationValue} metros`;
          daysSummaryText += `      * ${s.stepType}: ${sDur}${sPace} ${s.notes ? `(${s.notes})` : ''}\n`;
        }
      }
    }
  }

  const fullContextText = `
--- DADOS DE TREINAMENTO DO ATLETA ---
Nome: ${user.name}
Email: ${user.email}

--- SEMANA ATUAL SELECIONADA ---
ID da Semana: ${currentWeek.id}
Título: ${currentWeek.title || 'Semana Atual'}
Período: ${currentWeek.startDate} até ${currentWeek.endDate}
Volume Planejado pelo Treinador: ${currentWeek.originalPdfVolume || `${currentWeek.plannedVolumeKm} km`}
Volume Total Calculado dos Treinos: ${metrics.totalCalculatedKm} km
Total de Sessões Registradas: ${metrics.totalWorkoutsCount}
Sessões Sincronizadas no Garmin: ${metrics.synchronizedCount}
Sessões Pendentes: ${metrics.pendingCount}
Dias de Descanso: ${metrics.totalRestDays}

--- DETALHAMENTO DIÁRIO DOS TREINOS (PLANEJADO E REALIZADO) ---
${daysSummaryText}
${previousWeekContext}
`;

  return {
    contextText: fullContextText.trim(),
    weekTitle: currentWeek.title || `Semana ${currentWeek.startDate}`,
    startDate: currentWeek.startDate,
    endDate: currentWeek.endDate,
    plannedKm: currentWeek.plannedVolumeKm,
    calculatedKm: metrics.totalCalculatedKm,
    sessionsCount: metrics.totalWorkoutsCount
  };
}
