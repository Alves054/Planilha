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
