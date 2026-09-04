import { Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { GarminServiceFactory } from '../services/garmin/GarminServiceFactory.js';
import { generateWorkoutSyncHash } from '../services/garmin/garminWorkoutConverter.js';
import { GarminConnectionInfo } from '../services/garmin/GarminProvider.js';

export async function getGarminStatus(req: Request, res: Response) {
  try {
    const provider = GarminServiceFactory.getProvider();
    const mode = provider.getMode();
    const isConfigured = provider.isConfigured();

    let conn = await prisma.garminConnection.findFirst();

    if (mode === 'mock') {
      return res.json({
        id: conn?.id || 'mock-id',
        connected: true,
        accountName: 'Paulo Henrique (Garmin Mock)',
        mode: 'mock',
        isConfigured: true,
        lastSyncAt: conn?.lastSyncAt || null
      });
    }

    // Modo Production / Oficial
    return res.json({
      id: conn?.id || null,
      connected: Boolean(conn && conn.connected && conn.accessToken),
      accountName: conn?.accountName || 'Não conectado',
      mode: 'production',
      isConfigured,
      lastSyncAt: conn?.lastSyncAt || null
    });
  } catch (error) {
    console.error('Erro ao obter status do Garmin:', error);
    return res.status(500).json({ error: 'Erro ao obter status do Garmin.' });
  }
}

export async function toggleGarminMock(req: Request, res: Response) {
  try {
    // Alterna a variavel no ambiente em memoria para dev
    const currentMode = process.env.GARMIN_MODE || 'mock';
    const newMode = currentMode === 'mock' ? 'production' : 'mock';
    process.env.GARMIN_MODE = newMode;

    const provider = GarminServiceFactory.getProvider();
    return res.json({
      mode: newMode,
      isConfigured: provider.isConfigured()
    });
  } catch (error) {
    console.error('Erro ao alternar modo do Garmin:', error);
    return res.status(500).json({ error: 'Erro ao alternar modo.' });
  }
}

export async function syncWeekWorkouts(req: Request, res: Response) {
  try {
    const { weekId } = req.body;
    if (!weekId) {
      return res.status(400).json({ error: 'ID da semana é obrigatório.' });
    }

    const provider = GarminServiceFactory.getProvider();
    const mode = provider.getMode();

    if (mode === 'production' && !provider.isConfigured()) {
      return res.status(400).json({
        error: 'Integração Garmin real ainda não configurada no servidor. Defina GARMIN_CLIENT_ID e GARMIN_CLIENT_SECRET no arquivo .env.'
      });
    }

    const user = await prisma.user.findFirst();
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const dbConn = await prisma.garminConnection.findFirst({ where: { userId: user.id } });
    if (mode === 'production' && (!dbConn || !dbConn.connected || !dbConn.accessToken)) {
      return res.status(400).json({
        error: 'Sua conta Garmin Connect não está conectada. Por favor, clique em [ CONECTAR GARMIN ] para autorizar.'
      });
    }

    const connInfo: GarminConnectionInfo = {
      id: dbConn?.id,
      garminUserId: dbConn?.garminUserId || undefined,
      accountName: dbConn?.accountName || undefined,
      accessToken: dbConn?.accessToken || undefined,
      refreshToken: dbConn?.refreshToken || undefined,
      expiresAt: dbConn?.expiresAt || null,
      connected: dbConn?.connected || false,
      mode
    };

    // Buscar treinos válidos da semana (excluindo descansos puros sem workout)
    const workouts = await prisma.workout.findMany({
      where: {
        trainingDay: { weekId },
        category: { not: 'DESCANSO' }
      },
      include: {
        trainingDay: true,
        steps: { orderBy: { stepOrder: 'asc' } }
      }
    });

    if (workouts.length === 0) {
      return res.status(400).json({ error: 'Nenhum treino elegível para envio encontrado nesta semana.' });
    }

    const results = [];
    const now = new Date();

    for (const w of workouts) {
      const dateStr = w.trainingDay.date;
      const currentHash = generateWorkoutSyncHash(w);

      // Verificação Anti-Duplicação
      if (w.garminWorkoutId && w.syncHash === currentHash && w.syncStatus === 'SINCRONIZADO') {
        results.push({
          id: w.id,
          name: w.name,
          date: dateStr,
          syncStatus: 'SINCRONIZADO',
          garminWorkoutId: w.garminWorkoutId,
          message: 'Treino já estava sincronizado (sem alterações).'
        });
        continue;
      }

      // Marcar status temporário ENVIANDO
      await prisma.workout.update({
        where: { id: w.id },
        data: { syncStatus: 'ENVIANDO' }
      });

      // Executar envio via Provider
      const publishRes = await provider.publishWorkout(w, dateStr, connInfo);

      if (publishRes.status === 'SUCCESS') {
        const updated = await prisma.workout.update({
          where: { id: w.id },
          data: {
            syncStatus: 'SINCRONIZADO',
            garminWorkoutId: publishRes.garminWorkoutId,
            syncHash: publishRes.syncHash,
            lastSyncedAt: now,
            syncError: null
          }
        });

        await prisma.syncLog.create({
          data: {
            userId: user.id,
            workoutId: w.id,
            provider: mode === 'production' ? 'GARMIN_CONNECT_API' : 'GARMIN_MOCK',
            action: w.garminWorkoutId ? 'UPDATE_WORKOUT' : 'CREATE_WORKOUT',
            status: 'SUCCESS',
            message: publishRes.message,
            response: publishRes.rawResponse ? JSON.stringify(publishRes.rawResponse) : null,
            payload: JSON.stringify({ name: w.name, date: dateStr })
          }
        });

        results.push({
          id: w.id,
          name: w.name,
          date: dateStr,
          syncStatus: 'SINCRONIZADO',
          garminWorkoutId: publishRes.garminWorkoutId,
          message: publishRes.message
        });
      } else {
        await prisma.workout.update({
          where: { id: w.id },
          data: {
            syncStatus: 'ERRO',
            syncError: publishRes.message
          }
        });

        await prisma.syncLog.create({
          data: {
            userId: user.id,
            workoutId: w.id,
            provider: mode === 'production' ? 'GARMIN_CONNECT_API' : 'GARMIN_MOCK',
            action: 'CREATE_WORKOUT',
            status: 'FAILED',
            message: publishRes.message,
            error: publishRes.message
          }
        });

        results.push({
          id: w.id,
          name: w.name,
          date: dateStr,
          syncStatus: 'ERRO',
          message: publishRes.message
        });
      }
    }

    if (dbConn) {
      await prisma.garminConnection.update({
        where: { id: dbConn.id },
        data: { lastSyncAt: now }
      });
    }

    return res.json({
      message: `${results.filter(r => r.syncStatus === 'SINCRONIZADO').length} de ${results.length} treino(s) sincronizado(s) com sucesso!`,
      mode,
      syncedWorkouts: results
    });
  } catch (error: any) {
    console.error('Erro ao sincronizar semana:', error);
    return res.status(500).json({ error: error.message || 'Erro interno ao sincronizar semana com Garmin.' });
  }
}

export async function getSyncLogs(req: Request, res: Response) {
  try {
    const logs = await prisma.syncLog.findMany({
      take: 30,
      orderBy: { createdAt: 'desc' },
      include: { workout: true }
    });
    return res.json(logs);
  } catch (error) {
    console.error('Erro ao carregar logs:', error);
    return res.status(500).json({ error: 'Erro ao carregar logs.' });
  }
}
