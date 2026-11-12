import app from './app.js';
import { config } from './config.js';
import { pool } from './db.js';

config.jwtSecret();

const servidor = app.listen(config.port, () => {
  console.log(`API PartyHub ouvindo na porta ${config.port}`);
});

function encerrar() {
  servidor.close(() => {
    pool.end().finally(() => process.exit(0));
  });
}

process.on('SIGTERM', encerrar);
process.on('SIGINT', encerrar);