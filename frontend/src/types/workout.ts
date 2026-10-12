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
  | 'ACADEMIA'
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
  // Resultados da Execução do Aluno
  actualDistanceKm?: number | null;
  actualPace?: string | null;
  actualDurationMinutes?: number | null;
  actualHeartRate?: number | null;
  feedback?: string | null;
  proofImageUrl?: string | null;
  completedAt?: string | null;
  isCompleted?: boolean;
  syncStatus: SyncStatus;
  garminWorkoutId?: string | null;
  syncHash?: string | null;
  lastSyncedAt?: string | null;
  syncError?: string | null;
  steps: WorkoutStep[];
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkoutResultItem {
  id: string;
  name: string;
  sport: string;
  category: WorkoutCategory;
  time?: string | null;
  period: WorkoutPeriod;
  targetDistanceKm?: number | null;
  estimatedDistanceKm?: number | null;
  targetPaceMin?: string | null;
  targetPaceMax?: string | null;
  actualDistanceKm?: number | null;
  actualPace?: string | null;
  actualDurationMinutes?: number | null;
  actualHeartRate?: number | null;
  feedback?: string | null;
  proofImageUrl?: string | null;
  isCompleted: boolean;
  completedAt?: string | null;
  updatedAt?: string;
  date: string;
  dayOfWeek: string;
  weekTitle?: string | null;
  athlete: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
  };
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

export interface PaceZones {
  paceLeve?: string;
  paceModerado?: string;
  paceControlado?: string;
  paceTiros?: string;
}

export interface Week {
  id: string;
  userId?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    paceLeve?: string;
    paceModerado?: string;
    paceControlado?: string;
    paceTiros?: string;
  };
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

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'COACH' | 'ATHLETE';
  phone?: string | null;
  notes?: string | null;
  paceLeve?: string;
  paceModerado?: string;
  paceControlado?: string;
  paceTiros?: string;
  coachId?: string | null;
}

export interface AthleteItem {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  notes?: string | null;
  paceLeve?: string;
  paceModerado?: string;
  paceControlado?: string;
  paceTiros?: string;
  createdAt: string;
  latestWeek?: {
    id: string;
    title: string;
    plannedVolumeKm: number;
    startDate: string;
    endDate: string;
    status: string;
  } | null;
}
