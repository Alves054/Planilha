import { Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { calculateWorkoutEstimatedDistance } from '../engine/workoutEngine.js';

export async function createWorkout(req: Request, res: Response) {
  try {
    const {
      trainingDayId,
      time,
      period,
      sport,
      category,
      name,
      targetDistanceKm,
      targetPaceMin,
      targetPaceMax,
      targetHeartRateZone,
      repeatCount,
      notes,
      steps
    } = req.body;

    if (!trainingDayId || !name) {
      return res.status(400).json({ error: 'Dia do treino e nome são obrigatórios.' });
    }

    const estimatedDist = calculateWorkoutEstimatedDistance({
      trainingDayId: String(trainingDayId),
      name: String(name),
      targetDistanceKm: targetDistanceKm ? parseFloat(targetDistanceKm) : null,
      targetPaceMin: targetPaceMin ? String(targetPaceMin) : null,
      targetPaceMax: targetPaceMax ? String(targetPaceMax) : null,
      repeatCount: repeatCount ? parseInt(repeatCount, 10) : 1,
      steps: steps || []
    });

    const workout = await prisma.workout.create({
      data: {
        trainingDayId: String(trainingDayId),
        time: time ? String(time) : '07:00',
        period: period ? String(period) : 'MANHA',
        sport: sport ? String(sport) : 'RUNNING',
        category: category ? String(category) : 'LEVE',
        name: String(name),
        targetDistanceKm: targetDistanceKm ? parseFloat(targetDistanceKm) : null,
        estimatedDistanceKm: estimatedDist,
        targetPaceMin: targetPaceMin ? String(targetPaceMin) : null,
        targetPaceMax: targetPaceMax ? String(targetPaceMax) : null,
        targetHeartRateZone: targetHeartRateZone ? String(targetHeartRateZone) : null,
        repeatCount: repeatCount ? parseInt(repeatCount, 10) : 1,
        notes: notes ? String(notes) : null,
        syncStatus: 'RASCUNHO',
        steps: steps && Array.isArray(steps) && steps.length > 0 ? {
          create: steps.map((s: any, idx: number) => ({
            stepOrder: idx + 1,
            stepType: s.stepType || 'RUN',
            durationType: s.durationType || 'TIME',
            durationValue: parseFloat(s.durationValue) || 60,
            targetType: s.targetType || 'PACE',
            targetMin: s.targetMin || null,
            targetMax: s.targetMax || null,
            notes: s.notes || null
          }))
        } : undefined
      },
      include: {
        steps: { orderBy: { stepOrder: 'asc' } }
      }
    });

    return res.status(201).json(workout);
  } catch (error) {
    console.error('Erro ao criar treino:', error);
    return res.status(500).json({ error: 'Erro interno ao criar treino.' });
  }
}

export async function updateWorkout(req: Request, res: Response) {
  try {
    const workoutId = String(req.params.id);
    const {
      time,
      period,
      sport,
      category,
      name,
      targetDistanceKm,
      targetPaceMin,
      targetPaceMax,
      targetHeartRateZone,
      repeatCount,
      notes,
      syncStatus,
      steps
    } = req.body;

    const existing = await prisma.workout.findUnique({ where: { id: workoutId } });
    if (!existing) {
      return res.status(404).json({ error: 'Treino não encontrado.' });
    }

    const estimatedDist = calculateWorkoutEstimatedDistance({
      trainingDayId: existing.trainingDayId,
      name: name ? String(name) : existing.name,
      targetDistanceKm: targetDistanceKm !== undefined ? (targetDistanceKm ? parseFloat(targetDistanceKm) : null) : existing.targetDistanceKm,
      targetPaceMin: targetPaceMin !== undefined ? (targetPaceMin ? String(targetPaceMin) : null) : existing.targetPaceMin,
      targetPaceMax: targetPaceMax !== undefined ? (targetPaceMax ? String(targetPaceMax) : null) : existing.targetPaceMax,
      repeatCount: repeatCount ? parseInt(repeatCount, 10) : existing.repeatCount,
      steps: steps || []
    });

    let newSyncStatus = syncStatus ? String(syncStatus) : existing.syncStatus;
    if (existing.syncStatus === 'SINCRONIZADO' && !syncStatus) {
      newSyncStatus = 'PRONTO_PARA_SINCRONIZAR';
    }

    if (steps && Array.isArray(steps)) {
      await prisma.workoutStep.deleteMany({ where: { workoutId } });
    }

    const updated = await prisma.workout.update({
      where: { id: workoutId },
      data: {
        time: time !== undefined ? (time ? String(time) : null) : existing.time,
        period: period ? String(period) : existing.period,
        sport: sport ? String(sport) : existing.sport,
        category: category ? String(category) : existing.category,
        name: name ? String(name) : existing.name,
        targetDistanceKm: targetDistanceKm !== undefined ? (targetDistanceKm ? parseFloat(targetDistanceKm) : null) : existing.targetDistanceKm,
        estimatedDistanceKm: estimatedDist,
        targetPaceMin: targetPaceMin !== undefined ? (targetPaceMin ? String(targetPaceMin) : null) : existing.targetPaceMin,
        targetPaceMax: targetPaceMax !== undefined ? (targetPaceMax ? String(targetPaceMax) : null) : existing.targetPaceMax,
        targetHeartRateZone: targetHeartRateZone !== undefined ? (targetHeartRateZone ? String(targetHeartRateZone) : null) : existing.targetHeartRateZone,
        repeatCount: repeatCount ? parseInt(repeatCount, 10) : existing.repeatCount,
        notes: notes !== undefined ? (notes ? String(notes) : null) : existing.notes,
        syncStatus: newSyncStatus,
        steps: steps && Array.isArray(steps) ? {
          create: steps.map((s: any, idx: number) => ({
            stepOrder: idx + 1,
            stepType: s.stepType || 'RUN',
            durationType: s.durationType || 'TIME',
            durationValue: parseFloat(s.durationValue) || 60,
            targetType: s.targetType || 'PACE',
            targetMin: s.targetMin || null,
            targetMax: s.targetMax || null,
            notes: s.notes || null
          }))
        } : undefined
      },
      include: { steps: { orderBy: { stepOrder: 'asc' } } }
    });

    return res.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar treino:', error);
    return res.status(500).json({ error: 'Erro interno ao atualizar treino.' });
  }
}

export async function deleteWorkout(req: Request, res: Response) {
  try {
    const workoutId = String(req.params.id);
    await prisma.workout.delete({ where: { id: workoutId } });
    return res.json({ message: 'Treino excluído com sucesso.' });
  } catch (error) {
    console.error('Erro ao deletar treino:', error);
    return res.status(500).json({ error: 'Erro interno ao deletar treino.' });
  }
}

export async function duplicateWorkout(req: Request, res: Response) {
  try {
    const workoutId = String(req.params.id);
    const { targetTrainingDayId, targetTime, targetPeriod } = req.body;

    const source = await prisma.workout.findUnique({
      where: { id: workoutId },
      include: { steps: true }
    });

    if (!source) {
      return res.status(404).json({ error: 'Treino de origem não encontrado.' });
    }

    const duplicated = await prisma.workout.create({
      data: {
        trainingDayId: targetTrainingDayId ? String(targetTrainingDayId) : source.trainingDayId,
        time: targetTime ? String(targetTime) : source.time,
        period: targetPeriod ? String(targetPeriod) : source.period,
        sport: source.sport,
        category: source.category,
        name: `${source.name} (Cópia)`,
        targetDistanceKm: source.targetDistanceKm,
        estimatedDistanceKm: source.estimatedDistanceKm,
        targetPaceMin: source.targetPaceMin,
        targetPaceMax: source.targetPaceMax,
        targetHeartRateZone: source.targetHeartRateZone,
        repeatCount: source.repeatCount,
        notes: source.notes,
        syncStatus: 'RASCUNHO',
        steps: {
          create: source.steps.map((s: any) => ({
            stepOrder: s.stepOrder,
            stepType: s.stepType,
            durationType: s.durationType,
            durationValue: s.durationValue,
            targetType: s.targetType,
            targetMin: s.targetMin,
            targetMax: s.targetMax,
            notes: s.notes
          }))
        }
      },
      include: { steps: true }
    });

    return res.status(201).json(duplicated);
  } catch (error) {
    console.error('Erro ao duplicar treino:', error);
    return res.status(500).json({ error: 'Erro interno ao duplicar treino.' });
  }
}

import fs from 'fs';
import path from 'path';

/**
 * Salva resultado de treino (manual e/ou com comprovante de imagem)
 */
export async function submitWorkoutResult(req: Request, res: Response) {
  try {
    const workoutId = String(req.params.id);
    const {
      actualDistanceKm,
      actualPace,
      actualDurationMinutes,
      actualHeartRate,
      feedback,
      proofImageUrl: bodyProofUrl,
      isCompleted
    } = req.body;

    const existing = await prisma.workout.findUnique({
      where: { id: workoutId },
      include: { trainingDay: { include: { week: { include: { user: true } } } } }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Treino não encontrado.' });
    }

    let finalProofUrl = bodyProofUrl || existing.proofImageUrl || null;

    // Se houve upload de arquivo
    const file = (req as any).file || ((req as any).files && (req as any).files[0]);
    if (file && file.buffer) {
      const ext = path.extname(file.originalname) || '.jpg';
      const filename = `proof_${workoutId}_${Date.now()}${ext}`;
      const uploadDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const fullPath = path.join(uploadDir, filename);
      fs.writeFileSync(fullPath, file.buffer);
      finalProofUrl = `/uploads/${filename}`;
    }

    const updated = await prisma.workout.update({
      where: { id: workoutId },
      data: {
        actualDistanceKm: actualDistanceKm !== undefined ? (actualDistanceKm ? parseFloat(actualDistanceKm) : null) : existing.actualDistanceKm,
        actualPace: actualPace !== undefined ? (actualPace ? String(actualPace) : null) : existing.actualPace,
        actualDurationMinutes: actualDurationMinutes !== undefined ? (actualDurationMinutes ? parseFloat(actualDurationMinutes) : null) : existing.actualDurationMinutes,
        actualHeartRate: actualHeartRate !== undefined ? (actualHeartRate ? parseInt(actualHeartRate, 10) : null) : existing.actualHeartRate,
        feedback: feedback !== undefined ? (feedback ? String(feedback) : null) : existing.feedback,
        proofImageUrl: finalProofUrl,
        isCompleted: isCompleted !== undefined ? (isCompleted === 'true' || isCompleted === true) : true,
        completedAt: new Date()
      },
      include: {
        steps: { orderBy: { stepOrder: 'asc' } },
        trainingDay: {
          include: {
            week: {
              include: { user: true }
            }
          }
        }
      }
    });

    return res.json({
      success: true,
      message: 'Resultado do treino registrado com sucesso!',
      workout: updated
    });
  } catch (error) {
    console.error('[SUBMIT WORKOUT RESULT] Erro:', error);
    return res.status(500).json({ error: 'Erro ao registrar resultado do treino.' });
  }
}

/**
 * Lista resultados de treinos para o Painel do Treinador
 */
export async function getWorkoutResults(req: Request, res: Response) {
  try {
    const { athleteId, limit } = req.query;

    const whereClause: any = {
      OR: [
        { isCompleted: true },
        { actualDistanceKm: { not: null } },
        { proofImageUrl: { not: null } }
      ]
    };

    if (athleteId) {
      whereClause.trainingDay = {
        week: {
          userId: String(athleteId)
        }
      };
    }

    const workouts = await prisma.workout.findMany({
      where: whereClause,
      include: {
        trainingDay: {
          include: {
            week: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, phone: true }
                }
              }
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: limit ? parseInt(String(limit), 10) : 50
    });

    const formatted = workouts.map(w => ({
      id: w.id,
      name: w.name,
      sport: w.sport,
      category: w.category,
      time: w.time,
      period: w.period,
      targetDistanceKm: w.targetDistanceKm,
      estimatedDistanceKm: w.estimatedDistanceKm,
      targetPaceMin: w.targetPaceMin,
      targetPaceMax: w.targetPaceMax,
      actualDistanceKm: w.actualDistanceKm,
      actualPace: w.actualPace,
      actualDurationMinutes: w.actualDurationMinutes,
      actualHeartRate: w.actualHeartRate,
      feedback: w.feedback,
      proofImageUrl: w.proofImageUrl,
      isCompleted: w.isCompleted,
      completedAt: w.completedAt,
      updatedAt: w.updatedAt,
      date: w.trainingDay.date,
      dayOfWeek: w.trainingDay.dayOfWeek,
      weekTitle: w.trainingDay.week.title,
      athlete: {
        id: w.trainingDay.week.user.id,
        name: w.trainingDay.week.user.name,
        email: w.trainingDay.week.user.email,
        phone: w.trainingDay.week.user.phone
      }
    }));

    return res.json({ results: formatted });
  } catch (error) {
    console.error('[GET WORKOUT RESULTS] Erro:', error);
    return res.status(500).json({ error: 'Erro ao buscar resultados dos treinos.' });
  }
}

/**
 * Remove resultado de treino (desmarcar conclusão)
 */
export async function resetWorkoutResult(req: Request, res: Response) {
  try {
    const workoutId = String(req.params.id);
    const updated = await prisma.workout.update({
      where: { id: workoutId },
      data: {
        actualDistanceKm: null,
        actualPace: null,
        actualDurationMinutes: null,
        actualHeartRate: null,
        feedback: null,
        proofImageUrl: null,
        isCompleted: false,
        completedAt: null
      }
    });

    return res.json({
      success: true,
      message: 'Resultado do treino revertido com sucesso.',
      workout: updated
    });
  } catch (error) {
    console.error('[RESET WORKOUT RESULT] Erro:', error);
    return res.status(500).json({ error: 'Erro ao resetar resultado.' });
  }
}
