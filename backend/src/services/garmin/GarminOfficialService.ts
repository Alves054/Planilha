import { GarminProvider, GarminConnectionInfo, GarminPublishResult } from './GarminProvider.js';
import { generateWorkoutSyncHash, convertToGarminWorkoutJson } from './garminWorkoutConverter.js';

export class GarminOfficialService implements GarminProvider {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private apiBaseUrl: string;
  private authBaseUrl: string;

  constructor() {
    this.clientId = process.env.GARMIN_CLIENT_ID || '';
    this.clientSecret = process.env.GARMIN_CLIENT_SECRET || '';
    this.redirectUri = process.env.GARMIN_REDIRECT_URI || 'http://localhost:3001/api/garmin/callback';
    
    // URLs de API e Autorização (configuráveis via .env de acordo com o Portal Garmin Developer)
    this.apiBaseUrl = process.env.GARMIN_API_BASE_URL || 'https://connectapi.garmin.com';
    this.authBaseUrl = process.env.GARMIN_AUTH_BASE_URL || 'https://connect.garmin.com';
  }

  getMode(): 'production' {
    return 'production';
  }

  isConfigured(): boolean {
    return Boolean(this.clientId && this.clientSecret);
  }

  async getAuthUrl(state?: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Garmin Official API não configurada. Defina GARMIN_CLIENT_ID e GARMIN_CLIENT_SECRET no arquivo .env.');
    }
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      state: state || 'pace_training_oauth_state'
    });
    return `${this.authBaseUrl}/oauth-service/oauth/authorize?${params.toString()}`;
  }

  async handleOAuthCallback(code: string): Promise<GarminConnectionInfo> {
    if (!this.isConfigured()) {
      throw new Error('Credenciais da Garmin não configuradas no servidor.');
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/oauth-service/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          client_id: this.clientId,
          client_secret: this.clientSecret,
          redirect_uri: this.redirectUri
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Falha na autenticação OAuth Garmin (${response.status}): ${errText}`);
      }

      const data = await response.json();
      const expiresAt = data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : null;

      return {
        connected: true,
        mode: 'production',
        accountName: data.user_name || 'Conta Garmin Autorizada',
        garminUserId: data.user_id || data.garmin_user_id,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt,
        scope: data.scope || 'training_read_write',
        connectedAt: new Date()
      };
    } catch (err: any) {
      console.error('Erro na troca de código OAuth Garmin:', err);
      throw new Error(err.message || 'Erro ao realizar login no Garmin Connect.');
    }
  }

  async refreshTokenIfNeeded(connection: GarminConnectionInfo): Promise<GarminConnectionInfo> {
    if (!connection.refreshToken) return connection;
    if (connection.expiresAt && new Date(connection.expiresAt).getTime() > Date.now() + 300000) {
      return connection;
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/oauth-service/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: connection.refreshToken,
          client_id: this.clientId,
          client_secret: this.clientSecret
        })
      });

      if (response.ok) {
        const data = await response.json();
        connection.accessToken = data.access_token;
        if (data.refresh_token) connection.refreshToken = data.refresh_token;
        if (data.expires_in) connection.expiresAt = new Date(Date.now() + data.expires_in * 1000);
      }
    } catch (e) {
      console.error('Erro ao renovar token Garmin:', e);
    }

    return connection;
  }

  async publishWorkout(workout: any, date: string, connection: GarminConnectionInfo): Promise<GarminPublishResult> {
    if (!this.isConfigured()) {
      throw new Error('Integração Garmin oficial não configurada. Defina GARMIN_CLIENT_ID e GARMIN_CLIENT_SECRET no .env');
    }

    if (!connection || !connection.accessToken) {
      throw new Error('Conta Garmin Connect não está conectada. Clique em CONECTAR GARMIN.');
    }

    const updatedConn = await this.refreshTokenIfNeeded(connection);
    const payload = convertToGarminWorkoutJson(workout, date);
    const syncHash = generateWorkoutSyncHash(workout);

    try {
      const response = await fetch(`${this.apiBaseUrl}/training-api/workout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${updatedConn.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        const statusMap: Record<number, string> = {
          400: 'Erro de Validação de Payload Garmin (400)',
          401: 'Token de Autenticação Inválido ou Expirado (401)',
          403: 'Acesso Não Autorizado pelo Garmin Developer Program (403)',
          404: 'Endpoint do Garmin Training API Não Encontrado (404)',
          429: 'Limite de Requisições Excedido (Rate Limit 429)',
          500: 'Erro Interno nos Servidores da Garmin (500)'
        };
        const errorMsg = statusMap[response.status] || `Erro na API da Garmin (${response.status})`;

        return {
          workoutId: workout.id,
          garminWorkoutId: '',
          workoutName: workout.name,
          date,
          status: 'FAILED',
          message: `${errorMsg}: ${errorText}`,
          syncHash,
          rawResponse: errorText
        };
      }

      const resData = await response.json();
      const garminId = resData.workoutId || resData.id || `GARMIN-${Date.now()}`;

      return {
        workoutId: workout.id,
        garminWorkoutId: String(garminId),
        workoutName: workout.name,
        date,
        status: 'SUCCESS',
        message: `Treino "${workout.name}" publicado com sucesso no Garmin Connect!`,
        syncHash,
        rawResponse: resData
      };
    } catch (err: any) {
      return {
        workoutId: workout.id,
        garminWorkoutId: '',
        workoutName: workout.name,
        date,
        status: 'FAILED',
        message: `Erro de comunicação com a Garmin API: ${err.message || err}`,
        syncHash
      };
    }
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
