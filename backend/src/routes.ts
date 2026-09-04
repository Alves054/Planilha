import { Router } from 'express';
import { getCurrentWeek, listWeeks, createWeek } from './controllers/weekController.js';
import { createWorkout, updateWorkout, deleteWorkout, duplicateWorkout } from './controllers/workoutController.js';
import { getGarminStatus, toggleGarminMock, syncWeekWorkouts, getSyncLogs } from './controllers/garminController.js';
import { getGarminAuthUrl, handleGarminCallback, disconnectGarmin } from './controllers/garminOAuthController.js';
import { importPdfWorkouts } from './controllers/pdfController.js';
import { sendMessage, listConversations, getConversationDetails, createConversation, deleteConversation } from './controllers/aiController.js';

export const routes = Router();

// Semanas
routes.get('/weeks/current', getCurrentWeek);
routes.get('/weeks', listWeeks);
routes.post('/weeks', createWeek);

// Treinos
routes.post('/workouts', createWorkout);
routes.put('/workouts/:id', updateWorkout);
routes.delete('/workouts/:id', deleteWorkout);
routes.post('/workouts/:id/duplicate', duplicateWorkout);

// Importação de PDF
routes.post('/pdf/import', importPdfWorkouts);

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
