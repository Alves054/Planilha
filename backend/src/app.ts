import express from 'express';
import cors from 'cors';
import { routes } from './routes.js';

export const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Suporte a rotas com e sem o prefixo /api (Garante compatibilidade total com Vercel Services e dev local)
app.use('/api', routes);
app.use('/', routes);

// Rota de Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', system: 'Pace Training API', timestamp: new Date().toISOString() });
});
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', system: 'Pace Training API', timestamp: new Date().toISOString() });
});

// Middleware Global de Tratamento de Erros
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[SERVER ERROR]:', err);
  res.status(500).json({ error: err.message || 'Erro interno do servidor.' });
});
