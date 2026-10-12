import bcrypt from 'bcryptjs';
import { prisma } from './prisma.js';
import { getCurrentWeekMonday, getWeekSunday, getWeekDaysConfig } from './utils/dateUtils.js';

export async function seedInitialData() {
  const adminEmail = 'ph2835809@gmail.com';
  const adminPass = '123456';
  const hashedAdminPassword = await bcrypt.hash(adminPass, 10);

  // Garantir existência do Administrador/Treinador Principal
  let coach = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (!coach) {
    // Se havia o coach antigo, atualiza ou cria
    const oldCoach = await prisma.user.findFirst({ where: { role: 'COACH' } });
    if (oldCoach) {
      coach = await prisma.user.update({
        where: { id: oldCoach.id },
        data: {
          email: adminEmail,
          name: 'Administrador (Paulo Henrique)',
          password: hashedAdminPassword,
          role: 'COACH'
        }
      });
      console.log(`✅ Administrador atualizado: ${adminEmail}`);
    } else {
      coach = await prisma.user.create({
        data: {
          email: adminEmail,
          name: 'Administrador (Paulo Henrique)',
          password: hashedAdminPassword,
          role: 'COACH',
          phone: '(11) 98765-4321',
          notes: 'Administrador do Sistema'
        }
      });
      console.log(`✅ Administrador criado: ${adminEmail}`);
    }
  } else {
    // Atualiza a senha e role
    coach = await prisma.user.update({
      where: { id: coach.id },
      data: {
        password: hashedAdminPassword,
        role: 'COACH'
      }
    });
  }

  // Garantir existência do Aluno Paulo Henrique
  let athlete = await prisma.user.findFirst({
    where: { email: 'paulo@pacetraining.com' }
  });

  if (!athlete) {
    const athletePassword = await bcrypt.hash('123456', 10);
    athlete = await prisma.user.create({
      data: {
        email: 'paulo@pacetraining.com',
        name: 'Paulo Henrique',
        password: athletePassword,
        role: 'ATHLETE',
        phone: '(11) 99999-8888',
        notes: 'Atleta focado em 5km/10km e Meia Maratona',
        coachId: coach.id
      }
    });
    console.log('✅ Aluno criado: paulo@pacetraining.com / senha: 123456');
  } else {
    // Atualizar coachId e role se necessário
    if (athlete.role !== 'ATHLETE' || !athlete.coachId) {
      await prisma.user.update({
        where: { id: athlete.id },
        data: {
          role: 'ATHLETE',
          coachId: coach.id
        }
      });
    }
  }

  // Se já houver semanas cadastradas, finaliza
  const weekCount = await prisma.week.count();
  if (weekCount > 0) {
    return;
  }

  await prisma.garminConnection.create({
    data: {
      userId: athlete.id,
      accountName: 'Paulo Henrique (Garmin Mock)',
      connected: true,
      mode: 'mock'
    }
  });

  const mondayStr = getCurrentWeekMonday();
  const sundayStr = getWeekSunday(mondayStr);

  const week = await prisma.week.create({
    data: {
      userId: athlete.id,
      title: 'Semana 01 - Base Aeróbia & Volume',
      startDate: mondayStr,
      endDate: sundayStr,
      plannedVolumeKm: 90,
      originalPdfVolume: '≈ 90 km',
      status: 'EM_ANDAMENTO'
    }
  });

  const daysConfig = getWeekDaysConfig(mondayStr);

  const createdDays: Record<string, string> = {};

  for (const d of daysConfig) {
    const dayRecord = await prisma.trainingDay.create({
      data: {
        weekId: week.id,
        date: d.date,
        dayOfWeek: d.dayOfWeek,
        isRestDay: d.isRestDay
      }
    });
    createdDays[d.dayOfWeek] = dayRecord.id;
  }

  // Workouts para Segunda
  await prisma.workout.create({
    data: {
      trainingDayId: createdDays['SEGUNDA'],
      time: '06:30',
      period: 'MANHA',
      category: 'LEVE',
      name: '10 km Leve',
      targetDistanceKm: 10,
      estimatedDistanceKm: 10,
      targetPaceMin: '4:40',
      targetPaceMax: '5:10',
      syncStatus: 'SINCRONIZADO',
      garminWorkoutId: 'MOCK-GARMIN-101'
    }
  });

  await prisma.workout.create({
    data: {
      trainingDayId: createdDays['SEGUNDA'],
      time: '17:30',
      period: 'TARDE',
      category: 'REGENERATIVO',
      name: '8 km Regenerativo',
      targetDistanceKm: 8,
      estimatedDistanceKm: 8,
      targetPaceMin: '5:10',
      targetPaceMax: '5:40',
      syncStatus: 'SINCRONIZADO',
      garminWorkoutId: 'MOCK-GARMIN-102'
    }
  });

  // Workouts para Terça
  await prisma.workout.create({
    data: {
      trainingDayId: createdDays['TERCA'],
      time: '06:30',
      period: 'MANHA',
      category: 'LEVE',
      name: '10 km leve + 6×100m coordenados',
      targetDistanceKm: 10.6,
      estimatedDistanceKm: 10.6,
      targetPaceMin: '4:40',
      targetPaceMax: '5:10',
      syncStatus: 'SINCRONIZADO',
      garminWorkoutId: 'MOCK-GARMIN-103'
    }
  });

  await prisma.workout.create({
    data: {
      trainingDayId: createdDays['TERCA'],
      time: '17:30',
      period: 'TARDE',
      category: 'CONTROLADO',
      name: '6 km leve + 1 km a 3:50–4:00/km',
      targetDistanceKm: 7,
      estimatedDistanceKm: 7,
      targetPaceMin: '3:50',
      targetPaceMax: '4:00',
      syncStatus: 'SINCRONIZADO',
      garminWorkoutId: 'MOCK-GARMIN-104'
    }
  });

  // Workouts para Quarta
  await prisma.workout.create({
    data: {
      trainingDayId: createdDays['QUARTA'],
      time: '06:30',
      period: 'MANHA',
      category: 'LEVE',
      name: '9 km Leve',
      targetDistanceKm: 9,
      estimatedDistanceKm: 9,
      targetPaceMin: '4:40',
      targetPaceMax: '5:10',
      syncStatus: 'SINCRONIZADO',
      garminWorkoutId: 'MOCK-GARMIN-105'
    }
  });

  await prisma.workout.create({
    data: {
      trainingDayId: createdDays['QUARTA'],
      time: '17:30',
      period: 'TARDE',
      category: 'FARTLEK',
      name: '20 min leve + halteres + Fartlek 5x1\'/1\'',
      targetDistanceKm: 4,
      estimatedDistanceKm: 4,
      repeatCount: 5,
      syncStatus: 'PRONTO_PARA_SINCRONIZAR',
      steps: {
        create: [
          {
            stepOrder: 1,
            stepType: 'RUN',
            durationType: 'TIME',
            durationValue: 60,
            targetType: 'PACE',
            targetMin: '3:20',
            targetMax: '3:25',
            notes: 'Tiro forte 1 minuto'
          },
          {
            stepOrder: 2,
            stepType: 'RECOVERY',
            durationType: 'TIME',
            durationValue: 60,
            targetType: 'PACE',
            targetMin: '5:10',
            targetMax: '5:40',
            notes: 'Recuperação leve 1 minuto'
          }
        ]
      }
    }
  });

  // Workouts para Quinta
  await prisma.workout.create({
    data: {
      trainingDayId: createdDays['QUINTA'],
      time: '06:30',
      period: 'MANHA',
      category: 'CONTROLADO',
      name: '10 km leve + 2 km a 3:50–4:00/km',
      targetDistanceKm: 12,
      estimatedDistanceKm: 12,
      targetPaceMin: '3:50',
      targetPaceMax: '4:00',
      syncStatus: 'PRONTO_PARA_SINCRONIZAR'
    }
  });

  await prisma.workout.create({
    data: {
      trainingDayId: createdDays['QUINTA'],
      time: '17:30',
      period: 'TARDE',
      category: 'LEVE',
      name: '30 min Leve',
      targetDistanceKm: 6,
      estimatedDistanceKm: 6,
      targetPaceMin: '4:50',
      targetPaceMax: '5:10',
      syncStatus: 'PRONTO_PARA_SINCRONIZAR'
    }
  });

  // Workouts para Sexta
  await prisma.workout.create({
    data: {
      trainingDayId: createdDays['SEXTA'],
      time: '06:30',
      period: 'MANHA',
      category: 'LEVE',
      name: '8 km Leve',
      targetDistanceKm: 8,
      estimatedDistanceKm: 8,
      targetPaceMin: '4:40',
      targetPaceMax: '5:10',
      syncStatus: 'PRONTO_PARA_SINCRONIZAR'
    }
  });

  await prisma.workout.create({
    data: {
      trainingDayId: createdDays['SEXTA'],
      time: '17:30',
      period: 'TARDE',
      category: 'REGENERATIVO',
      name: '8 km Regenerativo',
      targetDistanceKm: 8,
      estimatedDistanceKm: 8,
      targetPaceMin: '5:10',
      targetPaceMax: '5:40',
      syncStatus: 'RASCUNHO'
    }
  });

  // Workouts para Sábado
  await prisma.workout.create({
    data: {
      trainingDayId: createdDays['SABADO'],
      time: '06:00',
      period: 'MANHA',
      category: 'LONGAO',
      name: '16 km longo confortável',
      targetDistanceKm: 16,
      estimatedDistanceKm: 16,
      targetPaceMin: '4:45',
      targetPaceMax: '5:15',
      syncStatus: 'RASCUNHO'
    }
  });

  console.log('Semeadura concluída com sucesso!');
}
