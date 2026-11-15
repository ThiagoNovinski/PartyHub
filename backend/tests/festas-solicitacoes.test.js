import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { config } from '../src/config.js';

const categoriasMemoria = [
  { id: 1, nome: 'DJ' },
  { id: 2, nome: 'Buffet' },
];
const fornecedoresMemoria = [
  {
    id: 1,
    usuario_id: 10,
    nome_empresa: 'Carlos Som & DJ Pro',
    telefone_contato: '(53) 98888-2222',
    whatsapp: '(53) 98888-2222',
    email_contato: 'dj@partyhub.com',
    ativo: true,
  },
  {
    id: 2,
    usuario_id: 20,
    nome_empresa: 'Maria Buffet',
    telefone_contato: '(53) 97777-3333',
    whatsapp: '(53) 97777-3333',
    email_contato: 'buffet@partyhub.com',
    ativo: true,
  },
];
const servicosMemoria = [
  { id: 1, fornecedor_id: 1, categoria_id: 1, descricao: 'DJ completo' },
  { id: 2, fornecedor_id: 2, categoria_id: 2, descricao: 'Buffet infantil' },
];
const festasMemoria = [];
const solicitacoesMemoria = [];
let proximaFestaId = 1;
let proximaSolicitacaoId = 1;

vi.mock('../src/db.js', () => ({
  pool: { end: vi.fn() },
  query: vi.fn(async (sql, params = []) => {
    const texto = sql.replace(/\s+/g, ' ').trim().toUpperCase();

    if (texto.includes('FROM FESTAS WHERE CLIENTE_ID = $1')) {
      const lista = festasMemoria.filter(
        (f) => f.cliente_id === Number(params[0]),
      );
      return { rowCount: lista.length, rows: lista.map((f) => ({ ...f })) };
    }

    if (texto.startsWith('INSERT INTO FESTAS')) {
      const nova = {
        id: proximaFestaId++,
        cliente_id: params[0],
        titulo: params[1],
        data: params[2],
        hora_inicio: params[3],
        hora_fim: params[4],
        local: params[5],
        qtd_convidados: params[6],
        tema: params[7],
        observacoes: params[8],
        status: 'PLANEJANDO',
      };
      festasMemoria.push(nova);
      return { rowCount: 1, rows: [{ ...nova }] };
    }

    if (texto.includes('FROM FESTAS WHERE ID = $1')) {
      const f = festasMemoria.find((item) => item.id === Number(params[0]));
      return { rowCount: f ? 1 : 0, rows: f ? [{ ...f }] : [] };
    }

    if (texto.startsWith('UPDATE FESTAS SET TITULO = $1')) {
      const f = festasMemoria.find((item) => item.id === Number(params[9]));
      Object.assign(f, {
        titulo: params[0],
        data: params[1],
        hora_inicio: params[2],
        hora_fim: params[3],
        local: params[4],
        qtd_convidados: params[5],
        tema: params[6],
        observacoes: params[7],
        status: params[8],
      });
      return { rowCount: 1, rows: [{ ...f }] };
    }

    if (texto.startsWith("UPDATE FESTAS SET STATUS = 'CANCELADA' WHERE ID = $1")) {
      const f = festasMemoria.find((item) => item.id === Number(params[0]));
      f.status = 'CANCELADA';
      return { rowCount: 1, rows: [{ ...f }] };
    }

    if (
      texto.startsWith(
        "UPDATE SOLICITACOES SET STATUS = 'CANCELADA' WHERE FESTA_ID = $1 AND STATUS = 'PENDENTE'",
      )
    ) {
      let count = 0;
      for (const s of solicitacoesMemoria) {
        if (s.festa_id === Number(params[0]) && s.status === 'PENDENTE') {
          s.status = 'CANCELADA';
          count++;
        }
      }
      return { rowCount: count, rows: [] };
    }

    if (texto.includes('FROM SOLICITACOES S JOIN FORNECEDORES F') && texto.includes('WHERE S.FESTA_ID = $1')) {
      const lista = solicitacoesMemoria
        .filter((s) => s.festa_id === Number(params[0]))
        .map((s) => {
          const forn = fornecedoresMemoria.find((f) => f.id === s.fornecedor_id);
          const cat = categoriasMemoria.find((c) => c.id === s.categoria_id);
          return {
            ...s,
            fornecedor_nome: forn?.nome_empresa,
            telefone_contato: forn?.telefone_contato,
            whatsapp: forn?.whatsapp,
            email_contato: forn?.email_contato,
            categoria_nome: cat?.nome,
          };
        });
      return { rowCount: lista.length, rows: lista };
    }

    if (texto.startsWith('SELECT ID, ATIVO FROM FORNECEDORES WHERE ID = $1')) {
      const forn = fornecedoresMemoria.find((f) => f.id === Number(params[0]));
      return { rowCount: forn ? 1 : 0, rows: forn ? [{ ...forn }] : [] };
    }

    if (
      texto.startsWith(
        'SELECT ID FROM FORNECEDORSERVICOS WHERE FORNECEDOR_ID = $1 AND CATEGORIA_ID = $2',
      )
    ) {
      const serv = servicosMemoria.find(
        (s) =>
          s.fornecedor_id === Number(params[0]) &&
          s.categoria_id === Number(params[1]),
      );
      return { rowCount: serv ? 1 : 0, rows: serv ? [{ id: serv.id }] : [] };
    }

    if (
      texto.startsWith(
        'SELECT ID FROM SOLICITACOES WHERE FESTA_ID = $1 AND FORNECEDOR_ID = $2 AND CATEGORIA_ID = $3',
      )
    ) {
      const dup = solicitacoesMemoria.find(
        (s) =>
          s.festa_id === Number(params[0]) &&
          s.fornecedor_id === Number(params[1]) &&
          s.categoria_id === Number(params[2]),
      );
      return { rowCount: dup ? 1 : 0, rows: dup ? [{ id: dup.id }] : [] };
    }

    if (texto.startsWith('INSERT INTO SOLICITACOES')) {
      const nova = {
        id: proximaSolicitacaoId++,
        festa_id: params[0],
        fornecedor_id: params[1],
        categoria_id: params[2],
        mensagem: params[3],
        status: 'PENDENTE',
        resposta: null,
        criado_em: '2026-11-15T12:00:00.000Z',
        respondido_em: null,
      };
      solicitacoesMemoria.push(nova);
      return { rowCount: 1, rows: [{ ...nova }] };
    }

    if (texto.includes('FROM SOLICITACOES S JOIN FESTAS F') && texto.includes('WHERE S.ID = $1')) {
      const s = solicitacoesMemoria.find((item) => item.id === Number(params[0]));
      if (!s) return { rowCount: 0, rows: [] };
      const f = festasMemoria.find((item) => item.id === s.festa_id);
      return {
        rowCount: 1,
        rows: [{ ...s, cliente_id: f?.cliente_id }],
      };
    }

    if (texto.startsWith("UPDATE SOLICITACOES SET STATUS = 'CANCELADA' WHERE ID = $1")) {
      const s = solicitacoesMemoria.find((item) => item.id === Number(params[0]));
      s.status = 'CANCELADA';
      return { rowCount: 1, rows: [{ ...s }] };
    }

    throw new Error(`Query não mockada no teste: ${sql}`);
  }),
}));

const { default: app } = await import('../src/app.js');

function tokenPara(id, perfil) {
  return jwt.sign({ sub: id, perfil }, config.jwtSecret(), { expiresIn: '1h' });
}

describe('Festas, Stack e Solicitações do Cliente (/festas e /solicitacoes)', () => {
  const tokenCliente1 = tokenPara(100, 'cliente');
  const tokenCliente2 = tokenPara(200, 'cliente');
  const tokenFornecedor = tokenPara(10, 'fornecedor');

  beforeEach(() => {
    festasMemoria.length = 0;
    solicitacoesMemoria.length = 0;
    proximaFestaId = 1;
    proximaSolicitacaoId = 1;
  });

  it('POST /festas cria festa e valida horários, datas e perfil cliente', async () => {
    const proibido = await request(app)
      .post('/festas')
      .set('Authorization', `Bearer ${tokenFornecedor}`)
      .send({
        titulo: 'Festa',
        data: '2026-12-10',
        hora_inicio: '14:00',
        hora_fim: '18:00',
      });
    expect(proibido.status).toBe(403);
    expect(proibido.body.erro).toBe('SEM_PERMISSAO');

    const horarioInvalido = await request(app)
      .post('/festas')
      .set('Authorization', `Bearer ${tokenCliente1}`)
      .send({
        titulo: 'Aniversário do Pedro',
        data: '2026-12-10',
        hora_inicio: '18:00',
        hora_fim: '14:00',
      });
    expect(horarioInvalido.status).toBe(400);
    expect(horarioInvalido.body.erro).toBe('DADOS_INVALIDOS');

    const dataInvalida = await request(app)
      .post('/festas')
      .set('Authorization', `Bearer ${tokenCliente1}`)
      .send({
        titulo: 'Aniversário do Pedro',
        data: '2026-02-30',
        hora_inicio: '14:00',
        hora_fim: '18:00',
      });
    expect(dataInvalida.status).toBe(400);
    expect(dataInvalida.body.erro).toBe('DADOS_INVALIDOS');

    const criada = await request(app)
      .post('/festas')
      .set('Authorization', `Bearer ${tokenCliente1}`)
      .send({
        titulo: 'Aniversário de 7 anos do Pedro',
        data: '2026-12-10',
        hora_inicio: '14:00',
        hora_fim: '19:00',
        local: 'Salão Alegria',
        qtd_convidados: 50,
        tema: 'Super-heróis',
      });

    expect(criada.status).toBe(201);
    expect(criada.body.status).toBe('PLANEJANDO');
    expect(criada.body.qtd_convidados).toBe(50);
  });

  it('GET /festas e PUT /festas/:id respeitam propriedade do cliente', async () => {
    const criada = await request(app)
      .post('/festas')
      .set('Authorization', `Bearer ${tokenCliente1}`)
      .send({
        titulo: 'Festa 1',
        data: '2026-12-10',
        hora_inicio: '14:00',
        hora_fim: '19:00',
      });

    const listaCliente1 = await request(app)
      .get('/festas')
      .set('Authorization', `Bearer ${tokenCliente1}`);
    expect(listaCliente1.body).toHaveLength(1);

    const listaCliente2 = await request(app)
      .get('/festas')
      .set('Authorization', `Bearer ${tokenCliente2}`);
    expect(listaCliente2.body).toEqual([]);

    const acessoOutroCliente = await request(app)
      .get(`/festas/${criada.body.id}`)
      .set('Authorization', `Bearer ${tokenCliente2}`);
    expect(acessoOutroCliente.status).toBe(403);
    expect(acessoOutroCliente.body.erro).toBe('SEM_PERMISSAO');

    const editada = await request(app)
      .put(`/festas/${criada.body.id}`)
      .set('Authorization', `Bearer ${tokenCliente1}`)
      .send({
        titulo: 'Festa 1 Atualizada',
        data: '2026-12-12',
        hora_inicio: '15:00',
        hora_fim: '20:00',
        qtd_convidados: 80,
      });
    expect(editada.status).toBe(200);
    expect(editada.body.titulo).toBe('Festa 1 Atualizada');
    expect(editada.body.qtd_convidados).toBe(80);
  });

  it('POST /festas/:id/solicitacoes valida SERVICO_NAO_OFERECIDO, SOLICITACAO_DUPLICADA e monta stack em GET /festas/:id', async () => {
    const festa = await request(app)
      .post('/festas')
      .set('Authorization', `Bearer ${tokenCliente1}`)
      .send({
        titulo: 'Aniversário do Pedro',
        data: '2026-12-10',
        hora_inicio: '14:00',
        hora_fim: '19:00',
      });

    // Fornecedor 1 (DJ) não oferece categoria 2 (Buffet)
    const naoOferecido = await request(app)
      .post(`/festas/${festa.body.id}/solicitacoes`)
      .set('Authorization', `Bearer ${tokenCliente1}`)
      .send({
        fornecedor_id: 1,
        categoria_id: 2,
        mensagem: 'Tem buffet?',
      });
    expect(naoOferecido.status).toBe(409);
    expect(naoOferecido.body.erro).toBe('SERVICO_NAO_OFERECIDO');

    const solDj = await request(app)
      .post(`/festas/${festa.body.id}/solicitacoes`)
      .set('Authorization', `Bearer ${tokenCliente1}`)
      .send({
        fornecedor_id: 1,
        categoria_id: 1,
        mensagem: 'Preciso de DJ para festa infantil',
      });
    expect(solDj.status).toBe(201);
    expect(solDj.body.status).toBe('PENDENTE');

    const duplicada = await request(app)
      .post(`/festas/${festa.body.id}/solicitacoes`)
      .set('Authorization', `Bearer ${tokenCliente1}`)
      .send({
        fornecedor_id: 1,
        categoria_id: 1,
        mensagem: 'Repetida',
      });
    expect(duplicada.status).toBe(409);
    expect(duplicada.body.erro).toBe('SOLICITACAO_DUPLICADA');

    await request(app)
      .post(`/festas/${festa.body.id}/solicitacoes`)
      .set('Authorization', `Bearer ${tokenCliente1}`)
      .send({
        fornecedor_id: 2,
        categoria_id: 2,
        mensagem: 'Orçamento para 50 pessoas',
      });

    const detalhe = await request(app)
      .get(`/festas/${festa.body.id}`)
      .set('Authorization', `Bearer ${tokenCliente1}`);

    expect(detalhe.status).toBe(200);
    expect(detalhe.body.stack).toEqual([
      { categoria_id: 1, categoria_nome: 'DJ' },
      { categoria_id: 2, categoria_nome: 'Buffet' },
    ]);
    expect(detalhe.body.solicitacoes).toHaveLength(2);
  });

  it('Cancela solicitação individual e, ao cancelar festa, cancela apenas solicitações PENDENTE mantendo ACEITA', async () => {
    const festa = await request(app)
      .post('/festas')
      .set('Authorization', `Bearer ${tokenCliente1}`)
      .send({
        titulo: 'Aniversário do Pedro',
        data: '2026-12-10',
        hora_inicio: '14:00',
        hora_fim: '19:00',
      });

    const sol1 = await request(app)
      .post(`/festas/${festa.body.id}/solicitacoes`)
      .set('Authorization', `Bearer ${tokenCliente1}`)
      .send({ fornecedor_id: 1, categoria_id: 1 });

    const sol2 = await request(app)
      .post(`/festas/${festa.body.id}/solicitacoes`)
      .set('Authorization', `Bearer ${tokenCliente1}`)
      .send({ fornecedor_id: 2, categoria_id: 2 });

    // Outro cliente não pode cancelar solicitação alheia
    const cancelOutro = await request(app)
      .patch(`/solicitacoes/${sol1.body.id}/cancelar`)
      .set('Authorization', `Bearer ${tokenCliente2}`);
    expect(cancelOutro.status).toBe(403);

    // Simula que sol1 já foi ACEITA pelo fornecedor antes do cancelamento da festa
    solicitacoesMemoria.find((s) => s.id === sol1.body.id).status = 'ACEITA';

    const festaCancelada = await request(app)
      .patch(`/festas/${festa.body.id}/cancelar`)
      .set('Authorization', `Bearer ${tokenCliente1}`);
    expect(festaCancelada.status).toBe(200);
    expect(festaCancelada.body.status).toBe('CANCELADA');

    const detalhe = await request(app)
      .get(`/festas/${festa.body.id}`)
      .set('Authorization', `Bearer ${tokenCliente1}`);

    const statusSol1 = detalhe.body.solicitacoes.find(
      (s) => s.id === sol1.body.id,
    ).status;
    const statusSol2 = detalhe.body.solicitacoes.find(
      (s) => s.id === sol2.body.id,
    ).status;

    expect(statusSol1).toBe('ACEITA');
    expect(statusSol2).toBe('CANCELADA');
  });
});
