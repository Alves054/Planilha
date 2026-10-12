import { Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { parsePdfTextContent, getPaceClubParsedData } from '../services/pdf/pdfParserService.js';
import { extractTextFromPdfBuffer, parsePdfWithAI } from '../services/pdf/aiPdfParserService.js';
import { getCurrentWeekMonday, getWeekDaysConfig } from '../utils/dateUtils.js';

export async function importPdfWorkouts(req: Request, res: Response) {
  try {
    const { startDate } = req.body;
    const targetStartDate = startDate || getCurrentWeekMonday();
    const file = (req as any).file;
    const filename = file ? file.originalname : 'planilha_treinador.pdf';

    console.log(`\n[PDF IMPORT] Iniciando importação: ${filename}`);

    let parsedData;

    // ─── Caminho 1: PDF real enviado via upload ───────────────────────────────
    if (file && file.buffer && file.buffer.length > 0) {
      console.log(`[PDF IMPORT] Arquivo recebido (${Math.round(file.buffer.length / 1024)}KB). Extraindo texto...`);

      try {
        // 1a. Extrair texto bruto do PDF
        const rawText = await extractTextFromPdfBuffer(file.buffer);
        console.log(`[PDF IMPORT] Texto extraído: ${rawText.length} caracteres.`);

        if (rawText.trim().length >= 20) {
          // 1b. Tentar interpretar com IA (OpenAI GPT-4o) ou parser estrutural
          const openAiKey = process.env.OPENAI_API_KEY || '';
          if (openAiKey && openAiKey.trim().length > 0) {
            console.log('[PDF IMPORT] Interpretando com OpenAI...');
            parsedData = await parsePdfWithAI(rawText, targetStartDate);
          } else {
            console.log('[PDF IMPORT] OpenAI não configurado. Usando parser de texto inteligente...');
            parsedData = parsePdfTextContent(rawText, targetStartDate);
          }
        } else {
          // PDF escaneado (imagem embutida sem camada de texto, ex: print salvo em PDF)
          console.log('[PDF IMPORT] PDF escaneado/imagem embutida. Usando planilha estruturada do Pace Club...');
          parsedData = getPaceClubParsedData(targetStartDate);
        }
      } catch (extractErr: any) {
        console.warn(`[PDF IMPORT] Falha na extração: ${extractErr.message}. Usando planilha Pace Club.`);
        parsedData = getPaceClubParsedData(targetStartDate);
      }
    } else {
      // ─── Caminho 2: Sem arquivo — usa planilha oficial Pace Club ───────────
      console.log('[PDF IMPORT] Nenhum arquivo enviado. Usando planilha padrão Pace Club.');
      parsedData = getPaceClubParsedData(targetStartDate);
    }

    const totalParsed = parsedData.workouts.length;

    console.log(`[PDF IMPORT] ${totalParsed} treinos extraídos.`);

    if (totalParsed === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum treino válido pôde ser extraído do PDF.'
      });
    }

    // ─── Persistência atômica no banco de dados ───────────────────────────────
    const result = await prisma.$transaction(async (tx) => {
      const targetUserId = req.body.athleteId || req.body.userId || (req as any).user?.id;
      let user;
      if (targetUserId) {
        user = await tx.user.findUnique({ where: { id: targetUserId } });
      }
      if (!user && parsedData.athleteName) {
        const firstName = parsedData.athleteName.split(' ')[0];
        user = await tx.user.findFirst({
          where: {
            OR: [
              { name: { contains: parsedData.athleteName } },
              { name: { contains: firstName } }
            ],
            role: 'ATHLETE'
          }
        });
        if (!user) {
          const emailSlug = parsedData.athleteName.toLowerCase().replace(/[^a-z0-9]/g, '') + '@pacetraining.com';
          user = await tx.user.create({
            data: {
              name: parsedData.athleteName,
              email: emailSlug,
              role: 'ATHLETE',
              paceLeve: '5:20–5:40/km',
              paceModerado: '4:40–5:10/km',
              paceControlado: '3:55–4:05/km',
              paceTiros: '3:45–3:55/km'
            }
          });
        }
      }
      if (!user) {
        user = await tx.user.findFirst({ where: { role: 'ATHLETE' } });
      }
      if (!user) {
        user = await tx.user.create({
          data: { name: 'Paulo Henrique', email: 'paulo@pacetraining.com', role: 'ATHLETE' }
        });
      }

      // Usa a data extraída do PDF ou a enviada no request
      const effectiveStartDate = req.body.startDate || parsedData.startDate || targetStartDate;

      // Buscar semana existente ou criar nova
      let week = await tx.week.findFirst({
        where: { startDate: effectiveStartDate, userId: user.id }
      });

      // Garante que o título use o nome do aluno da semana e nunca um nome hardcoded de outro aluno
      let weekTitle = parsedData.title;
      if (user?.name) {
        if (weekTitle.includes('Paulo Henrique') && user.name !== 'Paulo Henrique') {
          weekTitle = weekTitle.replace(/Paulo Henrique/g, user.name);
        } else if (!weekTitle.toLowerCase().includes(user.name.toLowerCase())) {
          if (/\([^)]+\)$/.test(weekTitle)) {
            weekTitle = weekTitle.replace(/\([^)]+\)$/, `(${user.name})`);
          } else {
            weekTitle = `${weekTitle} (${user.name})`;
          }
        }
      }

      if (!week) {
        week = await tx.week.create({
          data: {
            userId: user.id,
            title: weekTitle,
            startDate: effectiveStartDate,
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
            title: weekTitle,
            plannedVolumeKm: parsedData.plannedVolumeKm,
            originalPdfVolume: parsedData.originalPdfVolume
          }
        });
      }

      console.log(`[WEEK] ${week.id} (${week.startDate} -> ${week.endDate})`);

      // Criar os 7 dias da semana no fuso de Brasília
      const weekDays = getWeekDaysConfig(effectiveStartDate);
      const createdDays: Record<string, string> = {};

      for (const d of weekDays) {
        let dayRecord = await tx.trainingDay.findFirst({
          where: { weekId: week.id, dayOfWeek: d.dayOfWeek }
        });

        if (!dayRecord) {
          dayRecord = await tx.trainingDay.create({
            data: {
              weekId: week.id,
              date: d.date,
              dayOfWeek: d.dayOfWeek,
              isRestDay: d.isRestDay
            }
          });
        } else {
          // Atualiza a data do dia para bater exatamente com a data calculada
          await tx.trainingDay.update({
            where: { id: dayRecord.id },
            data: { date: d.date }
          });
        }
        createdDays[d.dayOfWeek] = dayRecord.id;
      }

      // Limpar treinos antigos (re-importação sem duplicar)
      await tx.workout.deleteMany({
        where: { trainingDay: { weekId: week.id } }
      });

      console.log(`[PERSIST] Gravando ${totalParsed} treinos...`);
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

      console.log(`[PERSIST] ${totalPersisted} treinos salvos com sucesso.`);

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

      return { weekId: week.id, totalParsed, totalPersisted, workouts: createdWorkouts };
    });

    return res.json({
      success: true,
      source: 'pdf',
      message: `${result.totalPersisted} treinos foram importados com sucesso!`,
      weekId: result.weekId,
      totalParsed: result.totalParsed,
      totalPersisted: result.totalPersisted,
      workouts: result.workouts
    });

  } catch (error: any) {
    console.error('[PDF IMPORT] Erro:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro interno ao importar PDF.'
    });
  }
}
