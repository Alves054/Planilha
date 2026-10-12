import { Router } from 'express';
import multer from 'multer';
import { getCurrentWeek, listWeeks, createWeek } from './controllers/weekController.js';
import { login, getMe, listAthletes, createAthlete, updateAthlete, deleteAthlete, updatePaceZones } from './controllers/authController.js';
import { authMiddleware, optionalAuthMiddleware, requireCoach } from './middlewares/authMiddleware.js';
import { createWorkout, updateWorkout, deleteWorkout, duplicateWorkout, submitWorkoutResult, getWorkoutResults, resetWorkoutResult } from './controllers/workoutController.js';
import { getGarminStatus, toggleGarminMock, syncWeekWorkouts, getSyncLogs } from './controllers/garminController.js';
import { getGarminAuthUrl, handleGarminCallback, disconnectGarmin } from './controllers/garminOAuthController.js';
import { importPdfWorkouts } from './controllers/pdfController.js';
import { importImageWorkouts } from './controllers/imageController.js';
import { sendMessage, listConversations, getConversationDetails, createConversation, deleteConversation } from './controllers/aiController.js';
import {
  listCycles,
  getCycleById,
  createCycle,
  updateCycle,
  deleteCycle,
  duplicateCycle,
  applyCycleToAthlete,
  removeCycleFromAthlete,
  getAthleteCycleWorkouts,
  saveWeekAsCycle
} from './controllers/cycleController.js';

// Multer — upload em memória para PDF e imagens
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }
});

export const routes = Router();

// Autenticação & Perfil
routes.post('/auth/login', login);
routes.get('/auth/me', authMiddleware, getMe);

// Gestão de Alunos (Painel do Professor)
routes.get('/athletes', listAthletes);
routes.post('/athletes', createAthlete);
routes.put('/athletes/:id', updateAthlete);
routes.put('/athletes/:id/pace-zones', updatePaceZones);
routes.delete('/athletes/:id', deleteAthlete);
routes.post('/athletes/:id/remove-cycle', removeCycleFromAthlete);
routes.get('/athletes/:id/cycle-workouts', getAthleteCycleWorkouts);

// Ciclos e Planejamento de Treino (Periodização / 30 Dias / 5km Sub 16)
routes.get('/cycles', listCycles);
routes.get('/cycles/:id', getCycleById);
routes.post('/cycles', createCycle);
routes.put('/cycles/:id', updateCycle);
routes.delete('/cycles/:id', deleteCycle);
routes.post('/cycles/:id/duplicate', duplicateCycle);
routes.post('/cycles/:id/apply', applyCycleToAthlete);
routes.post('/cycles/remove-from-athlete', removeCycleFromAthlete);
routes.post('/cycles/save-from-week', saveWeekAsCycle);

// Semanas
routes.get('/weeks/current', optionalAuthMiddleware, getCurrentWeek);
routes.get('/weeks', optionalAuthMiddleware, listWeeks);
routes.post('/weeks', optionalAuthMiddleware, createWeek);

// Treinos
routes.post('/workouts', createWorkout);
routes.put('/workouts/:id', updateWorkout);
routes.delete('/workouts/:id', deleteWorkout);
routes.post('/workouts/:id/duplicate', duplicateWorkout);

// Resultados de Treinos (Manual / Foto / Comprovante)
routes.get('/workout-results', getWorkoutResults);
routes.post('/workouts/:id/result', upload.any(), (req, res, next) => {
  if ((req as any).files?.length) (req as any).file = (req as any).files[0];
  next();
}, submitWorkoutResult);
routes.delete('/workouts/:id/result', resetWorkoutResult);

// Importação de PDF (aceita campo 'pdf', 'file' ou qualquer nome)
routes.post('/pdf/import', upload.any(), (req, res, next) => {
  if ((req as any).files?.length) (req as any).file = (req as any).files[0];
  next();
}, importPdfWorkouts);

// Importação via Imagem (aceita campo 'image', 'file' ou qualquer nome)
routes.post('/image/import', upload.any(), (req, res, next) => {
  if ((req as any).files?.length) (req as any).file = (req as any).files[0];
  next();
}, importImageWorkouts);

// Pace AI Chat & Conversas
routes.post('/ai/chat', sendMessage);
routes.get('/ai/conversations', listConversations);
routes.post('/ai/conversations', createConversation);
routes.get('/ai/conversations/:id', getConversationDetails);
routes.delete('/ai/conversations/:id', deleteConversation);

// Garmin Status & Mock Sync
routes.get('/garmin/status', getGarminStatus);
routes.post('/garmin/toggle-mock', toggleGarminMock);
routes.post('/garmin/sync-week', syncWeekWorkouts);
routes.get('/garmin/logs', getSyncLogs);

// Garmin OAuth 2.0 Oficial
routes.get('/garmin/auth-url', getGarminAuthUrl);
routes.get('/garmin/callback', handleGarminCallback);
routes.post('/garmin/disconnect', disconnectGarmin);
