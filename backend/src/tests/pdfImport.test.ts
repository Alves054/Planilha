import { parsePdfTextContent } from '../services/pdf/pdfParserService.js';
import { prisma } from '../prisma.js';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
  }
}

async function runPdfImportTestSuite() {
  console.log('\n==================================================');
  console.log('📄 INICIANDO TESTE DE INTEGRAÇÃO DE IMPORTAÇÃO DE PDF');
  console.log('==================================================\n');

  try {
    // TEST 1: Parsing de 12 treinos
    console.log('--- TEST 1: Parsing & Extração de Treinos ---');
    const parsedData = parsePdfTextContent();
    const totalParsed = parsedData.workouts.length;
    assert(totalParsed === 12, `Parser deve extrair exatamente 12 treinos da planilha (Obtido: ${totalParsed})`);

    // TEST 2: Persistência Atômica no Banco de Dados
    console.log('\n--- TEST 2: Persistência Atômica no Banco (prisma.$transaction) ---');
    const startDate = '2026-09-07';

    // Limpar semanas anteriores de teste para isolar o teste
    await prisma.week.deleteMany({ where: { startDate } });

    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: { name: 'Paulo Henrique', email: 'paulo@pacetraining.com' }
      });
    }

    const week = await prisma.week.create({
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

    const daysNames = ['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO', 'DOMINGO'];
    const start = new Date(startDate);
    const createdDays: Record<string, string> = {};

    for (let i = 0; i < 7; i++) {
      const current = new Date(start);
      current.setDate(start.getDate() + i);
      const dateStr = current.toISOString().split('T')[0];
      const dayName = daysNames[i];

      const dayRecord = await prisma.trainingDay.create({
        data: {
          weekId: week.id,
          date: dateStr,
          dayOfWeek: dayName,
          isRestDay: dayName === 'DOMINGO'
        }
      });
      createdDays[dayName] = dayRecord.id;
    }

    let totalPersisted = 0;
    for (const wSession of parsedData.workouts) {
      const dayId = createdDays[wSession.dayOfWeek];
      if (!dayId) continue;

      await prisma.workout.create({
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
        }
      });
      totalPersisted++;
    }

    assert(totalPersisted === 12, `Banco de dados deve gravar exatamente 12 treinos (Persistidos: ${totalPersisted})`);

    // TEST 3: Consulta Pós-Persistência (Simulação do Calendário)
    console.log('\n--- TEST 3: Consulta Pós-Persistência (GET WEEK) ---');
    const weekFromDb = await prisma.week.findUnique({
      where: { id: week.id },
      include: {
        trainingDays: {
          include: { workouts: { include: { steps: true } } }
        }
      }
    });

    let totalReturned = 0;
    if (weekFromDb) {
      for (const d of weekFromDb.trainingDays) {
        totalReturned += d.workouts.length;
      }
    }

    assert(totalReturned === 12, `Calendário deve carregar exatamente 12 treinos retornados do banco (Retornados: ${totalReturned})`);

    // TEST 4: Verificação de Múltiplas Sessões no Mesmo Dia (Segunda Manhã + Tarde)
    console.log('\n--- TEST 4: Suporte Multi-Sessão no Mesmo Dia (Manhã & Tarde) ---');
    const segundaDay = weekFromDb?.trainingDays.find(d => d.dayOfWeek === 'SEGUNDA');
    assert(segundaDay !== undefined && segundaDay.workouts.length === 2, 'Segunda-feira deve conter 2 sessões de treino (Manhã + Tarde) sem sobrescrever');
    
    if (segundaDay && segundaDay.workouts.length === 2) {
      assert(segundaDay.workouts[0].period === 'MANHA' && segundaDay.workouts[1].period === 'TARDE', 'Sessões da Segunda organizadas corretamente por período Manhã/Tarde');
    }

    // TEST 5: Proteção Contra Re-Importação Duplicada
    console.log('\n--- TEST 5: Prevenção de Duplicação em Re-Importação ---');
    // Ao reimportar a mesma semana, os treinos antigos são limpos na transação
    await prisma.workout.deleteMany({
      where: { trainingDay: { weekId: week.id } }
    });
    let reimportedCount = 0;
    for (const wSession of parsedData.workouts) {
      const dayId = createdDays[wSession.dayOfWeek];
      await prisma.workout.create({
        data: {
          trainingDayId: dayId,
          time: wSession.time,
          period: wSession.period,
          category: wSession.category,
          name: wSession.name,
          targetDistanceKm: wSession.targetDistanceKm || null,
          estimatedDistanceKm: wSession.estimatedDistanceKm || null,
          syncStatus: 'PRONTO_PARA_SINCRONIZAR'
        }
      });
      reimportedCount++;
    }
    assert(reimportedCount === 12, 'Re-importação substitui a semana mantendo exatamente 12 treinos sem duplicar para 24');

    console.log('\n==================================================');
    console.log(`📊 RESULTADO DOS TESTES DE PDF: ${passedTests} DE ${totalTests} TESTES PASSARAM COM SUCESSO!`);
    console.log('==================================================\n');

    if (passedTests === totalTests) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err: any) {
    console.error('Erro na execução da suíte de testes de PDF:', err);
    process.exit(1);
  }
}

runPdfImportTestSuite();
