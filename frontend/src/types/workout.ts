export type WorkoutPeriod = 'MANHA' | 'TARDE' | 'NOITE';

export type SyncStatus =
  | 'RASCUNHO'
  | 'CONFIRMADO'
  | 'PRONTO_PARA_SINCRONIZAR'
  | 'ENVIANDO'
  | 'SINCRONIZADO'
  | 'ERRO';

export type WorkoutCategory =
  | 'LEVE'
  | 'REGENERATIVO'
  | 'TIROS'
  | 'FARTLEK'
  | 'CONTROLADO'
  | 'LONGAO'
  | 'HALTERES'
  | 'DESCANSO';

export interface WorkoutStep {
  id?: string;
  stepOrder: number;
  stepType: 'WARMUP' | 'RUN' | 'RECOVERY' | 'COOL_DOWN' | 'REST';
  durationType: 'TIME' | 'DISTANCE';
  durationValue: number;
  targetType?: 'PACE' | 'HR_ZONE' | 'OPEN';
  targetMin?: string;
  targetMax?: string;
  notes?: string;
}

export interface Workout {
  id: string;
  trainingDayId: string;
  time?: string;
  period: WorkoutPeriod;
  sport: string;
  category: WorkoutCategory;
  name: string;
  targetDistanceKm?: number | null;
  estimatedDistanceKm?: number | null;
  targetPaceMin?: string | null;
  targetPaceMax?: string | null;
  targetHeartRateZone?: string | null;
  repeatCount: number;
  notes?: string | null;
  syncStatus: SyncStatus;
  garminWorkoutId?: string | null;
  syncHash?: string | null;
  lastSyncedAt?: string | null;
  syncError?: string | null;
  steps: WorkoutStep[];
  createdAt?: string;
  updatedAt?: string;
}

export interface TrainingDay {
  id: string;
  weekId: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: 'SEGUNDA' | 'TERCA' | 'QUARTA' | 'QUINTA' | 'SEXTA' | 'SABADO' | 'DOMINGO';
  isRestDay: boolean;
  notes?: string;
  workouts: Workout[];
}

export interface WeekMetrics {
  totalCalculatedKm: number;
  plannedVolumeKm: number;
  originalPdfVolume?: string | null;
  totalWorkoutsCount: number;
  totalRestDays: number;
  synchronizedCount: number;
  pendingCount: number;
  daySummaries: Record<string, {
    date: string;
    dayOfWeek: string;
    volumeKm: number;
    count: number;
    isRestDay: boolean;
  }>;
}

export interface Week {
  id: string;
  title?: string;
  startDate: string;
  endDate: string;
  plannedVolumeKm: number;
  originalPdfVolume?: string | null;
  status: string;
  trainingDays: TrainingDay[];
}

export interface GarminConnectionStatus {
  id?: string | null;
  connected: boolean;
  accountName: string;
  mode: 'production' | 'mock';
  isConfigured: boolean;
  lastSyncAt?: string | null;
  error?: string;
}

export interface SyncLogItem {
  id: string;
  provider: string;
  action: string;
  status: string;
  message: string;
  error?: string | null;
  response?: string | null;
  payload?: string | null;
  createdAt: string;
  workout?: {
    name: string;
  };
}

export interface AIMessageItem {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

export interface AIConversationItem {
  id: string;
  userId: string;
  weekId?: string | null;
  title: string;
  messages?: AIMessageItem[];
  createdAt: string;
  updatedAt: string;
}
