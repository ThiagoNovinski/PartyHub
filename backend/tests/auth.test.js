import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const usuariosEmMemoria = [];
let proximoId = 1;

vi.mock('../src/db.js', () => ({
  pool: { end: vi.fn() },
  query: vi.fn(async (sql, params = []) => {
    const texto = sql.replace(/\s+/g, ' ').trim().toUpperCase();

    if (texto.startsWith('SELECT ID FROM USUARIOS WHERE LOWER(EMAIL) = $1')) {
      const encontrado = usuariosEmMemoria.find((u) => u.email === params[0]);
      return {
        rowCount: encontrado ? 1 : 0,
        rows: encontrado ? [{ id: encontrado.id }] : [],
      };
    }

    if (texto.startsWith('INSERT INTO USUARIOS')) {
      if (usuariosEmMemoria.some((u) => u.email === params[1])) {
        const err = new Error('duplicate key value violates unique constraint');
        err.code = '23505';
        throw err;
      }
      const novo = {
        id: proximoId++,
        nome: params[0],
        email: params[1],
        telefone: params[2],
        senha_hash: params[3],
        perfil: params[4],
        criado_em: '2026-11-15T12:00:00.000Z',
      };
      usuariosEmMemoria.push(novo);
      const { senha_hash: _sh, ...publico } = novo;
      return { rowCount: 1, rows: [publico] };
    }

    if (
      texto.startsWith(
        'SELECT ID, NOME, EMAIL, TELEFONE, SENHA_HASH, PERFIL, CRIADO_EM FROM USUARIOS WHERE LOWER(EMAIL) = $1',
      )
    ) {
      const encontrado = usuariosEmMemoria.find((u) => u.email === params[0]);
      return {
        rowCount: encontrado ? 1 : 0,
        rows: encontrado ? [{ ...encontrado }] : [],
      };
    }

    if (
      texto.startsWith(
        'SELECT ID, NOME, EMAIL, TELEFONE, PERFIL, CRIADO_EM FROM USUARIOS WHERE ID = $1',
      )
    ) {
      const encontrado = usuariosEmMemoria.find((u) => u.id === Number(params[0]));
      if (!encontrado) return { rowCount: 0, rows: [] };
      const { senha_hash: _sh, ...publico } = encontrado;
      return { rowCount: 1, rows: [publico] };
    }

    throw new Error(`Query não mockada no teste: ${sql}`);
  }),
}));

const { default: app } = await import('../src/app.js');
const { autenticar, exigirPerfil } = await import('../src/middlewares/autenticacao.js');
const { tratarErros } = await import('../src/middlewares/tratamentoErros.js');

describe('Autenticação e Perfil (/auth)', () => {
  beforeEach(() => {
    usuariosEmMemoria.length = 0;
    proximoId = 1;
  });

  it('POST /auth/registrar cria conta de cliente e retorna token JWT', async () => {
    const res = await request(app).post('/auth/registrar').send({
      nome: 'Ana Cliente',
      email: 'Ana@PartyHub.com',
      telefone: '(53) 99999-1111',
      senha: '123456',
      perfil: 'cliente',
    });

    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.usuario).toEqual({
      id: 1,
      nome: 'Ana Cliente',
      email: 'ana@partyhub.com',
      telefone: '(53) 99999-1111',
      perfil: 'cliente',
      criado_em: '2026-11-15T12:00:00.000Z',
    });
    expect(res.body.usuario.senha_hash).toBeUndefined();
  });

  it('POST /auth/registrar cria conta de fornecedor sem telefone opcional', async () => {
    const res = await request(app).post('/auth/registrar').send({
      nome: 'Carlos DJ',
      email: 'dj@partyhub.com',
      senha: '123456',
      perfil: 'fornecedor',
    });

    expect(res.status).toBe(201);
    expect(res.body.usuario.perfil).toBe('fornecedor');
    expect(res.body.usuario.telefone).toBeNull();
  });

  it.each([
    ['nome vazio', { nome: '   ', email: 'a@b.com', senha: '123456', perfil: 'cliente' }],
    ['nome > 120 chars', { nome: 'A'.repeat(121), email: 'a@b.com', senha: '123456', perfil: 'cliente' }],
    ['email inválido', { nome: 'Ana', email: 'invalido', senha: '123456', perfil: 'cliente' }],
    ['telefone > 30 chars', { nome: 'Ana', email: 'a@b.com', telefone: '1'.repeat(31), senha: '123456', perfil: 'cliente' }],
    ['senha curta', { nome: 'Ana', email: 'a@b.com', senha: '12345', perfil: 'cliente' }],
    ['perfil inválido', { nome: 'Ana', email: 'a@b.com', senha: '123456', perfil: 'admin' }],
  ])('POST /auth/registrar rejeita %s com 400 DADOS_INVALIDOS', async (_caso, payload) => {
    const res = await request(app).post('/auth/registrar').send(payload);
    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('DADOS_INVALIDOS');
  });

  it('POST /auth/registrar rejeita e-mail duplicado com 409 EMAIL_EM_USO', async () => {
    await request(app).post('/auth/registrar').send({
      nome: 'Carlos DJ',
      email: 'dj@partyhub.com',
      senha: '123456',
      perfil: 'fornecedor',
    });

    const duplicado = await request(app).post('/auth/registrar').send({
      nome: 'Outro DJ',
      email: 'DJ@partyhub.com',
      senha: '123456',
      perfil: 'fornecedor',
    });

    expect(duplicado.status).toBe(409);
    expect(duplicado.body.erro).toBe('EMAIL_EM_USO');
  });

  it('POST /auth/login valida campos obrigatórios, e-mail inexistente e senha incorreta', async () => {
    await request(app).post('/auth/registrar').send({
      nome: 'Carlos DJ',
      email: 'dj@partyhub.com',
      senha: '123456',
      perfil: 'fornecedor',
    });

    const semCampos = await request(app).post('/auth/login').send({ email: '' });
    expect(semCampos.status).toBe(400);
    expect(semCampos.body.erro).toBe('DADOS_INVALIDOS');

    const naoExiste = await request(app).post('/auth/login').send({
      email: 'inexistente@partyhub.com',
      senha: '123456',
    });
    expect(naoExiste.status).toBe(401);
    expect(naoExiste.body.erro).toBe('NAO_AUTENTICADO');

    const senhaErrada = await request(app).post('/auth/login').send({
      email: 'dj@partyhub.com',
      senha: 'senha-errada',
    });
    expect(senhaErrada.status).toBe(401);
    expect(senhaErrada.body.erro).toBe('NAO_AUTENTICADO');

    const sucesso = await request(app).post('/auth/login').send({
      email: 'dj@partyhub.com',
      senha: '123456',
    });
    expect(sucesso.status).toBe(200);
    expect(sucesso.body.token).toEqual(expect.any(String));
    expect(sucesso.body.usuario.perfil).toBe('fornecedor');
    expect(sucesso.body.usuario.senha_hash).toBeUndefined();
  });

  it('GET /auth/eu valida ausência de token, token inválido, usuário inexistente e token válido', async () => {
    const reg = await request(app).post('/auth/registrar').send({
      nome: 'Ana Cliente',
      email: 'ana@partyhub.com',
      senha: '123456',
      perfil: 'cliente',
    });

    const semToken = await request(app).get('/auth/eu');
    expect(semToken.status).toBe(401);
    expect(semToken.body.erro).toBe('NAO_AUTENTICADO');

    const formatoInvalido = await request(app)
      .get('/auth/eu')
      .set('Authorization', 'Basic 123456');
    expect(formatoInvalido.status).toBe(401);

    const tokenInvalido = await request(app)
      .get('/auth/eu')
      .set('Authorization', 'Bearer token.invalido.aqui');
    expect(tokenInvalido.status).toBe(401);

    const comToken = await request(app)
      .get('/auth/eu')
      .set('Authorization', `Bearer ${reg.body.token}`);
    expect(comToken.status).toBe(200);
    expect(comToken.body.email).toBe('ana@partyhub.com');

    usuariosEmMemoria.length = 0;
    const usuarioRemovido = await request(app)
      .get('/auth/eu')
      .set('Authorization', `Bearer ${reg.body.token}`);
    expect(usuarioRemovido.status).toBe(401);
    expect(usuarioRemovido.body.erro).toBe('NAO_AUTENTICADO');
  });

  it('Middleware exigirPerfil bloqueia perfil incorreto com 403 SEM_PERMISSAO e permite perfil correto', async () => {
    const regCliente = await request(app).post('/auth/registrar').send({
      nome: 'Ana Cliente',
      email: 'ana@partyhub.com',
      senha: '123456',
      perfil: 'cliente',
    });
    const regFornecedor = await request(app).post('/auth/registrar').send({
      nome: 'Carlos DJ',
      email: 'dj@partyhub.com',
      senha: '123456',
      perfil: 'fornecedor',
    });

    const appTeste = express();
    appTeste.get(
      '/apenas-fornecedor',
      autenticar,
      exigirPerfil('fornecedor'),
      (_req, res) => res.json({ ok: true }),
    );
    appTeste.use(tratarErros);

    const negado = await request(appTeste)
      .get('/apenas-fornecedor')
      .set('Authorization', `Bearer ${regCliente.body.token}`);
    expect(negado.status).toBe(403);
    expect(negado.body.erro).toBe('SEM_PERMISSAO');

    const permitido = await request(appTeste)
      .get('/apenas-fornecedor')
      .set('Authorization', `Bearer ${regFornecedor.body.token}`);
    expect(permitido.status).toBe(200);
    expect(permitido.body).toEqual({ ok: true });
  });
});
