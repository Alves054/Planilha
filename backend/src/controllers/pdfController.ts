import { Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { parsePdfTextContent } from '../services/pdf/pdfParserService.js';

export async function importPdfWorkouts(req: Request, res: Response) {
  try {
    const { startDate, textContent } = req.body;
    const targetStartDate = startDate || '2026-09-07';
    const file = (req as any).file;
    const filename = file ? file.originalname : 'planilha_treinador.pdf';

    console.log(`\n[PDF IMPORT] Iniciando importação do arquivo: ${filename}`);
    
    // 1. Parsing do conteúdo do PDF / texto
    const parsedData = parsePdfTextContent(textContent, targetStartDate);
    const totalParsed = parsedData.workouts.length;

    console.log(`[PDF IMPORT] Parsed: ${totalParsed} treinos extraídos.`);
    console.log(`[WORKOUT ENGINE] Structured: ${totalParsed} sessões estruturadas.`);

    if (totalParsed === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum treino válido pôde ser extraído do PDF.'
      });
    }

    // 2. Transação Atômica de Persistência no Banco de Dados (prisma.$transaction)
    const result = await prisma.$transaction(async (tx) => {
      let user = await tx.user.findFirst();
      if (!user) {
        user = await tx.user.create({
          data: { name: 'Paulo Henrique', email: 'paulo@pacetraining.com' }
        });
      }

      // Buscar semana existente ou criar nova
      let week = await tx.week.findFirst({
        where: { startDate: targetStartDate }
      });

      if (!week) {
        week = await tx.week.create({
          data: {
            userId: user.id,
            title: parsedData.title,
            startDate: parsedData.startDate,
            endDate: parsedData.endDate,
            plannedVolumeKm: parsedData.plannedVolumeKm,
            originalPdfVolume: parsedData.originalPdfVolume,
            status: 'EM_ANDAMENTO'
          }
        });
      } else {
        await tx.week.update({
          where: { id: week.id },
          data: {
            title: parsedData.title,
            plannedVolumeKm: parsedData.plannedVolumeKm,
            originalPdfVolume: parsedData.originalPdfVolume
          }
        });
      }

      console.log(`[WEEK] weekId: ${week.id} (${week.startDate} -> ${week.endDate})`);

      // Gerar ou atualizar os 7 dias da semana
      const daysNames = ['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO', 'DOMINGO'];
      const start = new Date(targetStartDate);
      const createdDays: Record<string, string> = {};

      for (let i = 0; i < 7; i++) {
        const current = new Date(start);
        current.setDate(start.getDate() + i);
        const dateStr = current.toISOString().split('T')[0];
        const dayName = daysNames[i];

        let dayRecord = await tx.trainingDay.findFirst({
          where: { weekId: week.id, dayOfWeek: dayName }
        });

        if (!dayRecord) {
          dayRecord = await tx.trainingDay.create({
            data: {
              weekId: week.id,
              date: dateStr,
              dayOfWeek: dayName,
              isRestDay: dayName === 'DOMINGO'
            }
          });
        }
        createdDays[dayName] = dayRecord.id;
      }

      // Se re-importação, limpa os treinos antigos dessa semana para evitar duplicatas
      await tx.workout.deleteMany({
        where: { trainingDay: { weekId: week.id } }
      });

      console.log(`[PERSIST] Attempting: Gravando ${totalParsed} treinos no banco de dados...`);
      let totalPersisted = 0;
      const createdWorkouts = [];

      for (const wSession of parsedData.workouts) {
        const dayId = createdDays[wSession.dayOfWeek];
        if (!dayId) continue;

        const workout = await tx.workout.create({
          data: {
            trainingDayId: dayId,
            time: wSession.time,
            period: wSession.period,
            category: wSession.category,
            name: wSession.name,
            targetDistanceKm: wSession.targetDistanceKm || null,
            estimatedDistanceKm: wSession.estimatedDistanceKm || null,
            targetPaceMin: wSession.targetPaceMin || null,
            targetPaceMax: wSession.targetPaceMax || null,
            repeatCount: wSession.repeatCount || 1,
            notes: wSession.notes || null,
            syncStatus: 'PRONTO_PARA_SINCRONIZAR',
            steps: wSession.steps && wSession.steps.length > 0 ? {
              create: wSession.steps.map((s) => ({
                stepOrder: s.stepOrder,
                stepType: s.stepType,
                durationType: s.durationType,
                durationValue: s.durationValue,
                targetType: s.targetType || 'PACE',
                targetMin: s.targetMin || null,
                targetMax: s.targetMax || null,
                notes: s.notes || null
              }))
            } : undefined
          },
          include: { steps: true }
        });

        totalPersisted++;
        createdWorkouts.push(workout);
      }

      console.log(`[PERSIST] Success: ${totalPersisted} treinos salvos com sucesso.`);

      // Gravar auditoria em PDFImport
      await tx.pDFImport.create({
        data: {
          userId: user.id,
          weekId: week.id,
          filename,
          totalParsed,
          totalPersisted,
          status: totalPersisted > 0 ? 'SUCCESS' : 'FAILED'
        }
      });

      if (totalPersisted === 0) {
        throw new Error('Falha na persistência: nenhum treino foi gravado no banco.');
      }

      return {
        weekId: week.id,
        totalParsed,
        totalPersisted,
        workouts: createdWorkouts
      };
    });

    return res.json({
      success: true,
      message: `${result.totalPersisted} treinos foram importados e adicionados à semana!`,
      weekId: result.weekId,
      totalParsed: result.totalParsed,
      totalPersisted: result.totalPersisted,
      workouts: result.workouts
    });

  } catch (error: any) {
    console.error('Erro na importação do PDF:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro interno ao importar PDF.'
    });
  }
}
