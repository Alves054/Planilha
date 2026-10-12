import axios from 'axios';
import { Week, WeekMetrics, Workout, GarminConnectionStatus, SyncLogItem, AIConversationItem, AIMessageItem, UserProfile, AthleteItem } from '../types/workout';

// URL base dinâmica (Em produção Vercel usa '/api', em Dev usa 'http://localhost:3001/api')
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return '/api';
  }
  return 'http://localhost:3001/api';
};

const api = axios.create({
  baseURL: getApiBaseUrl()
});

// Interceptor para injetar JWT Token nas requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pace_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Autenticação & Alunos ──────────────────────────────────────────────────
export const loginApi = async (email: string, password: string): Promise<{ success: boolean; token: string; user: UserProfile }> => {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
};

export const getMeApi = async (): Promise<{ user: UserProfile }> => {
  const res = await api.get('/auth/me');
  return res.data;
};

export const listAthletesApi = async (): Promise<{ athletes: AthleteItem[] }> => {
  const res = await api.get('/athletes');
  return res.data;
};

export const createAthleteApi = async (data: {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  notes?: string;
  paceLeve?: string;
  paceModerado?: string;
  paceControlado?: string;
  paceTiros?: string;
}): Promise<{ success: boolean; athlete: AthleteItem }> => {
  const res = await api.post('/athletes', data);
  return res.data;
};

export const updateAthleteApi = async (
  id: string,
  data: Partial<{
    name: string;
    email: string;
    password?: string;
    phone?: string;
    notes?: string;
    paceLeve?: string;
    paceModerado?: string;
    paceControlado?: string;
    paceTiros?: string;
  }>
): Promise<{ success: boolean; athlete: AthleteItem }> => {
  const res = await api.put(`/athletes/${id}`, data);
  return res.data;
};

export const updatePaceZonesApi = async (
  athleteId: string,
  zones: {
    paceLeve?: string;
    paceModerado?: string;
    paceControlado?: string;
    paceTiros?: string;
  }
): Promise<{ success: boolean; athlete: any; message: string }> => {
  const res = await api.put(`/athletes/${athleteId}/pace-zones`, zones);
  return res.data;
};

export const deleteAthleteApi = async (id: string): Promise<{ success: boolean }> => {
  const res = await api.delete(`/athletes/${id}`);
  return res.data;
};

// ─── Semanas & Treinos ─────────────────────────────────────────────────────
export const getCurrentWeek = async (athleteId?: string): Promise<{ week: Week; metrics: WeekMetrics }> => {
  const params = athleteId ? { athleteId } : {};
  const res = await api.get<{ week: Week; metrics: WeekMetrics }>('/weeks/current', { params });
  return res.data;
};

export const listWeeks = async (athleteId?: string): Promise<Week[]> => {
  const params = athleteId ? { athleteId } : {};
  const res = await api.get<Week[]>('/weeks', { params });
  return res.data;
};

export const createWeek = async (data: { title?: string; startDate: string; endDate: string; plannedVolumeKm?: number; originalPdfVolume?: string; athleteId?: string }) => {
  const res = await api.post<Week>('/weeks', data);
  return res.data;
};

export const createWorkout = async (data: Partial<Workout>) => {
  const res = await api.post<Workout>('/workouts', data);
  return res.data;
};

export const updateWorkout = async (id: string, data: Partial<Workout>) => {
  const res = await api.put<Workout>(`/workouts/${id}`, data);
  return res.data;
};

export const deleteWorkout = async (id: string) => {
  const res = await api.delete(`/workouts/${id}`);
  return res.data;
};

export const duplicateWorkout = async (id: string, targetTrainingDayId?: string) => {
  const res = await api.post<Workout>(`/workouts/${id}/duplicate`, { targetTrainingDayId });
  return res.data;
};

export const importPdfApi = async (file?: File | null, startDate?: string, athleteId?: string): Promise<{ success: boolean; weekId: string; totalParsed: number; totalPersisted: number; message: string }> => {
  const formData = new FormData();
  if (file) {
    formData.append('pdf', file);
  }
  if (startDate) {
    formData.append('startDate', startDate);
  }
  if (athleteId) {
    formData.append('athleteId', athleteId);
  }
  const res = await api.post('/pdf/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return res.data;
};

export const importImageApi = async (file: File, startDate?: string, athleteId?: string): Promise<{ success: boolean; weekId: string; totalParsed: number; totalPersisted: number; message: string; source?: string }> => {
  const formData = new FormData();
  formData.append('image', file);
  if (startDate) {
    formData.append('startDate', startDate);
  }
  if (athleteId) {
    formData.append('athleteId', athleteId);
  }
  const res = await api.post('/image/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return res.data;
};

export const sendAiMessage = async (data: { message: string; conversationId?: string; weekId?: string }): Promise<{
  success: boolean;
  conversationId: string;
  message: AIMessageItem;
  modelUsed?: string;
  contextSummary?: any;
}> => {
  const res = await api.post('/ai/chat', data);
  return res.data;
};

export const listAiConversations = async (): Promise<AIConversationItem[]> => {
  const res = await api.get<AIConversationItem[]>('/ai/conversations');
  return res.data;
};

export const getAiConversation = async (id: string): Promise<AIConversationItem> => {
  const res = await api.get<AIConversationItem>(`/ai/conversations/${id}`);
  return res.data;
};

export const createAiConversation = async (weekId?: string, title?: string): Promise<AIConversationItem> => {
  const res = await api.post<AIConversationItem>('/ai/conversations', { weekId, title });
  return res.data;
};

export const deleteAiConversation = async (id: string) => {
  const res = await api.delete(`/ai/conversations/${id}`);
  return res.data;
};

export const getGarminStatus = async (): Promise<GarminConnectionStatus> => {
  const res = await api.get<GarminConnectionStatus>('/garmin/status');
  return res.data;
};

export const getGarminAuthUrl = async (): Promise<{ url: string; mode: string }> => {
  const res = await api.get<{ url: string; mode: string }>('/garmin/auth-url');
  return res.data;
};

export const disconnectGarmin = async () => {
  const res = await api.post('/garmin/disconnect');
  return res.data;
};

export const toggleGarminMock = async (): Promise<{ mode: string; isConfigured: boolean }> => {
  const res = await api.post<{ mode: string; isConfigured: boolean }>('/garmin/toggle-mock');
  return res.data;
};

export const syncWeekWorkouts = async (weekId: string) => {
  const res = await api.post<{ message: string; mode: string; syncedWorkouts: any[] }>('/garmin/sync-week', { weekId });
  return res.data;
};

export const getSyncLogs = async (): Promise<SyncLogItem[]> => {
  const res = await api.get<SyncLogItem[]>('/garmin/logs');
  return res.data;
};

// ==========================================
// Resultados de Treinos (Manual / Comprovantes)
// ==========================================
export const getWorkoutResultsApi = async (athleteId?: string): Promise<{ results: import('../types/workout').WorkoutResultItem[] }> => {
  const params = athleteId ? { athleteId } : {};
  const res = await api.get('/workout-results', { params });
  return res.data;
};

export const submitWorkoutResultApi = async (workoutId: string, payload: FormData | {
  actualDistanceKm?: number;
  actualPace?: string;
  actualDurationMinutes?: number;
  actualHeartRate?: number;
  feedback?: string;
  proofImageUrl?: string;
  isCompleted?: boolean;
}) => {
  const headers = payload instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {};
  const res = await api.post(`/workouts/${workoutId}/result`, payload, { headers });
  return res.data;
};

export const resetWorkoutResultApi = async (workoutId: string) => {
  const res = await api.delete(`/workouts/${workoutId}/result`);
  return res.data;
};

// ==========================================
// Ciclos e Modelos de Treino (Periodização)
// ==========================================
export const listCyclesApi = async (): Promise<import('../types/workout').TrainingCycleItem[]> => {
  const res = await api.get('/cycles');
  return res.data;
};

export const getCycleByIdApi = async (id: string): Promise<import('../types/workout').TrainingCycleItem> => {
  const res = await api.get(`/cycles/${id}`);
  return res.data;
};

export const createCycleApi = async (payload: {
  name: string;
  category?: string;
  targetPace?: string;
  durationDays?: number;
  description?: string;
  weeksData: any;
}) => {
  const res = await api.post('/cycles', payload);
  return res.data;
};

export const updateCycleApi = async (id: string, payload: {
  name?: string;
  category?: string;
  targetPace?: string;
  durationDays?: number;
  description?: string;
  weeksData?: any;
}) => {
  const res = await api.put(`/cycles/${id}`, payload);
  return res.data;
};

export const deleteCycleApi = async (id: string) => {
  const res = await api.delete(`/cycles/${id}`);
  return res.data;
};

export const duplicateCycleApi = async (id: string) => {
  const res = await api.post(`/cycles/${id}/duplicate`);
  return res.data;
};

export const applyCycleToAthleteApi = async (cycleId: string, athleteId: string, startDate?: string) => {
  const res = await api.post(`/cycles/${cycleId}/apply`, { athleteId, startDate });
  return res.data;
};

export const saveWeekAsCycleApi = async (payload: {
  weekId: string;
  cycleName: string;
  category?: string;
  targetPace?: string;
  description?: string;
}) => {
  const res = await api.post('/cycles/save-from-week', payload);
  return res.data;
};

export const removeCycleFromAthleteApi = async (athleteId: string, cycleName?: string, cycleId?: string) => {
  const res = await api.post(`/athletes/${athleteId}/remove-cycle`, { athleteId, cycleName, cycleId });
  return res.data;
};

export const getAthleteCycleWorkoutsApi = async (athleteId: string) => {
  const res = await api.get(`/athletes/${athleteId}/cycle-workouts`);
  return res.data;
};

