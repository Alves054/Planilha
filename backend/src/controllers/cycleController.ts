import { Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { getCurrentWeekMonday, getWeekSunday, getWeekDaysConfig } from '../utils/dateUtils.js';
import { calculateWorkoutEstimatedDistance } from '../engine/workoutEngine.js';

// Modelos padrão pré-carregados (Seeds) para o treinador
const DEFAULT_CYCLES = [
  {
    name: 'Ciclo 5km Sub 16min (30 Dias / 4 Semanas)',
    category: '5KM',
    targetPace: '3:12/km',
    durationDays: 30,
    description: 'Periodização de alta performance para atletas focados em quebrar 16 minutos nos 5km. Ênfase em VO2máx, limiar anaeróbio e ritmo específico de prova.',
    weeks: [
      {
        weekNumber: 1,
        title: 'Semana 1 - Base de Velocidade & Adaptação',
        days: [
          {
            dayOffset: 0,
            dayOfWeek: 'SEGUNDA',
            workouts: [
              {
                name: 'Rodagem Regenerativa + Mobilidade',
                category: 'REGENERATIVO',
                sport: 'RUNNING',
                time: '07:00',
                period: 'MANHA',
                targetDistanceKm: 8,
                targetPaceMin: '4:50',
                targetPaceMax: '5:15',
                repeatCount: 1,
                notes: 'Rodagem muito leve, manter batimento baixo e foco na postura.',
                steps: [
                  { stepType: 'WARMUP', durationType: 'TIME', durationValue: 600, targetMin: '5:10', targetMax: '5:30', notes: 'Aquecimento articular leve' },
                  { stepType: 'RUN', durationType: 'DISTANCE', durationValue: 7000, targetMin: '4:50', targetMax: '5:15', notes: 'Rodagem contínua' },
                  { stepType: 'COOL_DOWN', durationType: 'TIME', durationValue: 300, targetMin: '5:30', targetMax: '6:00', notes: 'Soltura final' }
                ]
              }
            ]
          },
          {
            dayOffset: 1,
            dayOfWeek: 'TERCA',
            workouts: [
              {
                name: 'Tiros 10× 400m na Pista (Ritmo Sub 16)',
                category: 'TIROS',
                sport: 'RUNNING',
                time: '06:30',
                period: 'MANHA',
                targetDistanceKm: 10,
                targetPaceMin: '3:00',
                targetPaceMax: '3:10',
                repeatCount: 10,
                notes: 'Passar cada 400m em 1:12 a 1:14. Recuperação 200m trote leve (60-70s).',
                steps: [
                  { stepType: 'WARMUP', durationType: 'DISTANCE', durationValue: 2000, targetMin: '4:40', targetMax: '5:00', notes: 'Aquecimento progressivo' },
                  { stepType: 'RUN', durationType: 'DISTANCE', durationValue: 400, targetMin: '3:00', targetMax: '3:10', notes: 'Tiro 400m forte @ 1:12' },
                  { stepType: 'RECOVERY', durationType: 'DISTANCE', durationValue: 200, targetMin: '5:20', targetMax: '5:50', notes: 'Recuperação ativa' },
                  { stepType: 'COOL_DOWN', durationType: 'DISTANCE', durationValue: 1500, targetMin: '5:00', targetMax: '5:30', notes: 'Soltura final' }
                ]
              }
            ]
          },
          {
            dayOffset: 2,
            dayOfWeek: 'QUARTA',
            workouts: [
              {
                name: 'Rodagem Moderada com Retas',
                category: 'MODERADO',
                sport: 'RUNNING',
                time: '07:00',
                period: 'MANHA',
                targetDistanceKm: 10,
                targetPaceMin: '4:20',
                targetPaceMax: '4:40',
                repeatCount: 1,
                notes: '10km contínuos com 5 retas progressivas de 80m ao final.',
                steps: [
                  { stepType: 'RUN', durationType: 'DISTANCE', durationValue: 10000, targetMin: '4:20', targetMax: '4:40', notes: 'Rodagem rítmica' }
                ]
              }
            ]
          },
          {
            dayOffset: 3,
            dayOfWeek: 'QUINTA',
            workouts: [
              {
                name: 'Limiar de Lactato 5km Contínuo',
                category: 'CONTROLADO',
                sport: 'RUNNING',
                time: '06:30',
                period: 'MANHA',
                targetDistanceKm: 11,
                targetPaceMin: '3:20',
                targetPaceMax: '3:30',
                repeatCount: 1,
                notes: 'Aquecimento 3km + 5km cravando 3:25/km + 3km soltura.',
                steps: [
                  { stepType: 'WARMUP', durationType: 'DISTANCE', durationValue: 3000, targetMin: '4:40', targetMax: '5:00', notes: 'Aquecimento' },
                  { stepType: 'RUN', durationType: 'DISTANCE', durationValue: 5000, targetMin: '3:20', targetMax: '3:30', notes: 'Bloco de limiar contínuo' },
                  { stepType: 'COOL_DOWN', durationType: 'DISTANCE', durationValue: 3000, targetMin: '5:00', targetMax: '5:30', notes: 'Volta à calma' }
                ]
              }
            ]
          },
          {
            dayOffset: 4,
            dayOfWeek: 'SEXTA',
            workouts: [
              {
                name: 'Rodagem Leve + Fortalecimento',
                category: 'LEVE',
                sport: 'RUNNING',
                time: '07:00',
                period: 'MANHA',
                targetDistanceKm: 7,
                targetPaceMin: '4:50',
                targetPaceMax: '5:20',
                repeatCount: 1,
                notes: 'Corrida solta pela manhã e trabalho de core e estabilidade de quadril.',
                steps: [
                  { stepType: 'RUN', durationType: 'DISTANCE', durationValue: 7000, targetMin: '4:50', targetMax: '5:20', notes: 'Rodagem leve' }
                ]
              }
            ]
          },
          {
            dayOffset: 5,
            dayOfWeek: 'SABADO',
            workouts: [
              {
                name: 'Longão Aeróbio Progressivo',
                category: 'LONGAO',
                sport: 'RUNNING',
                time: '06:00',
                period: 'MANHA',
                targetDistanceKm: 15,
                targetPaceMin: '4:15',
                targetPaceMax: '4:45',
                repeatCount: 1,
                notes: 'Começar em 4:45 e fechar os últimos 3km abaixo de 4:15.',
                steps: [
                  { stepType: 'RUN', durationType: 'DISTANCE', durationValue: 12000, targetMin: '4:30', targetMax: '4:45', notes: 'Volume aeróbio confortável' },
                  { stepType: 'RUN', durationType: 'DISTANCE', durationValue: 3000, targetMin: '4:10', targetMax: '4:20', notes: 'Progressão final forte' }
                ]
              }
            ]
          },
          {
            dayOffset: 6,
            dayOfWeek: 'DOMINGO',
            workouts: []
          }
        ]
      },
      {
        weekNumber: 2,
        title: 'Semana 2 - Potência Aeróbia (Tiros de 1000m)',
        days: [
          {
            dayOffset: 0,
            dayOfWeek: 'SEGUNDA',
            workouts: [
              {
                name: 'Rodagem Leve Regenerativa',
                category: 'LEVE',
                sport: 'RUNNING',
                time: '07:00',
                period: 'MANHA',
                targetDistanceKm: 8,
                targetPaceMin: '4:50',
                targetPaceMax: '5:15',
                repeatCount: 1,
                notes: 'Recuperar do longão.',
                steps: [{ stepType: 'RUN', durationType: 'DISTANCE', durationValue: 8000, targetMin: '4:50', targetMax: '5:15', notes: 'Rodagem' }]
              }
            ]
          },
          {
            dayOffset: 1,
            dayOfWeek: 'TERCA',
            workouts: [
              {
                name: 'Tiros 6× 1000m (Pace 3:05-3:10)',
                category: 'TIROS',
                sport: 'RUNNING',
                time: '06:30',
                period: 'MANHA',
                targetDistanceKm: 11,
                targetPaceMin: '3:05',
                targetPaceMax: '3:12',
                repeatCount: 6,
                notes: 'Cravar 1000m para 3:08. Recuperação 2min trote leve.',
                steps: [
                  { stepType: 'WARMUP', durationType: 'DISTANCE', durationValue: 2000, targetMin: '4:40', targetMax: '5:00', notes: 'Aquecimento' },
                  { stepType: 'RUN', durationType: 'DISTANCE', durationValue: 1000, targetMin: '3:05', targetMax: '3:12', notes: 'Tiro 1000m' },
                  { stepType: 'RECOVERY', durationType: 'TIME', durationValue: 120, targetMin: '5:30', targetMax: '6:00', notes: 'Recuperação 2min' },
                  { stepType: 'COOL_DOWN', durationType: 'DISTANCE', durationValue: 1500, targetMin: '5:00', targetMax: '5:30', notes: 'Soltura' }
                ]
              }
            ]
          },
          {
            dayOffset: 2,
            dayOfWeek: 'QUARTA',
            workouts: [
              {
                name: 'Rodagem Solta 9km',
                category: 'LEVE',
                sport: 'RUNNING',
                time: '07:00',
                period: 'MANHA',
                targetDistanceKm: 9,
                targetPaceMin: '4:40',
                targetPaceMax: '5:05',
                repeatCount: 1,
                notes: 'Rodagem livre.',
                steps: [{ stepType: 'RUN', durationType: 'DISTANCE', durationValue: 9000, targetMin: '4:40', targetMax: '5:05', notes: 'Rodagem' }]
              }
            ]
          },
          {
            dayOffset: 3,
            dayOfWeek: 'QUINTA',
            workouts: [
              {
                name: 'Fartlek de Pista: 12× (1min Forte / 1min Leve)',
                category: 'FARTLEK',
                sport: 'RUNNING',
                time: '06:30',
                period: 'MANHA',
                targetDistanceKm: 10,
                targetPaceMin: '3:00',
                targetPaceMax: '4:40',
                repeatCount: 12,
                notes: 'Alternância pura de ritmo sem parar o relógio.',
                steps: [
                  { stepType: 'WARMUP', durationType: 'DISTANCE', durationValue: 2000, targetMin: '4:50', targetMax: '5:10', notes: 'Aquecimento' },
                  { stepType: 'RUN', durationType: 'TIME', durationValue: 60, targetMin: '2:55', targetMax: '3:05', notes: '1 min forte' },
                  { stepType: 'RECOVERY', durationType: 'TIME', durationValue: 60, targetMin: '4:30', targetMax: '4:50', notes: '1 min leve' },
                  { stepType: 'COOL_DOWN', durationType: 'DISTANCE', durationValue: 1500, targetMin: '5:10', targetMax: '5:30', notes: 'Soltura' }
                ]
              }
            ]
          },
          {
            dayOffset: 4,
            dayOfWeek: 'SEXTA',
            workouts: [
              {
                name: 'Rodagem Regenerativa 6km',
                category: 'REGENERATIVO',
                sport: 'RUNNING',
                time: '07:00',
                period: 'MANHA',
                targetDistanceKm: 6,
                targetPaceMin: '5:00',
                targetPaceMax: '5:30',
                repeatCount: 1,
                notes: 'Giro leve.',
                steps: [{ stepType: 'RUN', durationType: 'DISTANCE', durationValue: 6000, targetMin: '5:00', targetMax: '5:30', notes: 'Rodagem' }]
              }
            ]
          },
          {
            dayOffset: 5,
            dayOfWeek: 'SABADO',
            workouts: [
              {
                name: 'Longão 16km com Bloco Firme',
                category: 'LONGAO',
                sport: 'RUNNING',
                time: '06:00',
                period: 'MANHA',
                targetDistanceKm: 16,
                targetPaceMin: '4:15',
                targetPaceMax: '4:45',
                repeatCount: 1,
                notes: 'Manter hidratação regular a cada 20 minutos.',
                steps: [{ stepType: 'RUN', durationType: 'DISTANCE', durationValue: 16000, targetMin: '4:15', targetMax: '4:45', notes: 'Longão' }]
              }
            ]
          },
          {
            dayOffset: 6,
            dayOfWeek: 'DOMINGO',
            workouts: []
          }
        ]
      },
      {
        weekNumber: 3,
        title: 'Semana 3 - Pico de Carga & Ritmo Específico 5km',
        days: [
          {
            dayOffset: 0,
            dayOfWeek: 'SEGUNDA',
            workouts: [
              {
                name: 'Rodagem Regenerativa 8km',
                category: 'REGENERATIVO',
                sport: 'RUNNING',
                time: '07:00',
                period: 'MANHA',
                targetDistanceKm: 8,
                targetPaceMin: '4:50',
                targetPaceMax: '5:15',
                repeatCount: 1,
                notes: 'Rodagem leve.',
                steps: [{ stepType: 'RUN', durationType: 'DISTANCE', durationValue: 8000, targetMin: '4:50', targetMax: '5:15', notes: 'Rodagem' }]
              }
            ]
          },
          {
            dayOffset: 1,
            dayOfWeek: 'TERCA',
            workouts: [
              {
                name: 'Tiros 12× 400m (Pace 2:55-3:05)',
                category: 'TIROS',
                sport: 'RUNNING',
                time: '06:30',
                period: 'MANHA',
                targetDistanceKm: 11,
                targetPaceMin: '2:55',
                targetPaceMax: '3:05',
                repeatCount: 12,
                notes: 'Passar em 1:10 a 1:12. Recup 200m trote.',
                steps: [
                  { stepType: 'WARMUP', durationType: 'DISTANCE', durationValue: 2000, targetMin: '4:40', targetMax: '5:00', notes: 'Aquecimento' },
                  { stepType: 'RUN', durationType: 'DISTANCE', durationValue: 400, targetMin: '2:55', targetMax: '3:05', notes: 'Tiro 400m' },
                  { stepType: 'RECOVERY', durationType: 'DISTANCE', durationValue: 200, targetMin: '5:20', targetMax: '5:50', notes: 'Recuperação' },
                  { stepType: 'COOL_DOWN', durationType: 'DISTANCE', durationValue: 1500, targetMin: '5:00', targetMax: '5:30', notes: 'Soltura' }
                ]
              }
            ]
          },
          {
            dayOffset: 2,
            dayOfWeek: 'QUARTA',
            workouts: [
              {
                name: 'Rodagem 10km Estável',
                category: 'MODERADO',
                sport: 'RUNNING',
                time: '07:00',
                period: 'MANHA',
                targetDistanceKm: 10,
                targetPaceMin: '4:25',
                targetPaceMax: '4:45',
                repeatCount: 1,
                notes: 'Corrida rítmica.',
                steps: [{ stepType: 'RUN', durationType: 'DISTANCE', durationValue: 10000, targetMin: '4:25', targetMax: '4:45', notes: 'Rodagem' }]
              }
            ]
          },
          {
            dayOffset: 3,
            dayOfWeek: 'QUINTA',
            workouts: [
              {
                name: 'Simulado de Ritmo de Prova: 3km @ 3:12/km',
                category: 'CONTROLADO',
                sport: 'RUNNING',
                time: '06:30',
                period: 'MANHA',
                targetDistanceKm: 9,
                targetPaceMin: '3:10',
                targetPaceMax: '3:15',
                repeatCount: 1,
                notes: 'Testar ritmo exato da prova de 5km (9:36 nos 3km).',
                steps: [
                  { stepType: 'WARMUP', durationType: 'DISTANCE', durationValue: 3000, targetMin: '4:40', targetMax: '5:00', notes: 'Aquecimento' },
                  { stepType: 'RUN', durationType: 'DISTANCE', durationValue: 3000, targetMin: '3:10', targetMax: '3:15', notes: 'Ritmo de prova cravado' },
                  { stepType: 'COOL_DOWN', durationType: 'DISTANCE', durationValue: 3000, targetMin: '5:00', targetMax: '5:30', notes: 'Soltura' }
                ]
              }
            ]
          },
          {
            dayOffset: 4,
            dayOfWeek: 'SEXTA',
            workouts: [
              {
                name: 'Rodagem Solta 6km',
                category: 'LEVE',
                sport: 'RUNNING',
                time: '07:00',
                period: 'MANHA',
                targetDistanceKm: 6,
                targetPaceMin: '4:55',
                targetPaceMax: '5:25',
                repeatCount: 1,
                notes: 'Soltar as pernas.',
                steps: [{ stepType: 'RUN', durationType: 'DISTANCE', durationValue: 6000, targetMin: '4:55', targetMax: '5:25', notes: 'Rodagem' }]
              }
            ]
          },
          {
            dayOffset: 5,
            dayOfWeek: 'SABADO',
            workouts: [
              {
                name: 'Longão 14km Confortável',
                category: 'LONGAO',
                sport: 'RUNNING',
                time: '06:00',
                period: 'MANHA',
                targetDistanceKm: 14,
                targetPaceMin: '4:30',
                targetPaceMax: '4:55',
                repeatCount: 1,
                notes: 'Volume aeróbio sem desgaste excessivo.',
                steps: [{ stepType: 'RUN', durationType: 'DISTANCE', durationValue: 14000, targetMin: '4:30', targetMax: '4:55', notes: 'Longão' }]
              }
            ]
          },
          {
            dayOffset: 6,
            dayOfWeek: 'DOMINGO',
            workouts: []
          }
        ]
      },
      {
        weekNumber: 4,
        title: 'Semana 4 - Polimento (Taper) & Teste / Prova 5km',
        days: [
          {
            dayOffset: 0,
            dayOfWeek: 'SEGUNDA',
            workouts: [
              {
                name: 'Rodagem Leve de Recuperação 6km',
                category: 'LEVE',
                sport: 'RUNNING',
                time: '07:00',
                period: 'MANHA',
                targetDistanceKm: 6,
                targetPaceMin: '5:00',
                targetPaceMax: '5:25',
                repeatCount: 1,
                notes: 'Início do polimento. Reduzir volume mantendo sensação de leveza.',
                steps: [{ stepType: 'RUN', durationType: 'DISTANCE', durationValue: 6000, targetMin: '5:00', targetMax: '5:25', notes: 'Rodagem' }]
              }
            ]
          },
          {
            dayOffset: 1,
            dayOfWeek: 'TERCA',
            workouts: [
              {
                name: 'Ativação Rápida: 5× 300m @ 52s (Recup Total)',
                category: 'TIROS',
                sport: 'RUNNING',
                time: '06:30',
                period: 'MANHA',
                targetDistanceKm: 6.5,
                targetPaceMin: '2:50',
                targetPaceMax: '3:00',
                repeatCount: 5,
                notes: 'Ativação neuromuscular rápida sem cansaço muscular. 2min intervalo andando.',
                steps: [
                  { stepType: 'WARMUP', durationType: 'DISTANCE', durationValue: 2500, targetMin: '4:50', targetMax: '5:15', notes: 'Aquecimento com retas' },
                  { stepType: 'RUN', durationType: 'DISTANCE', durationValue: 300, targetMin: '2:50', targetMax: '3:00', notes: 'Tiro 300m solto e veloz' },
                  { stepType: 'RECOVERY', durationType: 'TIME', durationValue: 120, targetMin: '6:00', targetMax: '7:00', notes: 'Recuperação ampla' },
                  { stepType: 'COOL_DOWN', durationType: 'DISTANCE', durationValue: 1500, targetMin: '5:10', targetMax: '5:40', notes: 'Soltura' }
                ]
              }
            ]
          },
          {
            dayOffset: 2,
            dayOfWeek: 'QUARTA',
            workouts: [
              {
                name: 'Descanso Ativo ou Off',
                category: 'DESCANSO',
                sport: 'REST',
                time: '07:00',
                period: 'MANHA',
                targetDistanceKm: 0,
                repeatCount: 1,
                notes: 'Sono de qualidade, boa hidratação e carboidratos limpos.'
              }
            ]
          },
          {
            dayOffset: 3,
            dayOfWeek: 'QUINTA',
            workouts: [
              {
                name: 'Trote Pré-Prova 4km + 4 Retas',
                category: 'LEVE',
                sport: 'RUNNING',
                time: '07:00',
                period: 'MANHA',
                targetDistanceKm: 4.5,
                targetPaceMin: '5:00',
                targetPaceMax: '5:30',
                repeatCount: 1,
                notes: 'Apenas despertar o corpo. Retas progressivas de 60m no final.',
                steps: [
                  { stepType: 'RUN', durationType: 'DISTANCE', durationValue: 4000, targetMin: '5:00', targetMax: '5:30', notes: 'Trote solto' },
                  { stepType: 'COOL_DOWN', durationType: 'DISTANCE', durationValue: 500, targetMin: '5:30', targetMax: '6:00', notes: 'Caminhada/Soltura' }
                ]
              }
            ]
          },
          {
            dayOffset: 4,
            dayOfWeek: 'SEXTA',
            workouts: [
              {
                name: 'Descanso Total Pré-Prova',
                category: 'DESCANSO',
                sport: 'REST',
                time: '07:00',
                period: 'MANHA',
                targetDistanceKm: 0,
                repeatCount: 1,
                notes: 'Descanso total, foco na estratégia de prova e mente tranquila.'
              }
            ]
          },
          {
            dayOffset: 5,
            dayOfWeek: 'SABADO',
            workouts: [
              {
                name: '🏆 DIA DE PROVA / TESTE 5KM (OBJETIVO SUB 16MIN)',
                category: 'TIROS',
                sport: 'RUNNING',
                time: '07:00',
                period: 'MANHA',
                targetDistanceKm: 8.5,
                targetPaceMin: '3:08',
                targetPaceMax: '3:12',
                repeatCount: 1,
                notes: 'Aquecer 2km + alongamento dinâmico. Largar controlado em 3:12 e sustentar. Finalizar com tudo!',
                steps: [
                  { stepType: 'WARMUP', durationType: 'DISTANCE', durationValue: 2000, targetMin: '4:30', targetMax: '5:00', notes: 'Aquecimento completo com retas' },
                  { stepType: 'RUN', durationType: 'DISTANCE', durationValue: 5000, targetMin: '3:08', targetMax: '3:12', notes: 'Prova 5km @ 15:45 - 16:00' },
                  { stepType: 'COOL_DOWN', durationType: 'DISTANCE', durationValue: 1500, targetMin: '5:30', targetMax: '6:00', notes: 'Trote da vitória / Soltura' }
                ]
              }
            ]
          },
          {
            dayOffset: 6,
            dayOfWeek: 'DOMINGO',
            workouts: []
          }
        ]
      }
    ]
  },
  {
    name: 'Ciclo 5km Sub 20min (30 Dias / 4 Semanas)',
    category: '5KM',
    targetPace: '3:59/km',
    durationDays: 30,
    description: 'Programa para quebrar a barreira dos 20 minutos nos 5km. Foco em intervalos de 400m a 1000m e ritmo de prova a 3:55-4:00/km.',
    weeks: [
      {
        weekNumber: 1,
        title: 'Semana 1 - Adaptação ao Ritmo 4:00',
        days: [
          {
            dayOffset: 0,
            dayOfWeek: 'SEGUNDA',
            workouts: [
              {
                name: 'Rodagem Regenerativa 6km',
                category: 'LEVE',
                sport: 'RUNNING',
                time: '07:00',
                period: 'MANHA',
                targetDistanceKm: 6,
                targetPaceMin: '5:20',
                targetPaceMax: '5:45',
                repeatCount: 1,
                notes: 'Ritmo bem confortável.',
                steps: [{ stepType: 'RUN', durationType: 'DISTANCE', durationValue: 6000, targetMin: '5:20', targetMax: '5:45', notes: 'Rodagem' }]
              }
            ]
          },
          {
            dayOffset: 1,
            dayOfWeek: 'TERCA',
            workouts: [
              {
                name: 'Tiros 8× 400m @ 1:32 (Pace 3:50/km)',
                category: 'TIROS',
                sport: 'RUNNING',
                time: '06:30',
                period: 'MANHA',
                targetDistanceKm: 8,
                targetPaceMin: '3:45',
                targetPaceMax: '3:55',
                repeatCount: 8,
                notes: 'Tiros regulares em 1:32 com 90s trote/caminhada.',
                steps: [
                  { stepType: 'WARMUP', durationType: 'DISTANCE', durationValue: 1500, targetMin: '5:15', targetMax: '5:35', notes: 'Aquecimento' },
                  { stepType: 'RUN', durationType: 'DISTANCE', durationValue: 400, targetMin: '3:45', targetMax: '3:55', notes: 'Tiro 400m' },
                  { stepType: 'RECOVERY', durationType: 'TIME', durationValue: 90, targetMin: '5:40', targetMax: '6:10', notes: 'Recuperação' },
                  { stepType: 'COOL_DOWN', durationType: 'DISTANCE', durationValue: 1000, targetMin: '5:30', targetMax: '6:00', notes: 'Soltura' }
                ]
              }
            ]
          },
          {
            dayOffset: 2,
            dayOfWeek: 'QUARTA',
            workouts: []
          },
          {
            dayOffset: 3,
            dayOfWeek: 'QUINTA',
            workouts: [
              {
                name: 'Ritmo Controlado 4km @ 4:15/km',
                category: 'CONTROLADO',
                sport: 'RUNNING',
                time: '06:30',
                period: 'MANHA',
                targetDistanceKm: 8,
                targetPaceMin: '4:10',
                targetPaceMax: '4:20',
                repeatCount: 1,
                notes: 'Bloco moderado firme.',
                steps: [
                  { stepType: 'WARMUP', durationType: 'DISTANCE', durationValue: 2000, targetMin: '5:10', targetMax: '5:30', notes: 'Aquecimento' },
                  { stepType: 'RUN', durationType: 'DISTANCE', durationValue: 4000, targetMin: '4:10', targetMax: '4:20', notes: 'Bloco controlado' },
                  { stepType: 'COOL_DOWN', durationType: 'DISTANCE', durationValue: 2000, targetMin: '5:30', targetMax: '6:00', notes: 'Soltura' }
                ]
              }
            ]
          },
          {
            dayOffset: 4,
            dayOfWeek: 'SEXTA',
            workouts: []
          },
          {
            dayOffset: 5,
            dayOfWeek: 'SABADO',
            workouts: [
              {
                name: 'Longão Aeróbio 11km',
                category: 'LONGAO',
                sport: 'RUNNING',
                time: '06:30',
                period: 'MANHA',
                targetDistanceKm: 11,
                targetPaceMin: '4:55',
                targetPaceMax: '5:25',
                repeatCount: 1,
                notes: 'Rodagem longa e confortável.',
                steps: [{ stepType: 'RUN', durationType: 'DISTANCE', durationValue: 11000, targetMin: '4:55', targetMax: '5:25', notes: 'Longão' }]
              }
            ]
          },
          {
            dayOffset: 6,
            dayOfWeek: 'DOMINGO',
            workouts: []
          }
        ]
      }
    ]
  },
  {
    name: 'Ciclo 10km Sub 45min (30 Dias / 4 Semanas)',
    category: '10KM',
    targetPace: '4:29/km',
    durationDays: 30,
    description: 'Periodização direcionada para quebrar os 45 minutos nos 10km, com foco em resistência de velocidade e limiar aeróbio.',
    weeks: [
      {
        weekNumber: 1,
        title: 'Semana 1 - Limiar e Base Aeróbia',
        days: [
          {
            dayOffset: 0,
            dayOfWeek: 'SEGUNDA',
            workouts: [
              {
                name: 'Rodagem 8km Leve',
                category: 'LEVE',
                sport: 'RUNNING',
                time: '07:00',
                period: 'MANHA',
                targetDistanceKm: 8,
                targetPaceMin: '5:10',
                targetPaceMax: '5:35',
                repeatCount: 1,
                notes: 'Rodagem aeróbia suave.',
                steps: [{ stepType: 'RUN', durationType: 'DISTANCE', durationValue: 8000, targetMin: '5:10', targetMax: '5:35', notes: 'Rodagem' }]
              }
            ]
          },
          {
            dayOffset: 1,
            dayOfWeek: 'TERCA',
            workouts: [
              {
                name: 'Tiros 5× 1000m @ 4:10/km',
                category: 'TIROS',
                sport: 'RUNNING',
                time: '06:30',
                period: 'MANHA',
                targetDistanceKm: 10,
                targetPaceMin: '4:05',
                targetPaceMax: '4:15',
                repeatCount: 5,
                notes: 'Cravar 1000m em 4:10 com 90s trote.',
                steps: [
                  { stepType: 'WARMUP', durationType: 'DISTANCE', durationValue: 2000, targetMin: '5:00', targetMax: '5:25', notes: 'Aquecimento' },
                  { stepType: 'RUN', durationType: 'DISTANCE', durationValue: 1000, targetMin: '4:05', targetMax: '4:15', notes: 'Tiro 1000m' },
                  { stepType: 'RECOVERY', durationType: 'TIME', durationValue: 90, targetMin: '5:40', targetMax: '6:10', notes: 'Recuperação' },
                  { stepType: 'COOL_DOWN', durationType: 'DISTANCE', durationValue: 1500, targetMin: '5:20', targetMax: '5:45', notes: 'Soltura' }
                ]
              }
            ]
          },
          {
            dayOffset: 2,
            dayOfWeek: 'QUARTA',
            workouts: []
          },
          {
            dayOffset: 3,
            dayOfWeek: 'QUINTA',
            workouts: [
              {
                name: 'Ritmo Controlado 6km @ 4:35/km',
                category: 'CONTROLADO',
                sport: 'RUNNING',
                time: '06:30',
                period: 'MANHA',
                targetDistanceKm: 10,
                targetPaceMin: '4:30',
                targetPaceMax: '4:40',
                repeatCount: 1,
                notes: 'Sustentar ritmo de prova.',
                steps: [
                  { stepType: 'WARMUP', durationType: 'DISTANCE', durationValue: 2000, targetMin: '5:00', targetMax: '5:20', notes: 'Aquecimento' },
                  { stepType: 'RUN', durationType: 'DISTANCE', durationValue: 6000, targetMin: '4:30', targetMax: '4:40', notes: 'Ritmo sustentado' },
                  { stepType: 'COOL_DOWN', durationType: 'DISTANCE', durationValue: 2000, targetMin: '5:20', targetMax: '5:50', notes: 'Soltura' }
                ]
              }
            ]
          },
          {
            dayOffset: 4,
            dayOfWeek: 'SEXTA',
            workouts: []
          },
          {
            dayOffset: 5,
            dayOfWeek: 'SABADO',
            workouts: [
              {
                name: 'Longão 14km Confortável',
                category: 'LONGAO',
                sport: 'RUNNING',
                time: '06:00',
                period: 'MANHA',
                targetDistanceKm: 14,
                targetPaceMin: '4:55',
                targetPaceMax: '5:25',
                repeatCount: 1,
                notes: 'Volume aeróbio.',
                steps: [{ stepType: 'RUN', durationType: 'DISTANCE', durationValue: 14000, targetMin: '4:55', targetMax: '5:25', notes: 'Longão' }]
              }
            ]
          },
          {
            dayOffset: 6,
            dayOfWeek: 'DOMINGO',
            workouts: []
          }
        ]
      }
    ]
  }
];

/**
 * Garante que existem ciclos padrão no banco para o treinador usar de imediato
 */
async function ensureDefaultCyclesSeeded() {
  try {
    const cycleModel = (prisma as any).trainingCycle;
    if (!cycleModel) return;

    const count = await cycleModel.count();
    if (count === 0) {
      for (const item of DEFAULT_CYCLES) {
        await cycleModel.create({
          data: {
            name: item.name,
            category: item.category,
            targetPace: item.targetPace,
            durationDays: item.durationDays,
            description: item.description,
            weeksData: JSON.stringify(item.weeks)
          }
        });
      }
    }
  } catch (e) {
    console.warn('Erro ao verificar ciclos padrões no banco:', e);
  }
}

/**
 * Lista todos os ciclos de treino disponíveis
 */
export async function listCycles(req: Request, res: Response) {
  try {
    await ensureDefaultCyclesSeeded();

    const cycleModel = (prisma as any).trainingCycle;
    if (!cycleModel) {
      // Fallback em memória caso modelo ainda não esteja no prisma client remoto
      return res.json(DEFAULT_CYCLES.map((c, i) => ({
        id: `default-${i}`,
        name: c.name,
        category: c.category,
        targetPace: c.targetPace,
        durationDays: c.durationDays,
        description: c.description,
        weeksData: JSON.stringify(c.weeks),
        createdAt: new Date().toISOString()
      })));
    }

    const cycles = await cycleModel.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return res.json(cycles);
  } catch (error: any) {
    console.error('Erro ao listar ciclos:', error);
    return res.status(500).json({ error: 'Erro ao listar ciclos de treino.' });
  }
}

/**
 * Retorna detalhes de um ciclo por ID
 */
export async function getCycleById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const cycleModel = (prisma as any).trainingCycle;

    if (!cycleModel) {
      const found = DEFAULT_CYCLES[0];
      return res.json({ ...found, id, weeksData: JSON.stringify(found.weeks) });
    }

    const cycle = await cycleModel.findUnique({ where: { id } });
    if (!cycle) {
      return res.status(404).json({ error: 'Ciclo de treino não encontrado.' });
    }

    return res.json(cycle);
  } catch (error: any) {
    console.error('Erro ao buscar ciclo:', error);
    return res.status(500).json({ error: 'Erro ao buscar ciclo de treino.' });
  }
}

/**
 * Cria um novo ciclo de planejamento
 */
export async function createCycle(req: Request, res: Response) {
  try {
    const { name, category, targetPace, durationDays, description, weeksData, coachId } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Nome do ciclo é obrigatório.' });
    }

    const cycleModel = (prisma as any).trainingCycle;
    if (!cycleModel) {
      return res.status(500).json({ error: 'Modelo de ciclo indisponível.' });
    }

    const newCycle = await cycleModel.create({
      data: {
        name: name.trim(),
        category: category || '5KM',
        targetPace: targetPace ? targetPace.trim() : null,
        durationDays: durationDays ? parseInt(durationDays, 10) : 30,
        description: description ? description.trim() : null,
        weeksData: typeof weeksData === 'string' ? weeksData : JSON.stringify(weeksData || []),
        coachId: coachId || null
      }
    });

    return res.status(201).json(newCycle);
  } catch (error: any) {
    console.error('Erro ao criar ciclo:', error);
    return res.status(500).json({ error: 'Erro ao criar ciclo de treino.' });
  }
}

/**
 * Atualiza um ciclo existente
 */
export async function updateCycle(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, category, targetPace, durationDays, description, weeksData } = req.body;

    const cycleModel = (prisma as any).trainingCycle;
    if (!cycleModel) {
      return res.status(500).json({ error: 'Modelo de ciclo indisponível.' });
    }

    const updated = await cycleModel.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(category ? { category } : {}),
        ...(targetPace !== undefined ? { targetPace: targetPace?.trim() || null } : {}),
        ...(durationDays ? { durationDays: parseInt(durationDays, 10) } : {}),
        ...(description !== undefined ? { description: description?.trim() || null } : {}),
        ...(weeksData !== undefined ? { weeksData: typeof weeksData === 'string' ? weeksData : JSON.stringify(weeksData) } : {})
      }
    });

    return res.json(updated);
  } catch (error: any) {
    console.error('Erro ao atualizar ciclo:', error);
    return res.status(500).json({ error: 'Erro ao atualizar ciclo de treino.' });
  }
}

/**
 * Exclui um ciclo
 */
export async function deleteCycle(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const cycleModel = (prisma as any).trainingCycle;
    if (!cycleModel) {
      return res.status(500).json({ error: 'Modelo de ciclo indisponível.' });
    }

    await cycleModel.delete({ where: { id } });
    return res.json({ message: 'Ciclo excluído com sucesso.' });
  } catch (error: any) {
    console.error('Erro ao excluir ciclo:', error);
    return res.status(500).json({ error: 'Erro ao excluir ciclo de treino.' });
  }
}

/**
 * Duplica um ciclo existente
 */
export async function duplicateCycle(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const cycleModel = (prisma as any).trainingCycle;
    if (!cycleModel) {
      return res.status(500).json({ error: 'Modelo de ciclo indisponível.' });
    }

    const orig = await cycleModel.findUnique({ where: { id } });
    if (!orig) {
      return res.status(404).json({ error: 'Ciclo original não encontrado.' });
    }

    const duplicated = await cycleModel.create({
      data: {
        name: `${orig.name} (Cópia)`,
        category: orig.category,
        targetPace: orig.targetPace,
        durationDays: orig.durationDays,
        description: orig.description,
        weeksData: orig.weeksData,
        coachId: orig.coachId
      }
    });

    return res.status(201).json(duplicated);
  } catch (error: any) {
    console.error('Erro ao duplicar ciclo:', error);
    return res.status(500).json({ error: 'Erro ao duplicar ciclo.' });
  }
}

/**
 * APLICA O CICLO COMPLETO NA PLANILHA DO ALUNO
 * Gera automaticamente as semanas, dias e treinos prescritos!
 */
export async function applyCycleToAthlete(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { athleteId, startDate } = req.body;

    if (!athleteId) {
      return res.status(400).json({ error: 'Selecione o aluno que receberá o ciclo de treino.' });
    }

    const athlete = await prisma.user.findUnique({ where: { id: athleteId } });
    if (!athlete) {
      return res.status(404).json({ error: 'Aluno não encontrado.' });
    }

    const cycleModel = (prisma as any).trainingCycle;
    let cycle = cycleModel ? await cycleModel.findUnique({ where: { id } }) : null;

    if (!cycle) {
      // Se for id default ou fallback
      const foundDefault = DEFAULT_CYCLES.find((c, i) => `default-${i}` === id || c.name === id);
      if (foundDefault) {
        cycle = {
          name: foundDefault.name,
          weeksData: JSON.stringify(foundDefault.weeks)
        };
      }
    }

    if (!cycle) {
      return res.status(404).json({ error: 'Ciclo de treino não encontrado.' });
    }

    let parsedWeeks: any[] = [];
    try {
      parsedWeeks = JSON.parse(cycle.weeksData || '[]');
    } catch (e) {
      parsedWeeks = [];
    }

    if (!Array.isArray(parsedWeeks) || parsedWeeks.length === 0) {
      return res.status(400).json({ error: 'Este ciclo ainda não possui semanas ou treinos configurados.' });
    }

    // Define a segunda-feira inicial
    let baseMondayStr = startDate;
    if (!baseMondayStr) {
      baseMondayStr = getCurrentWeekMonday();
    } else {
      baseMondayStr = getCurrentWeekMonday(new Date(baseMondayStr + 'T12:00:00Z'));
    }

    const createdWeekIds: string[] = [];
    let totalWorkoutsCreated = 0;

    // Itera por cada semana do ciclo
    for (let wIdx = 0; wIdx < parsedWeeks.length; wIdx++) {
      const cycleWeek = parsedWeeks[wIdx];

      // Calcula a data de início dessa semana específica (+7 dias para cada semana subsequente)
      const [by, bm, bd] = baseMondayStr.split('-').map(Number);
      const weekMondayDate = new Date(Date.UTC(by, bm - 1, bd + (wIdx * 7), 12, 0, 0));
      const weekStartDate = weekMondayDate.toISOString().split('T')[0];
      const weekEndDate = getWeekSunday(weekStartDate);

      // Calcula volume planejado total da semana
      let weekVolumeKm = 0;
      if (Array.isArray(cycleWeek.days)) {
        for (const day of cycleWeek.days) {
          if (Array.isArray(day.workouts)) {
            for (const wo of day.workouts) {
              weekVolumeKm += (parseFloat(wo.targetDistanceKm) || 0);
            }
          }
        }
      }

      // Cria a semana para o aluno
      const weekTitle = cycleWeek.title
        ? `${cycle.name} - ${cycleWeek.title}`
        : `${cycle.name} (Semana ${wIdx + 1})`;

      const createdWeek = await prisma.week.create({
        data: {
          userId: athlete.id,
          title: weekTitle,
          startDate: weekStartDate,
          endDate: weekEndDate,
          plannedVolumeKm: Math.round(weekVolumeKm * 10) / 10,
          status: 'EM_ANDAMENTO'
        }
      });
      createdWeekIds.push(createdWeek.id);

      // Cria os 7 dias da semana
      const weekDaysConfig = getWeekDaysConfig(weekStartDate);
      const dayMap: { [dayOfWeek: string]: string } = {};

      for (const dc of weekDaysConfig) {
        const createdDay = await prisma.trainingDay.create({
          data: {
            weekId: createdWeek.id,
            date: dc.date,
            dayOfWeek: dc.dayOfWeek,
            isRestDay: dc.isRestDay
          }
        });
        dayMap[dc.dayOfWeek] = createdDay.id;
      }

      // Cria os treinos de cada dia
      if (Array.isArray(cycleWeek.days)) {
        for (const dayItem of cycleWeek.days) {
          const targetDayId = dayMap[dayItem.dayOfWeek];
          if (!targetDayId || !Array.isArray(dayItem.workouts)) continue;

          for (const wo of dayItem.workouts) {
            if (!wo.name) continue;

            const estimatedDist = calculateWorkoutEstimatedDistance({
              trainingDayId: targetDayId,
              name: wo.name,
              targetDistanceKm: wo.targetDistanceKm ? parseFloat(wo.targetDistanceKm) : null,
              targetPaceMin: wo.targetPaceMin || null,
              targetPaceMax: wo.targetPaceMax || null,
              repeatCount: wo.repeatCount ? parseInt(wo.repeatCount, 10) : 1,
              steps: wo.steps || []
            });

            await prisma.workout.create({
              data: {
                trainingDayId: targetDayId,
                time: wo.time || '07:00',
                period: wo.period || 'MANHA',
                sport: wo.sport || 'RUNNING',
                category: wo.category || 'LEVE',
                name: wo.name,
                targetDistanceKm: wo.targetDistanceKm ? parseFloat(wo.targetDistanceKm) : null,
                estimatedDistanceKm: estimatedDist,
                targetPaceMin: wo.targetPaceMin || null,
                targetPaceMax: wo.targetPaceMax || null,
                repeatCount: wo.repeatCount ? parseInt(wo.repeatCount, 10) : 1,
                notes: wo.notes || null,
                syncStatus: 'RASCUNHO',
                steps: wo.steps && Array.isArray(wo.steps) && wo.steps.length > 0 ? {
                  create: wo.steps.map((st: any, sIdx: number) => ({
                    stepOrder: sIdx + 1,
                    stepType: st.stepType || 'RUN',
                    durationType: st.durationType || 'TIME',
                    durationValue: parseFloat(st.durationValue) || 60,
                    targetType: st.targetType || 'PACE',
                    targetMin: st.targetMin || null,
                    targetMax: st.targetMax || null,
                    notes: st.notes || null
                  }))
                } : undefined
              }
            });
            totalWorkoutsCreated++;
          }
        }
      }
    }

    return res.json({
      success: true,
      message: `Ciclo "${cycle.name}" aplicado com sucesso para o aluno ${athlete.name}!`,
      weeksCount: createdWeekIds.length,
      workoutsCount: totalWorkoutsCreated,
      startDate: baseMondayStr,
      createdWeekIds
    });
  } catch (error: any) {
    console.error('Erro ao aplicar ciclo ao aluno:', error);
    return res.status(500).json({ error: error.message || 'Erro ao aplicar ciclo de treino ao aluno.' });
  }
}

/**
 * Salva uma semana existente montada na planilha como um novo Ciclo Reutilizável
 */
export async function saveWeekAsCycle(req: Request, res: Response) {
  try {
    const { weekId, cycleName, category, targetPace, description } = req.body;

    if (!weekId || !cycleName) {
      return res.status(400).json({ error: 'ID da semana e nome do ciclo são obrigatórios.' });
    }

    const week = await prisma.week.findUnique({
      where: { id: weekId },
      include: {
        trainingDays: {
          orderBy: { date: 'asc' },
          include: {
            workouts: {
              include: {
                steps: {
                  orderBy: { stepOrder: 'asc' }
                }
              }
            }
          }
        }
      }
    });

    if (!week) {
      return res.status(404).json({ error: 'Semana não encontrada.' });
    }

    const weekData = {
      weekNumber: 1,
      title: week.title || 'Semana 1',
      days: week.trainingDays.map((td, idx) => ({
        dayOffset: idx,
        dayOfWeek: td.dayOfWeek,
        workouts: td.workouts.map(w => ({
          name: w.name,
          category: w.category,
          sport: w.sport,
          time: w.time,
          period: w.period,
          targetDistanceKm: w.targetDistanceKm,
          targetPaceMin: w.targetPaceMin,
          targetPaceMax: w.targetPaceMax,
          repeatCount: w.repeatCount,
          notes: w.notes,
          steps: w.steps.map(s => ({
            stepType: s.stepType,
            durationType: s.durationType,
            durationValue: s.durationValue,
            targetMin: s.targetMin,
            targetMax: s.targetMax,
            notes: s.notes
          }))
        }))
      }))
    };

    const cycleModel = (prisma as any).trainingCycle;
    if (!cycleModel) {
      return res.status(500).json({ error: 'Modelo de ciclos indisponível.' });
    }

    const createdCycle = await cycleModel.create({
      data: {
        name: cycleName.trim(),
        category: category || 'GERAL',
        targetPace: targetPace ? targetPace.trim() : null,
        durationDays: 30,
        description: description ? description.trim() : `Criado a partir da planilha: ${week.title || week.startDate}`,
        weeksData: JSON.stringify([weekData])
      }
    });

    return res.status(201).json(createdCycle);
  } catch (error: any) {
    console.error('Erro ao converter semana em ciclo:', error);
    return res.status(500).json({ error: 'Erro ao salvar semana como ciclo.' });
  }
}
