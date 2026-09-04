import { Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { GarminServiceFactory } from '../services/garmin/GarminServiceFactory.js';

export async function getGarminAuthUrl(req: Request, res: Response) {
  try {
    const provider = GarminServiceFactory.getProvider();
    if (provider.getMode() === 'production' && !provider.isConfigured()) {
      return res.status(400).json({
        error: 'Integração Garmin oficial não configurada. Defina GARMIN_CLIENT_ID e GARMIN_CLIENT_SECRET no arquivo .env no servidor.'
      });
    }
    const url = await provider.getAuthUrl();
    return res.json({ url, mode: provider.getMode() });
  } catch (error: any) {
    console.error('Erro ao gerar URL OAuth Garmin:', error);
    return res.status(500).json({ error: error.message || 'Erro ao gerar URL de autorização.' });
  }
}

export async function handleGarminCallback(req: Request, res: Response) {
  try {
    const { code } = req.query;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Código de autorização OAuth ausente.' });
    }

    const provider = GarminServiceFactory.getProvider();
    const connInfo = await provider.handleOAuthCallback(code);

    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: { name: 'Paulo Henrique', email: 'paulo@pacetraining.com' }
      });
    }

    let existing = await prisma.garminConnection.findFirst({ where: { userId: user.id } });
    if (existing) {
      await prisma.garminConnection.update({
        where: { id: existing.id },
        data: {
          connected: true,
          accountName: connInfo.accountName || 'Conta Garmin',
          garminUserId: connInfo.garminUserId,
          accessToken: connInfo.accessToken,
          refreshToken: connInfo.refreshToken,
          expiresAt: connInfo.expiresAt,
          scope: connInfo.scope,
          mode: connInfo.mode,
          connectedAt: new Date()
        }
      });
    } else {
      await prisma.garminConnection.create({
        data: {
          userId: user.id,
          connected: true,
          accountName: connInfo.accountName || 'Conta Garmin',
          garminUserId: connInfo.garminUserId,
          accessToken: connInfo.accessToken,
          refreshToken: connInfo.refreshToken,
          expiresAt: connInfo.expiresAt,
          scope: connInfo.scope,
          mode: connInfo.mode,
          connectedAt: new Date()
        }
      });
    }

    // Redireciona de volta para a aplicação web
    return res.redirect('http://localhost:5173/?garmin_connected=true');
  } catch (error: any) {
    console.error('Erro no callback OAuth Garmin:', error);
    return res.status(500).send(`
      <h2>Erro ao autorizar Garmin Connect</h2>
      <p>${error.message || 'Falha no processamento OAuth.'}</p>
      <a href="http://localhost:5173">Voltar para o Pace Training</a>
    `);
  }
}

export async function disconnectGarmin(req: Request, res: Response) {
  try {
    const conn = await prisma.garminConnection.findFirst();
    if (conn) {
      await prisma.garminConnection.update({
        where: { id: conn.id },
        data: {
          connected: false,
          accessToken: null,
          refreshToken: null,
          expiresAt: null
        }
      });
    }
    return res.json({ message: 'Garmin desconectado com sucesso.' });
  } catch (error) {
    console.error('Erro ao desconectar Garmin:', error);
    return res.status(500).json({ error: 'Erro ao desconectar Garmin.' });
  }
}
