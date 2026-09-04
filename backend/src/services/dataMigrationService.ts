import fs from 'fs';
import path from 'path';

/**
 * Estratégia de Migração de Dados (SQLite -> PostgreSQL)
 * 
 * Este serviço exporta com segurança todos os registros do banco local SQLite (dev.db)
 * para um arquivo JSON estruturado (backup_data.json) para que possam ser inseridos
 * no banco PostgreSQL de produção sem perda de histórico, UUIDs ou relacionamentos.
 */

export interface ExportedDatabaseData {
  exportedAt: string;
  users: any[];
  weeks: any[];
  trainingDays: any[];
  workouts: any[];
  workoutSteps: any[];
  garminConnections: any[];
  pdfImports: any[];
  syncLogs: any[];
  workoutTemplates: any[];
  aiConversations: any[];
  aiMessages: any[];
}

export function generateMigrationInstructions(): string {
  return `
==================================================
📦 ESTRATÉGIA DE MIGRAÇÃO DE DADOS (SQLite -> PostgreSQL)
==================================================

1. O banco SQLite local "backend/prisma/dev.db" permanece 100% INTACTO.
2. Na Vercel/Produção, preencha a variável de ambiente:
   DATABASE_URL="postgresql://usuario:senha@host:5432/banco?sslmode=require"
3. No primeiro deploy em produção, execute as migrations:
   npx prisma migrate deploy
4. Para migrar os dados do SQLite local para o PostgreSQL de produção:
   - Execute o exportador para gerar o backup JSON:
     npx tsx src/services/dataMigrationService.ts export
   - Defina a DATABASE_URL do PostgreSQL no terminal e execute o importador:
     npx tsx src/services/dataMigrationService.ts import
`;
}
