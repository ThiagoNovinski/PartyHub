import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../db.js';

const dirAtual = path.dirname(fileURLToPath(import.meta.url));
const tipo = process.argv[2];

if (tipo !== 'migrations' && tipo !== 'seeds') {
  console.error('Uso: node src/scripts/executarSql.js <migrations|seeds>');
  process.exit(1);
}

const pastaSql = path.resolve(dirAtual, '../../../database', tipo);

async function executar() {
  try {
    const entradas = await fs.readdir(pastaSql);
    const arquivos = entradas.filter((f) => f.endsWith('.sql')).sort();

    for (const arquivo of arquivos) {
      const caminho = path.join(pastaSql, arquivo);
      const conteudo = await fs.readFile(caminho, 'utf8');
      await pool.query(conteudo);
      console.log(`[${tipo}] Executado: ${arquivo}`);
    }
  } finally {
    await pool.end();
  }
}

executar().catch((err) => {
  console.error(`Erro ao executar ${tipo}:`, err.message);
  process.exit(1);
});
