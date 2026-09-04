import axios from 'axios';
import { Week, WeekMetrics, Workout, GarminConnectionStatus, SyncLogItem, AIConversationItem, AIMessageItem } from '../types/workout';

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

export const getCurrentWeek = async (): Promise<{ week: Week; metrics: WeekMetrics }> => {
  const res = await api.get<{ week: Week; metrics: WeekMetrics }>('/weeks/current');
  return res.data;
};

export const listWeeks = async (): Promise<Week[]> => {
  const res = await api.get<Week[]>('/weeks');
  return res.data;
};

export const createWeek = async (data: { title?: string; startDate: string; endDate: string; plannedVolumeKm?: number; originalPdfVolume?: string }) => {
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

export const importPdfApi = async (file?: File | null, startDate?: string): Promise<{ success: boolean; weekId: string; totalParsed: number; totalPersisted: number; message: string }> => {
  const formData = new FormData();
  if (file) {
    formData.append('pdf', file);
  }
  if (startDate) {
    formData.append('startDate', startDate);
  }
  const res = await api.post('/pdf/import', formData, {
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
