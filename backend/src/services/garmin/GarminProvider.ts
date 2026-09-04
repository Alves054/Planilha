export interface GarminConnectionInfo {
  id?: string;
  garminUserId?: string;
  accountName?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date | null;
  scope?: string;
  connected: boolean;
  mode: 'production' | 'mock';
  connectedAt?: Date | null;
}

export interface GarminPublishResult {
  workoutId: string;
  garminWorkoutId: string;
  workoutName: string;
  date: string;
  status: 'SUCCESS' | 'FAILED';
  message: string;
  syncHash?: string;
  rawResponse?: any;
}

export interface GarminProvider {
  getMode(): 'production' | 'mock';
  isConfigured(): boolean;
  getAuthUrl(state?: string): Promise<string>;
  handleOAuthCallback(code: string): Promise<GarminConnectionInfo>;
  refreshTokenIfNeeded(connection: GarminConnectionInfo): Promise<GarminConnectionInfo>;
  publishWorkout(workout: any, date: string, connection: GarminConnectionInfo): Promise<GarminPublishResult>;
  publishWeek(workouts: any[], connection: GarminConnectionInfo): Promise<GarminPublishResult[]>;
}
