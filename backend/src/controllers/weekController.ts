import { Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { calculateWeekMetrics } from '../engine/workoutEngine.js';

export async function getCurrentWeek(req: Request, res: Response) {
  try {
    let week = await prisma.week.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        trainingDays: {
          orderBy: { date: 'asc' },
          include: {
            workouts: {
              include: {
                steps: {
                  orderBy: { stepOrder: 'asc' }
                }
              },
              orderBy: { time: 'asc' }
            }
          }
        }
      }
    });

    if (!week) {
      return res.status(404).json({ error: 'Nenhuma semana cadastrada.' });
    }

    const metrics = calculateWeekMetrics(week);

    return res.json({
      week,
      metrics
    });
  } catch (error) {
    console.error('Erro ao buscar semana atual:', error);
    return res.status(500).json({ error: 'Erro interno ao buscar semana atual.' });
  }
}

export async function listWeeks(req: Request, res: Response) {
  try {
    const weeks = await prisma.week.findMany({
      orderBy: { startDate: 'desc' },
      include: {
        trainingDays: {
          include: {
            workouts: true
          }
        }
      }
    });

    const weeksWithMetrics = weeks.map(w => ({
      id: w.id,
      title: w.title,
      startDate: w.startDate,
      endDate: w.endDate,
      plannedVolumeKm: w.plannedVolumeKm,
      originalPdfVolume: w.originalPdfVolume,
      status: w.status,
      metrics: calculateWeekMetrics(w)
    }));

    return res.json(weeksWithMetrics);
  } catch (error) {
    console.error('Erro ao listar semanas:', error);
    return res.status(500).json({ error: 'Erro interno ao listar semanas.' });
  }
}

export async function createWeek(req: Request, res: Response) {
  try {
    const { title, startDate, endDate, plannedVolumeKm, originalPdfVolume } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Data inicial e final são obrigatórias.' });
    }

    // Buscar usuario padrao
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: { name: 'Paulo Henrique', email: 'paulo@pacetraining.com' }
      });
    }

    const week = await prisma.week.create({
      data: {
        userId: user.id,
        title: title || `Semana ${startDate}`,
        startDate,
        endDate,
        plannedVolumeKm: parseFloat(plannedVolumeKm) || 0,
        originalPdfVolume: originalPdfVolume || null,
        status: 'EM_ANDAMENTO'
      }
    });

    // Gerar 7 dias da semana automaticamente
    const daysNames = ['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO', 'DOMINGO'];
    const start = new Date(startDate);

    for (let i = 0; i < 7; i++) {
      const current = new Date(start);
      current.setDate(start.getDate() + i);
      const dateStr = current.toISOString().split('T')[0];
      const dayName = daysNames[i];

      await prisma.trainingDay.create({
        data: {
          weekId: week.id,
          date: dateStr,
          dayOfWeek: dayName,
          isRestDay: dayName === 'DOMINGO'
        }
      });
    }

    const fullWeek = await prisma.week.findUnique({
      where: { id: week.id },
      include: {
        trainingDays: {
          orderBy: { date: 'asc' },
          include: { workouts: { include: { steps: true } } }
        }
      }
    });

    return res.status(201).json(fullWeek);
  } catch (error) {
    console.error('Erro ao criar semana:', error);
    return res.status(500).json({ error: 'Erro interno ao criar semana.' });
  }
}
