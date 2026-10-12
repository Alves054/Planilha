import { Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { calculateWeekMetrics } from '../engine/workoutEngine.js';
import { getCurrentWeekMonday, getWeekSunday, getWeekDaysConfig } from '../utils/dateUtils.js';

export async function getCurrentWeek(req: Request, res: Response) {
  try {
    const { userId, athleteId } = req.query;
    const authUser = (req as any).user;
    
    // Prioridade de identificação do atleta alvo:
    // 1. Se quem requisitou é ATHLETE autenticado, ele SEMPRE vê estritamente o próprio treino
    // 2. Se quem requisitou é COACH, ele vê o atleta selecionado (athleteId ou userId)
    let targetUserId: string | undefined;

    if (authUser?.role === 'ATHLETE') {
      targetUserId = authUser.id;
    } else {
      targetUserId = (athleteId || userId) as string | undefined;
      // Se for COACH e não especificou aluno, buscar o primeiro aluno
      if (!targetUserId) {
        const firstAthlete = await prisma.user.findFirst({
          where: { role: 'ATHLETE' },
          orderBy: { name: 'asc' }
        });
        if (firstAthlete) {
          targetUserId = firstAthlete.id;
        }
      }
    }

    if (!targetUserId) {
      return res.status(404).json({ error: 'Nenhum atleta selecionado.' });
    }

    let week = await prisma.week.findFirst({
      where: { userId: targetUserId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              paceLeve: true,
              paceModerado: true,
              paceControlado: true,
              paceTiros: true
            }
        },
        trainingDays: {
          orderBy: { date: 'asc' },
          include: {
            workouts: {
              include: {
                steps: {
                  orderBy: { stepOrder: 'asc' }
                }
              },
            }
          }
        }
      }
    });

    if (week) {
      const totalWorkouts = week.trainingDays.reduce((acc, d) => acc + d.workouts.length, 0);
      const targetMonday = getCurrentWeekMonday();
      const targetSunday = getWeekSunday(targetMonday);

      // Se a semana está vazia de treinos e com data divergente da semana atual de treino, recalibra
      if (totalWorkouts === 0 && week.startDate !== targetMonday) {
        await prisma.week.update({
          where: { id: week.id },
          data: {
            startDate: targetMonday,
            endDate: targetSunday
          }
        });

        const newDaysConfig = getWeekDaysConfig(targetMonday);
        for (const d of newDaysConfig) {
          const existingDay = week.trainingDays.find(td => td.dayOfWeek === d.dayOfWeek);
          if (existingDay) {
            await prisma.trainingDay.update({
              where: { id: existingDay.id },
              data: { date: d.date }
            });
          }
        }

        // Recarregar os dias com a nova ordenação de data
        week = await prisma.week.findUnique({
          where: { id: week.id },
          include: {
            user: {
                select: {
              id: true,
              name: true,
              email: true,
              role: true,
              paceLeve: true,
              paceModerado: true,
              paceControlado: true,
              paceTiros: true
            }
            },
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
      }
    }

    // Se o atleta ainda não tem uma semana cadastrada, cria uma semana vazia personalizada para ele
    if (!week) {
      const athleteUser = await prisma.user.findUnique({
        where: { id: targetUserId }
      });

      if (!athleteUser) {
        return res.status(404).json({ error: 'Atleta não encontrado.' });
      }

      // Criar semana inicial vazia personalizada para o atleta no fuso de Brasília
      const mondayStr = getCurrentWeekMonday();
      const sundayStr = getWeekSunday(mondayStr);

      const newWeek = await prisma.week.create({
        data: {
          userId: targetUserId,
          title: `Semana de Treinos - ${athleteUser.name}`,
          startDate: mondayStr,
          endDate: sundayStr,
          plannedVolumeKm: 0,
          status: 'EM_ANDAMENTO'
        }
      });

      const weekDays = getWeekDaysConfig(mondayStr);
      for (const d of weekDays) {
        await prisma.trainingDay.create({
          data: {
            weekId: newWeek.id,
            date: d.date,
            dayOfWeek: d.dayOfWeek,
            isRestDay: d.isRestDay
          }
        });
      }

      // Recarregar com trainingDays e workouts completos
      week = await prisma.week.findUnique({
        where: { id: newWeek.id },
        include: {
          user: {
              select: {
              id: true,
              name: true,
              email: true,
              role: true,
              paceLeve: true,
              paceModerado: true,
              paceControlado: true,
              paceTiros: true
            }
          },
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

    if (!week) {
      return res.status(404).json({ error: 'Erro ao carregar semana do atleta.' });
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
    const { title, startDate, endDate, plannedVolumeKm, originalPdfVolume, userId, athleteId } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Data inicial e final são obrigatórias.' });
    }

    const targetUserId = athleteId || userId || (req as any).user?.id;
    let user;
    if (targetUserId) {
      user = await prisma.user.findUnique({ where: { id: targetUserId } });
    }
    if (!user) {
      user = await prisma.user.findFirst({ where: { role: 'ATHLETE' } });
    }
    if (!user) {
      user = await prisma.user.create({
        data: { name: 'Paulo Henrique', email: 'paulo@pacetraining.com', role: 'ATHLETE' }
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

    // Gerar 7 dias da semana no fuso de Brasília
    const weekDays = getWeekDaysConfig(startDate);
    for (const d of weekDays) {
      await prisma.trainingDay.create({
        data: {
          weekId: week.id,
          date: d.date,
          dayOfWeek: d.dayOfWeek,
          isRestDay: d.isRestDay
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
