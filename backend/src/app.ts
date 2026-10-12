import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { routes } from './routes.js';

export const app = express();

// Configuração do Multer — armazenamento em memória para PDF e imagens
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'image/gif'
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de arquivo não permitido: ${file.mimetype}`));
    }
  }
});

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Servir arquivos de uploads (comprovantes e fotos de treinos)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Rota de Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', system: 'Pace Training API', timestamp: new Date().toISOString() });
});
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', system: 'Pace Training API', timestamp: new Date().toISOString() });
});

// Suporte a rotas com e sem o prefixo /api
app.use('/api', routes);

// Servir frontend compilado (diretório public local ou ../frontend/dist)
const publicDir = path.join(process.cwd(), 'public');
const frontendDist = path.join(process.cwd(), '../frontend/dist');
const staticDir = fs.existsSync(publicDir) ? publicDir : (fs.existsSync(frontendDist) ? frontendDist : null);

if (staticDir) {
  app.use(express.static(staticDir));
}

// Rotas raiz de API legadas (compatibilidade)
app.use('/', routes);

// SPA fallback para qualquer rota web não capturada pela API
if (staticDir) {
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    const indexPath = path.join(staticDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    next();
  });
}

// Middleware Global de Tratamento de Erros
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[SERVER ERROR]:', err);
  res.status(500).json({ error: err.message || 'Erro interno do servidor.' });
});
