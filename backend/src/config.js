import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const dirAtual = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(dirAtual, '../../.env'), quiet: true });

const env = process.env.NODE_ENV || 'development';

export const config = {
  env,
  port: Number(process.env.API_PORT) || 3000,
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 10,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  db: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: Number(process.env.POSTGRES_PORT) || 5432,
    database: process.env.POSTGRES_DB || 'partyhub',
    user: process.env.POSTGRES_USER || 'partyhub',
    password: process.env.POSTGRES_PASSWORD,
  },
  jwtSecret() {
    const segredo = process.env.JWT_SECRET;
    if (!segredo) {
      throw new Error('Variável de ambiente JWT_SECRET não definida.');
    }
    if (env === 'production' && segredo.length < 32) {
      throw new Error('JWT_SECRET deve ter pelo menos 32 caracteres em produção.');
    }
    return segredo;
  },
};