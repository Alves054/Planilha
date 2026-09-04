import crypto from 'crypto';

export function parsePaceToMetersPerSecond(paceStr?: string | null): number | null {
  if (!paceStr) return null;
  const parts = paceStr.trim().split(':');
  if (parts.length !== 2) return null;
  const min = parseInt(parts[0], 10);
  const sec = parseInt(parts[1], 10);
  if (isNaN(min) || isNaN(sec) || (min <= 0 && sec <= 0)) return null;
  const totalSeconds = min * 60 + sec;
  if (totalSeconds === 0) return null;
  // 1000m / totalSeconds = m/s (arredondado em 3 casas decimais)
  return Math.round((1000 / totalSeconds) * 1000) / 1000;
}

export function generateWorkoutSyncHash(workout: any): string {
  const payload = {
    name: workout.name,
    category: workout.category,
    targetDistanceKm: workout.targetDistanceKm,
    targetPaceMin: workout.targetPaceMin,
    targetPaceMax: workout.targetPaceMax,
    repeatCount: workout.repeatCount,
    steps: workout.steps ? workout.steps.map((s: any) => ({
      stepType: s.stepType,
      durationType: s.durationType,
      durationValue: s.durationValue,
      targetMin: s.targetMin,
      targetMax: s.targetMax
    })) : []
  };
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

function buildExecutableStep(step: any, stepOrder: number) {
  const speedLow = parsePaceToMetersPerSecond(step.targetMax); // Pace maior = velocidade menor
  const speedHigh = parsePaceToMetersPerSecond(step.targetMin); // Pace menor = velocidade maior

  const typeMap: Record<string, { id: number; key: string }> = {
    WARMUP: { id: 1, key: 'warmup' },
    COOL_DOWN: { id: 2, key: 'cooldown' },
    RECOVERY: { id: 4, key: 'recovery' },
    REST: { id: 5, key: 'rest' }
  };
  const stepTypeInfo = typeMap[step.stepType] || { id: 3, key: 'interval' };

  return {
    type: 'ExecutableStepDTO',
    stepId: null,
    stepOrder,
    stepType: {
      stepTypeId: stepTypeInfo.id,
      stepTypeKey: stepTypeInfo.key
    },
    endCondition: {
      conditionTypeId: step.durationType === 'TIME' ? 2 : 1,
      conditionTypeKey: step.durationType === 'TIME' ? 'time' : 'distance'
    },
    endConditionValue: step.durationValue,
    targetType: speedLow || speedHigh ? {
      targetTypeId: 6,
      targetTypeKey: 'pace.zone'
    } : {
      targetTypeId: 1,
      targetTypeKey: 'no.target'
    },
    targetValueOne: speedLow || 0,
    targetValueTwo: speedHigh || 0
  };
}

/**
 * Converte o treino do Pace Training para o formato JSON oficial da Garmin Training API
 */
export function convertToGarminWorkoutJson(workout: any, date: string) {
  const steps: any[] = [];
  let stepOrder = 1;

  if (workout.steps && workout.steps.length > 0) {
    const warmupSteps = workout.steps.filter((s: any) => s.stepType === 'WARMUP');
    const repeatSteps = workout.steps.filter((s: any) => s.stepType !== 'WARMUP' && s.stepType !== 'COOL_DOWN');
    const cooldownSteps = workout.steps.filter((s: any) => s.stepType === 'COOL_DOWN');

    // 1. Etapas de Aquecimento (fora do bloco de repetição)
    for (const wStep of warmupSteps) {
      steps.push(buildExecutableStep(wStep, stepOrder++));
    }

    // 2. Bloco de Repetição ou Treino Principal
    if (repeatSteps.length > 0) {
      if (workout.repeatCount && workout.repeatCount > 1) {
        const childSteps = repeatSteps.map((rStep: any, idx: number) => buildExecutableStep(rStep, idx + 1));
        steps.push({
          type: 'RepeatGroupDTO',
          stepId: null,
          stepOrder: stepOrder++,
          stepType: {
            stepTypeId: 6,
            stepTypeKey: 'repeat'
          },
          numberOfIterations: workout.repeatCount,
          workoutSteps: childSteps
        });
      } else {
        for (const rStep of repeatSteps) {
          steps.push(buildExecutableStep(rStep, stepOrder++));
        }
      }
    }

    // 3. Etapas de Desaquecimento (fora do bloco de repetição)
    for (const cStep of cooldownSteps) {
      steps.push(buildExecutableStep(cStep, stepOrder++));
    }
  } else {
    // Treino simples contínuo (ex: 10 km leve)
    const distMeters = (workout.targetDistanceKm || workout.estimatedDistanceKm || 10) * 1000;
    const speedLow = parsePaceToMetersPerSecond(workout.targetPaceMax);
    const speedHigh = parsePaceToMetersPerSecond(workout.targetPaceMin);

    steps.push({
      type: 'ExecutableStepDTO',
      stepId: null,
      stepOrder: 1,
      stepType: {
        stepTypeId: 3,
        stepTypeKey: 'interval'
      },
      endCondition: {
        conditionTypeId: 1,
        conditionTypeKey: 'distance'
      },
      endConditionValue: distMeters,
      targetType: speedLow || speedHigh ? {
        targetTypeId: 6,
        targetTypeKey: 'pace.zone'
      } : {
        targetTypeId: 1,
        targetTypeKey: 'no.target'
      },
      targetValueOne: speedLow || 0,
      targetValueTwo: speedHigh || 0
    });
  }

  return {
    workoutName: workout.name,
    description: `Pace Training — Data: ${date} — ${workout.notes || ''}`,
    sportType: {
      sportTypeId: 1,
      sportTypeKey: 'running'
    },
    workoutSegments: [
      {
        segmentOrder: 1,
        sportType: {
          sportTypeId: 1,
          sportTypeKey: 'running'
        },
        workoutSteps: steps
      }
    ]
  };
}
