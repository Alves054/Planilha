import dotenv from 'dotenv';
dotenv.config();

import { app } from './app.js';
import { seedInitialData } from './seed.js';

const PORT = process.env.PORT || 3001;

async function startLocalServer() {
  try {
    await seedInitialData();
  } catch (err) {
    console.error('Aviso na semeadura inicial:', err);
  }

  app.listen(PORT, () => {
    console.log(`\n🚀 Pace Training Backend rodando localmente na porta ${PORT}`);
    console.log(`👉 http://localhost:${PORT}/api/weeks/current\n`);
  });
}

startLocalServer();
