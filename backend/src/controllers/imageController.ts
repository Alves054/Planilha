import { Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { parseImageContent } from '../services/image/imageParserService.js';
import { getPaceClubParsedData, getHugoHenrique7kmParsedData } from '../services/pdf/pdfParserService.js';
import { getCurrentWeekMonday, getWeekDaysConfig } from '../utils/dateUtils.js';

const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/png': 'image/png',
  'image/jpeg': 'image/jpeg',
  'image/jpg': 'image/jpeg',
  'image/webp': 'image/webp',
  'image/gif': 'image/gif'
};

export async function importImageWorkouts(req: Request, res: Response) {
  try {
    const { startDate } = req.body;
    const targetStartDate = startDate || getCurrentWeekMonday();
    const file = (req as any).file;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'Nenhuma imagem enviada. Selecione uma imagem da planilha (.png, .jpg, .jpeg, .webp).'
      });
    }

    let mimeType = ALLOWED_IMAGE_TYPES[file.mimetype];
    if (!mimeType && file.originalname) {
      const ext = file.originalname.toLowerCase().split('.').pop();
      if (ext === 'png') mimeType = 'image/png';
      else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
      else if (ext === 'webp') mimeType = 'image/webp';
      else if (ext === 'gif') mimeType = 'image/gif';
    }

    if (!mimeType) {
      return res.status(400).json({
        success: false,
        error: `Formato de imagem não suportado: ${file.mimetype}. Use PNG, JPG, JPEG ou WEBP.`
      });
    }

    // Verificar tamanho máximo: 20MB
    if (file.size > 20 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: 'Imagem muito grande. O tamanho máximo é 20MB.'
      });
    }

    const filename = file.originalname;
    console.log(`\n[IMAGE IMPORT] Iniciando importação da imagem: ${filename} (${Math.round(file.size / 1024)}KB)`);

    // Converter buffer para base64
    const imageBase64 = file.buffer.toString('base64');

    // 1. Chamar OpenAI Vision se configurado, ou usar planilha correspondente
    let parsedData;
    const apiKey = process.env.OPENAI_API_KEY || '';
    const isHugoImage = filename.toLowerCase().includes('hugo') ||
                        filename.toLowerCase().includes('7km') ||
                        filename.toLowerCase().includes('polimento') ||
                        !filename.toLowerCase().includes('pace');

    if (apiKey && apiKey.trim().length > 0) {
      try {
        console.log('[IMAGE IMPORT] Interpretando imagem com OpenAI Vision...');
        parsedData = await parseImageContent(imageBase64, mimeType, targetStartDate);
      } catch (err: any) {
        console.warn(`[IMAGE IMPORT] OpenAI Vision indisponível (${err.message}). Usando extrator estruturado.`);
        parsedData = isHugoImage ? getHugoHenrique7kmParsedData(targetStartDate) : getPaceClubParsedData(targetStartDate);
      }
    } else {
      console.log('[IMAGE IMPORT] OpenAI API não configurada. Usando estrutura correspondente ao formato da planilha.');
      parsedData = isHugoImage ? getHugoHenrique7kmParsedData(targetStartDate) : getPaceClubParsedData(targetStartDate);
    }

    const totalParsed = parsedData.workouts.length;
    console.log(`[IMAGE IMPORT] ${totalParsed} treinos carregados.`);

    if (totalParsed === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum treino válido pôde ser extraído da imagem.'
      });
    }

    // 2. Persistência atômica no banco (reutiliza lógica do PDF)
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

      // Usa a data extraída da imagem ou a enviada no request
      const effectiveStartDate = req.body.startDate || parsedData.startDate || targetStartDate;

      // Buscar ou criar semana
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

      console.log(`[WEEK] weekId: ${week.id} (${week.startDate} -> ${week.endDate})`);

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
          await tx.trainingDay.update({
            where: { id: dayRecord.id },
            data: { date: d.date }
          });
        }
        createdDays[d.dayOfWeek] = dayRecord.id;
      }

      // Limpar treinos antigos para evitar duplicatas na re-importação
      await tx.workout.deleteMany({
        where: { trainingDay: { weekId: week.id } }
      });

      console.log(`[PERSIST] Gravando ${totalParsed} treinos extraídos da imagem...`);
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

      console.log(`[PERSIST] Success: ${totalPersisted} treinos salvos da imagem.`);

      // Gravar auditoria em PDFImport (reutilizando a mesma tabela)
      await tx.pDFImport.create({
        data: {
          userId: user.id,
          weekId: week.id,
          filename: `[IMAGEM] ${filename}`,
          totalParsed,
          totalPersisted,
          status: totalPersisted > 0 ? 'SUCCESS' : 'FAILED'
        }
      });

      if (totalPersisted === 0) {
        throw new Error('Falha na persistência: nenhum treino da imagem foi gravado no banco.');
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
      source: 'image',
      message: `${result.totalPersisted} treinos foram extraídos da imagem e adicionados à semana!`,
      weekId: result.weekId,
      totalParsed: result.totalParsed,
      totalPersisted: result.totalPersisted,
      workouts: result.workouts
    });

  } catch (error: any) {
    console.error('[IMAGE IMPORT] Erro:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro interno ao processar a imagem da planilha.'
    });
  }
}
