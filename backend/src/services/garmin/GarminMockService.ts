import { GarminProvider, GarminConnectionInfo, GarminPublishResult } from './GarminProvider.js';
import { generateWorkoutSyncHash, convertToGarminWorkoutJson } from './garminWorkoutConverter.js';

export class GarminMockService implements GarminProvider {
  getMode(): 'mock' {
    return 'mock';
  }

  isConfigured(): boolean {
    return true;
  }

  async getAuthUrl(): Promise<string> {
    const redirectUri = process.env.GARMIN_REDIRECT_URI || 'http://localhost:3001/api/garmin/callback';
    return `${redirectUri}?code=MOCK_OAUTH_CODE_123456`;
  }

  async handleOAuthCallback(code: string): Promise<GarminConnectionInfo> {
    return {
      connected: true,
      mode: 'mock',
      accountName: 'Paulo Henrique (Garmin Mock)',
      garminUserId: 'MOCK-USER-999',
      accessToken: 'MOCK_ACCESS_TOKEN_ABCXYZ',
      refreshToken: 'MOCK_REFRESH_TOKEN_ABCXYZ',
      expiresAt: new Date(Date.now() + 3600 * 24 * 30 * 1000), // 30 dias
      connectedAt: new Date()
    };
  }

  async refreshTokenIfNeeded(connection: GarminConnectionInfo): Promise<GarminConnectionInfo> {
    return connection;
  }

  async publishWorkout(workout: any, date: string, connection: GarminConnectionInfo): Promise<GarminPublishResult> {
    const garminJson = convertToGarminWorkoutJson(workout, date);
    const syncHash = generateWorkoutSyncHash(workout);
    const mockGarminWorkoutId = `GARMIN-MOCK-${Math.floor(Math.random() * 899999 + 100000)}`;

    return {
      workoutId: workout.id,
      garminWorkoutId: mockGarminWorkoutId,
      workoutName: workout.name,
      date,
      status: 'SUCCESS',
      message: `[MOCK MODE] Treino "${workout.name}" publicado com sucesso no Garmin Connect (Simulação).`,
      syncHash,
      rawResponse: { mock: true, payloadSent: garminJson }
    };
  }

  async publishWeek(workouts: any[], connection: GarminConnectionInfo): Promise<GarminPublishResult[]> {
    const results: GarminPublishResult[] = [];
    for (const w of workouts) {
      const date = w.trainingDay ? w.trainingDay.date : '2026-09-07';
      const res = await this.publishWorkout(w, date, connection);
      results.push(res);
    }
    return results;
  }
}
