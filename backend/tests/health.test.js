import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/app.js';

describe('Rotas Base e Healthcheck', () => {
  it('GET /health responde 200 com { status: "ok" }', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('Rota inexistente responde 404 no padrão da API', async () => {
    const res = await request(app).get('/rota-inexistente');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      erro: 'NAO_ENCONTRADO',
      mensagem: 'Rota não encontrada.',
    });
  });
});