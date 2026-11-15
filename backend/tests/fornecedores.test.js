import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { config } from '../src/config.js';

const categoriasMemoria = [
  { id: 1, nome: 'DJ' },
  { id: 2, nome: 'Buffet' },
  { id: 3, nome: 'Sonorização' },
];
const fornecedoresMemoria = [];
const servicosMemoria = [];
let proximoFornecedorId = 1;
let proximoServicoId = 1;

vi.mock('../src/db.js', () => ({
  pool: { end: vi.fn() },
  query: vi.fn(async (sql, params = []) => {
    const texto = sql.replace(/\s+/g, ' ').trim().toUpperCase();

    if (texto.startsWith('SELECT ID, NOME FROM CATEGORIAS ORDER BY ID ASC')) {
      return { rowCount: categoriasMemoria.length, rows: [...categoriasMemoria] };
    }

    if (texto.startsWith('SELECT ID, NOME FROM CATEGORIAS WHERE ID = $1')) {
      const cat = categoriasMemoria.find((c) => c.id === Number(params[0]));
      return { rowCount: cat ? 1 : 0, rows: cat ? [cat] : [] };
    }

    if (texto.includes('FROM FORNECEDORES WHERE USUARIO_ID = $1')) {
      const forn = fornecedoresMemoria.find(
        (f) => f.usuario_id === Number(params[0]),
      );
      return { rowCount: forn ? 1 : 0, rows: forn ? [{ ...forn }] : [] };
    }

    if (texto.startsWith('INSERT INTO FORNECEDORES')) {
      const [
        usuario_id,
        nome_empresa,
        descricao,
        cidade,
        telefone_contato,
        whatsapp,
        email_contato,
      ] = params;
      let forn = fornecedoresMemoria.find((f) => f.usuario_id === usuario_id);
      if (forn) {
        Object.assign(forn, {
          nome_empresa,
          descricao,
          cidade,
          telefone_contato,
          whatsapp,
          email_contato,
        });
      } else {
        forn = {
          id: proximoFornecedorId++,
          usuario_id,
          nome_empresa,
          descricao,
          cidade,
          telefone_contato,
          whatsapp,
          email_contato,
          ativo: true,
        };
        fornecedoresMemoria.push(forn);
      }
      return { rowCount: 1, rows: [{ ...forn }] };
    }

    if (texto.includes('FROM FORNECEDORSERVICOS FS JOIN CATEGORIAS C') && texto.includes('WHERE FS.FORNECEDOR_ID = $1')) {
      const lista = servicosMemoria
        .filter((s) => s.fornecedor_id === Number(params[0]))
        .map((s) => {
          const cat = categoriasMemoria.find((c) => c.id === s.categoria_id);
          return { ...s, categoria_nome: cat?.nome };
        });
      return { rowCount: lista.length, rows: lista };
    }

    if (texto.includes('FROM FORNECEDORSERVICOS FS JOIN CATEGORIAS C') && texto.includes('WHERE FS.ID = $1')) {
      const s = servicosMemoria.find((item) => item.id === Number(params[0]));
      if (!s) return { rowCount: 0, rows: [] };
      const cat = categoriasMemoria.find((c) => c.id === s.categoria_id);
      return {
        rowCount: 1,
        rows: [{ ...s, categoria_nome: cat?.nome }],
      };
    }

    if (texto.includes('FROM FORNECEDORSERVICOS FS JOIN CATEGORIAS C') && !texto.includes('WHERE')) {
      const lista = servicosMemoria.map((s) => {
        const cat = categoriasMemoria.find((c) => c.id === s.categoria_id);
        return { ...s, categoria_nome: cat?.nome };
      });
      return { rowCount: lista.length, rows: lista };
    }

    if (texto.startsWith('SELECT ID FROM FORNECEDORSERVICOS WHERE FORNECEDOR_ID = $1 AND CATEGORIA_ID = $2')) {
      const dup = servicosMemoria.find(
        (s) =>
          s.fornecedor_id === Number(params[0]) &&
          s.categoria_id === Number(params[1]),
      );
      return { rowCount: dup ? 1 : 0, rows: dup ? [{ id: dup.id }] : [] };
    }

    if (texto.startsWith('INSERT INTO FORNECEDORSERVICOS')) {
      const novo = {
        id: proximoServicoId++,
        fornecedor_id: params[0],
        categoria_id: params[1],
        descricao: params[2],
        preco_referencia: params[3],
      };
      servicosMemoria.push(novo);
      return { rowCount: 1, rows: [{ ...novo }] };
    }

    if (texto.startsWith('UPDATE FORNECEDORSERVICOS')) {
      const s = servicosMemoria.find((item) => item.id === Number(params[2]));
      s.descricao = params[0];
      s.preco_referencia = params[1];
      return { rowCount: 1, rows: [{ ...s }] };
    }

    if (texto.startsWith('SELECT ID, FORNECEDOR_ID FROM FORNECEDORSERVICOS WHERE ID = $1')) {
      const s = servicosMemoria.find((item) => item.id === Number(params[0]));
      return { rowCount: s ? 1 : 0, rows: s ? [{ ...s }] : [] };
    }

    if (texto.startsWith('DELETE FROM FORNECEDORSERVICOS WHERE ID = $1')) {
      const idx = servicosMemoria.findIndex(
        (item) => item.id === Number(params[0]),
      );
      if (idx >= 0) servicosMemoria.splice(idx, 1);
      return { rowCount: 1, rows: [] };
    }

    if (texto.startsWith('UPDATE FORNECEDORES SET ATIVO = $1 WHERE USUARIO_ID = $2')) {
      const forn = fornecedoresMemoria.find(
        (f) => f.usuario_id === Number(params[1]),
      );
      if (!forn) return { rowCount: 0, rows: [] };
      forn.ativo = params[0];
      return { rowCount: 1, rows: [{ ...forn }] };
    }

    if (texto.includes('FROM FORNECEDORES WHERE ATIVO = TRUE')) {
      const ativos = fornecedoresMemoria.filter((f) => f.ativo);
      return { rowCount: ativos.length, rows: ativos.map((f) => ({ ...f })) };
    }

    if (texto.includes('FROM FORNECEDORES WHERE ID = $1')) {
      const forn = fornecedoresMemoria.find((f) => f.id === Number(params[0]));
      return { rowCount: forn ? 1 : 0, rows: forn ? [{ ...forn }] : [] };
    }

    throw new Error(`Query não mockada no teste: ${sql}`);
  }),
}));

const { default: app } = await import('../src/app.js');

function tokenPara(id, perfil) {
  return jwt.sign({ sub: id, perfil }, config.jwtSecret(), { expiresIn: '1h' });
}

describe('Categorias, Catálogo e Perfil de Fornecedor', () => {
  const tokenFornecedor1 = tokenPara(10, 'fornecedor');
  const tokenFornecedor2 = tokenPara(20, 'fornecedor');
  const tokenCliente = tokenPara(30, 'cliente');

  beforeEach(() => {
    fornecedoresMemoria.length = 0;
    servicosMemoria.length = 0;
    proximoFornecedorId = 1;
    proximoServicoId = 1;
  });

  it('GET /categorias lista as categorias de serviço', async () => {
    const res = await request(app).get('/categorias');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(categoriasMemoria);
  });

  it('PUT /fornecedores/meu exige perfil fornecedor, valida campos e faz upsert do perfil', async () => {
    const proibido = await request(app)
      .put('/fornecedores/meu')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ nome_empresa: 'Empresa X', telefone_contato: '5399999999' });
    expect(proibido.status).toBe(403);
    expect(proibido.body.erro).toBe('SEM_PERMISSAO');

    const invalido = await request(app)
      .put('/fornecedores/meu')
      .set('Authorization', `Bearer ${tokenFornecedor1}`)
      .send({ nome_empresa: '' });
    expect(invalido.status).toBe(400);
    expect(invalido.body.erro).toBe('DADOS_INVALIDOS');

    const criado = await request(app)
      .put('/fornecedores/meu')
      .set('Authorization', `Bearer ${tokenFornecedor1}`)
      .send({
        nome_empresa: 'Carlos Som & DJ Pro',
        descricao: 'Pista animada',
        cidade: 'Rio Grande',
        telefone_contato: '(53) 98888-2222',
        whatsapp: '(53) 98888-2222',
        email_contato: 'dj@partyhub.com',
      });

    expect(criado.status).toBe(200);
    expect(criado.body.nome_empresa).toBe('Carlos Som & DJ Pro');
    expect(criado.body.ativo).toBe(true);
    expect(criado.body.servicos).toEqual([]);

    const atualizado = await request(app)
      .put('/fornecedores/meu')
      .set('Authorization', `Bearer ${tokenFornecedor1}`)
      .send({
        nome_empresa: 'Carlos DJ Atualizado',
        cidade: 'Pelotas',
        telefone_contato: '(53) 98888-0000',
      });

    expect(atualizado.status).toBe(200);
    expect(atualizado.body.id).toBe(criado.body.id);
    expect(atualizado.body.nome_empresa).toBe('Carlos DJ Atualizado');
    expect(atualizado.body.cidade).toBe('Pelotas');
  });

  it('Gerencia serviços do fornecedor (POST, PUT, DELETE) e impede duplicidade ou acesso de outro fornecedor', async () => {
    const semPerfil = await request(app)
      .post('/fornecedores/meu/servicos')
      .set('Authorization', `Bearer ${tokenFornecedor1}`)
      .send({ categoria_id: 1, descricao: 'DJ' });
    expect(semPerfil.status).toBe(404);

    await request(app)
      .put('/fornecedores/meu')
      .set('Authorization', `Bearer ${tokenFornecedor1}`)
      .send({
        nome_empresa: 'Carlos Som & DJ Pro',
        cidade: 'Rio Grande',
        telefone_contato: '(53) 98888-2222',
      });

    await request(app)
      .put('/fornecedores/meu')
      .set('Authorization', `Bearer ${tokenFornecedor2}`)
      .send({
        nome_empresa: 'Maria Buffet',
        cidade: 'Rio Grande',
        telefone_contato: '(53) 97777-3333',
      });

    const catInexistente = await request(app)
      .post('/fornecedores/meu/servicos')
      .set('Authorization', `Bearer ${tokenFornecedor1}`)
      .send({ categoria_id: 999, descricao: 'Inexistente' });
    expect(catInexistente.status).toBe(404);

    const servicoCriado = await request(app)
      .post('/fornecedores/meu/servicos')
      .set('Authorization', `Bearer ${tokenFornecedor1}`)
      .send({
        categoria_id: 1,
        descricao: 'Set de 5 horas',
        preco_referencia: 'a partir de R$ 800',
      });
    expect(servicoCriado.status).toBe(201);
    expect(servicoCriado.body.categoria_nome).toBe('DJ');

    const duplicado = await request(app)
      .post('/fornecedores/meu/servicos')
      .set('Authorization', `Bearer ${tokenFornecedor1}`)
      .send({ categoria_id: 1, descricao: 'Outro DJ' });
    expect(duplicado.status).toBe(409);
    expect(duplicado.body.erro).toBe('SERVICO_DUPLICADO');

    const edicaoOutroFornecedor = await request(app)
      .put(`/fornecedores/meu/servicos/${servicoCriado.body.id}`)
      .set('Authorization', `Bearer ${tokenFornecedor2}`)
      .send({ descricao: 'Tentativa indevida' });
    expect(edicaoOutroFornecedor.status).toBe(403);
    expect(edicaoOutroFornecedor.body.erro).toBe('SEM_PERMISSAO');

    const editado = await request(app)
      .put(`/fornecedores/meu/servicos/${servicoCriado.body.id}`)
      .set('Authorization', `Bearer ${tokenFornecedor1}`)
      .send({
        descricao: 'Set completo de 6 horas',
        preco_referencia: 'a partir de R$ 950',
      });
    expect(editado.status).toBe(200);
    expect(editado.body.descricao).toBe('Set completo de 6 horas');

    const remocaoOutro = await request(app)
      .delete(`/fornecedores/meu/servicos/${servicoCriado.body.id}`)
      .set('Authorization', `Bearer ${tokenFornecedor2}`);
    expect(remocaoOutro.status).toBe(403);

    const removido = await request(app)
      .delete(`/fornecedores/meu/servicos/${servicoCriado.body.id}`)
      .set('Authorization', `Bearer ${tokenFornecedor1}`);
    expect(removido.status).toBe(204);
  });

  it('GET /fornecedores aplica regra de ativo + ao menos 1 serviço, filtros e GET /fornecedores/:id', async () => {
    await request(app)
      .put('/fornecedores/meu')
      .set('Authorization', `Bearer ${tokenFornecedor1}`)
      .send({
        nome_empresa: 'Carlos Som & DJ Pro',
        cidade: 'Rio Grande',
        telefone_contato: '(53) 98888-2222',
      });

    await request(app)
      .put('/fornecedores/meu')
      .set('Authorization', `Bearer ${tokenFornecedor2}`)
      .send({
        nome_empresa: 'Maria Buffet',
        cidade: 'Pelotas',
        telefone_contato: '(53) 97777-3333',
      });

    // Sem serviços, nenhum fornecedor aparece no catálogo
    const catalogoVazio = await request(app).get('/fornecedores');
    expect(catalogoVazio.status).toBe(200);
    expect(catalogoVazio.body).toEqual([]);

    // Adiciona serviços aos dois fornecedores
    await request(app)
      .post('/fornecedores/meu/servicos')
      .set('Authorization', `Bearer ${tokenFornecedor1}`)
      .send({ categoria_id: 1, descricao: 'DJ completo' });
    await request(app)
      .post('/fornecedores/meu/servicos')
      .set('Authorization', `Bearer ${tokenFornecedor2}`)
      .send({ categoria_id: 2, descricao: 'Buffet infantil' });

    const catalogoCompleto = await request(app).get('/fornecedores');
    expect(catalogoCompleto.body).toHaveLength(2);

    const porCategoriaId = await request(app).get('/fornecedores?categoria=1');
    expect(porCategoriaId.body).toHaveLength(1);
    expect(porCategoriaId.body[0].nome_empresa).toBe('Carlos Som & DJ Pro');

    const porCategoriaNome = await request(app).get(
      '/fornecedores?categoria=buffet',
    );
    expect(porCategoriaNome.body).toHaveLength(1);
    expect(porCategoriaNome.body[0].nome_empresa).toBe('Maria Buffet');

    const porCidade = await request(app).get(
      '/fornecedores?cidade=rio%20grande',
    );
    expect(porCidade.body).toHaveLength(1);
    expect(porCidade.body[0].nome_empresa).toBe('Carlos Som & DJ Pro');

    // Desativar fornecedor 1 oculta do catálogo
    const desativado = await request(app)
      .patch('/fornecedores/meu/ativo')
      .set('Authorization', `Bearer ${tokenFornecedor1}`)
      .send({ ativo: false });
    expect(desativado.status).toBe(200);
    expect(desativado.body.ativo).toBe(false);

    const catalogoAposDesativar = await request(app).get('/fornecedores');
    expect(catalogoAposDesativar.body).toHaveLength(1);
    expect(catalogoAposDesativar.body[0].nome_empresa).toBe('Maria Buffet');

    // Detalhe por ID
    const detalhe = await request(app).get('/fornecedores/1');
    expect(detalhe.status).toBe(200);
    expect(detalhe.body.nome_empresa).toBe('Carlos Som & DJ Pro');
    expect(detalhe.body.servicos).toHaveLength(1);

    const naoEncontradoRes = await request(app).get('/fornecedores/999');
    expect(naoEncontradoRes.status).toBe(404);
    expect(naoEncontradoRes.body.erro).toBe('NAO_ENCONTRADO');
  });
});
