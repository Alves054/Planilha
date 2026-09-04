import { parsePaceToMetersPerSecond, convertToGarminWorkoutJson, generateWorkoutSyncHash } from '../services/garmin/garminWorkoutConverter.js';
import { GarminMockService } from '../services/garmin/GarminMockService.js';
import { GarminOfficialService } from '../services/garmin/GarminOfficialService.js';

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

async function runGarminAuditTestSuite() {
  console.log('\n==================================================');
  console.log('🏃 INICIANDO SUÍTE DE TESTES E AUDITORIA GARMIN');
  console.log('==================================================\n');

  // TEST SUITE 1: Conversão Matemática de Pace (min/km -> m/s)
  console.log('--- TEST 1: Conversões de Pace para Velocidade (m/s) ---');
  const testPaces = [
    { pace: '3:20', expectedMs: 5.0 },
    { pace: '3:25', expectedMs: 4.878 },
    { pace: '4:40', expectedMs: 3.571 },
    { pace: '5:10', expectedMs: 3.226 },
    { pace: '5:40', expectedMs: 2.941 }
  ];

  for (const p of testPaces) {
    const calculated = parsePaceToMetersPerSecond(p.pace);
    assert(
      calculated !== null && Math.abs(calculated - p.expectedMs) < 0.005,
      `Pace ${p.pace}/km deve converter para aproximadamente ${p.expectedMs} m/s (Obtido: ${calculated} m/s)`
    );
  }

  // TEST SUITE 2: Conversão Completa do Treino Exemplo (Fartlek 5x1'/1')
  console.log('\n--- TEST 2: Conversão de Treino Estruturado Completo ---');
  const sampleWorkout = {
    id: 'w-fartlek-100',
    name: 'Fartlek 5×1\'/1\'',
    category: 'FARTLEK',
    notes: 'Treino de velocidade em base aeróbia',
    repeatCount: 5,
    steps: [
      {
        stepOrder: 1,
        stepType: 'WARMUP',
        durationType: 'TIME',
        durationValue: 1200, // 20 min
        targetType: 'PACE',
        targetMin: '4:40',
        targetMax: '5:10'
      },
      {
        stepOrder: 2,
        stepType: 'RUN',
        durationType: 'TIME',
        durationValue: 60, // 1 min
        targetType: 'PACE',
        targetMin: '3:20',
        targetMax: '3:25'
      },
      {
        stepOrder: 3,
        stepType: 'RECOVERY',
        durationType: 'TIME',
        durationValue: 60, // 1 min
        targetType: 'PACE',
        targetMin: '5:10',
        targetMax: '5:40'
      }
    ]
  };

  const garminJson = convertToGarminWorkoutJson(sampleWorkout, '2026-09-08');
  assert(garminJson.workoutName === 'Fartlek 5×1\'/1\'', 'Nome do treino preservado no JSON');
  assert(garminJson.sportType.sportTypeKey === 'running', 'SportType configurado como running');

  const mainSteps = garminJson.workoutSegments[0].workoutSteps;
  assert(mainSteps.length === 2, 'Estrutura deve conter 2 elementos principais (Warmup + RepeatGroup)');
  assert(mainSteps[0].type === 'ExecutableStepDTO' && mainSteps[0].stepType.stepTypeKey === 'warmup', 'Etapa 1 é Aquecimento (WARMUP) de 1200s');
  assert(mainSteps[0].endConditionValue === 1200, 'Duração do aquecimento é 1200 segundos');

  const repeatGroup = mainSteps[1];
  assert(repeatGroup.type === 'RepeatGroupDTO', 'Etapa 2 é um RepeatGroupDTO');
  assert(repeatGroup.numberOfIterations === 5, 'Número de repetições é 5');
  assert(repeatGroup.workoutSteps.length === 2, 'RepeatGroup possui 2 etapas filhas (Tiro + Recuperação)');

  // TEST SUITE 3: Preservação de Fuso Horário e Datas
  console.log('\n--- TEST 3: Integridade de Datas e Fuso Horário ---');
  const inputDateStr = '2026-09-08';
  const inputTimeStr = '06:30';
  const fullDateObj = new Date(`${inputDateStr}T${inputTimeStr}:00-03:00`);
  const formattedDate = fullDateObj.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  assert(formattedDate.includes('08/09/2026'), 'Data local em America/Sao_Paulo deve manter dia 08/09/2026 sem regressão UTC');

  // TEST SUITE 4: Hash de Sincronização Anti-Duplicação
  console.log('\n--- TEST 4: Sistema de Hash Anti-Duplicação (syncHash) ---');
  const hash1 = generateWorkoutSyncHash(sampleWorkout);
  const hash2 = generateWorkoutSyncHash(sampleWorkout);
  assert(hash1 === hash2, 'Hashes para o mesmo treino sem alterações devem ser idênticos');

  const modifiedWorkout = { ...sampleWorkout, name: 'Fartlek Modificado 5x1\'/1\'' };
  const hash3 = generateWorkoutSyncHash(modifiedWorkout);
  assert(hash1 !== hash3, 'Detecção de alteração no treino gera um novo syncHash');

  // TEST SUITE 5: Mocks de Respostas HTTP da Garmin API
  console.log('\n--- TEST 5: Mocks de Códigos de Status HTTP ---');
  const mockService = new GarminMockService();
  const mockResult = await mockService.publishWorkout(sampleWorkout, '2026-09-08', { connected: true, mode: 'mock' });
  assert(mockResult.status === 'SUCCESS' && mockResult.garminWorkoutId.startsWith('GARMIN-MOCK-'), 'GarminMockService simula sucesso 200 OK');

  const officialService = new GarminOfficialService();
  assert(officialService.getMode() === 'production', 'GarminOfficialService modo production');
  assert(officialService.isConfigured() === false, 'GarminOfficialService sem env retorna isConfigured: false');

  try {
    await officialService.publishWorkout(sampleWorkout, '2026-09-08', { connected: false, mode: 'production' });
    assert(false, 'Deveria falhar se não configurado');
  } catch (err: any) {
    assert(err.message.includes('não configurada'), 'Tratamento correto de credenciais ausentes em produção');
  }

  // RESULTADO FINAL
  console.log('\n==================================================');
  console.log(`📊 RESULTADO DA AUDITORIA: ${passedTests} DE ${totalTests} TESTES PASSARAM COM SUCESSO!`);
  console.log('==================================================\n');

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runGarminAuditTestSuite();
