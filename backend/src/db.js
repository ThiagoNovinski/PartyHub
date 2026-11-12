import pg from 'pg';
import { config } from './config.js';

pg.types.setTypeParser(pg.types.builtins.DATE, (valor) => valor);

export const pool = new pg.Pool(config.db);

export function query(texto, parametros) {
  return pool.query(texto, parametros);
}