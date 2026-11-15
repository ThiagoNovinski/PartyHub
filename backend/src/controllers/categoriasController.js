import { query } from '../db.js';

export async function listarCategorias(_req, res) {
  const resultado = await query(
    'SELECT id, nome FROM categorias ORDER BY id ASC',
  );
  res.json(resultado.rows);
}
