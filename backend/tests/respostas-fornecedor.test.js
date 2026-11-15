import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { config } from '../src/config.js';

const usuariosMemoria = [
  {
    id: 100,
    nome: 'Ana Cliente',
    email: 'ana@partyhub.com',
    telefone: '(53) 99999-1111',
    perfil: 'cliente',
  },
];
const categoriasMemoria = [
  { id: 1, nome: 'DJ' },
  { id: 2, nome: 'Sonorização' },
];
const fornecedoresMemoria = [
  {
    id: 1,
    usuario_id: 10,
    nome_empresa: 'Carlos Som & DJ Pro',
    ativo: true,
  },
  {
    id: 2,
    usuario_id: 20,
    nome_empresa: 'Outro Fornecedor',
    ativo: true,
  },
];
const festasMemoria = [
  {
    id: 1,
    cliente_id: 100,
    titulo: 'Aniversário de 7 anos do Pedro',
    data: '2026-11-14',
    hora_inicio: '14:00',
    hora_fim: '18:00',
    local: 'Salão Alegria',
    qtd_convidados: 50,
    tema: 'Super-heróis',
    status: 'PLANEJANDO',
  },
  {
    id: 2,
    cliente_id: 100,
    titulo: 'Formatura da Júlia',
    data: '2026-11-14', // mesma data da festa 1
    hora_inicio: '20:00',
    hora_fim: '23:30',
    local: 'Clube Centro',
    qtd_convidados: 120,
    tema: 'Gala',
    status: 'PLANEJANDO',
  },
  {
    id: 3,
    cliente_id: 100,
    titulo: 'Festa de Fim de Ano',
    data: '2026-12-20', // outra data
    hora_inicio: '19:00',
    hora_fim: '23:00',
    local: 'Espaço Sul',
    qtd_convidados: 80,
    tema: 'Branco',
    status: 'PLANEJANDO',
  },
];
const solicitacoesMemoria = [];

vi.mock('../src/db.js', () => ({
  pool: { end: vi.fn() },
  query: vi.fn(async (sql, params = []) => {
    const texto = sql.replace(/\s+/g, ' ').trim().toUpperCase();

    if (texto.startsWith('SELECT ID FROM FORNECEDORES WHERE USUARIO_ID = $1')) {
      const forn = fornecedoresMemoria.find(
        (f) => f.usuario_id === Number(params[0]),
      );
      return { rowCount: forn ? 1 : 0, rows: forn ? [{ id: forn.id }] : [] };
    }

    if (
      texto.includes('FROM SOLICITACOES S') &&
      texto.includes('JOIN USUARIOS U ON U.ID = F.CLIENTE_ID') &&
      texto.includes('WHERE S.FORNECEDOR_ID = $1')
    ) {
      const lista = solicitacoesMemoria
        .filter((s) => s.fornecedor_id === Number(params[0]))
        .map((s) => {
          const f = festasMemoria.find((item) => item.id === s.festa_id);
          const u = usuariosMemoria.find((item) => item.id === f.cliente_id);
          const c = categoriasMemoria.find((item) => item.id === s.categoria_id);
          return {
            ...s,
            categoria_nome: c?.nome,
            festa_titulo: f.titulo,
            festa_data: f.data,
            hora_inicio: f.hora_inicio,
            hora_fim: f.hora_fim,
            local: f.local,
            qtd_convidados: f.qtd_convidados,
            tema: f.tema,
            cliente_nome: u.nome,
            cliente_email: u.email,
            cliente_telefone: u.telefone,
          };
        });
      return { rowCount: lista.length, rows: lista };
    }

    if (
      texto.includes('FROM SOLICITACOES S JOIN FESTAS F ON F.ID = S.FESTA_ID WHERE S.ID = $1')
    ) {
      const s = solicitacoesMemoria.find((item) => item.id === Number(params[0]));
      if (!s) return { rowCount: 0, rows: [] };
      const f = festasMemoria.find((item) => item.id === s.festa_id);
      return {
        rowCount: 1,
        rows: [{ ...s, festa_data: f.data }],
      };
    }

    if (
      texto.includes("WHERE S.FORNECEDOR_ID = $1 AND S.STATUS = 'ACEITA' AND S.FESTA_ID <> $2 AND F.DATA = $3")
    ) {
      const [fornId, festaId, data] = params;
      const conflitos = solicitacoesMemoria.filter((s) => {
        if (s.fornecedor_id !== Number(fornId)) return false;
        if (s.status !== 'ACEITA') return false;
        if (s.festa_id === Number(festaId)) return false;
        const f = festasMemoria.find((item) => item.id === s.festa_id);
        return f?.data === data;
      });
      return { rowCount: conflitos.length, rows: conflitos };
    }

    if (
      texto.startsWith(
        'UPDATE SOLICITACOES SET STATUS = $1, RESPOSTA = $2, RESPONDIDO_EM = NOW() WHERE ID = $3',
      )
    ) {
      const [status, resposta, id] = params;
      const s = solicitacoesMemoria.find((item) => item.id === Number(id));
      s.status = status;
      s.resposta = resposta;
      s.respondido_em = '2026-11-15T16:00:00.000Z';
      return { rowCount: 1, rows: [{ ...s }] };
    }

    throw new Error(`Query não mockada no teste: ${sql}`);
  }),
}));

const { default: app } = await import('../src/app.js');

function tokenPara(id, perfil) {
  return jwt.sign({ sub: id, perfil }, config.jwtSecret(), { expiresIn: '1h' });
}

describe('Pedidos Recebidos e Resposta do Fornecedor (/solicitacoes)', () => {
  const tokenFornecedor1 = tokenPara(10, 'fornecedor');
  const tokenFornecedor2 = tokenPara(20, 'fornecedor');
  const tokenCliente = tokenPara(100, 'cliente');

  beforeEach(() => {
    solicitacoesMemoria.length = 0;
    solicitacoesMemoria.push(
      {
        id: 1,
        festa_id: 1,
        fornecedor_id: 1,
        categoria_id: 1,
        mensagem: 'Preciso de DJ para aniversário infantil',
        status: 'PENDENTE',
        resposta: null,
        criado_em: '2026-11-15T10:00:00.000Z',
        respondido_em: null,
      },
      {
        id: 2,
        festa_id: 2,
        fornecedor_id: 1,
        categoria_id: 1,
        mensagem: 'DJ para formatura na mesma data',
        status: 'PENDENTE',
        resposta: null,
        criado_em: '2026-11-15T11:00:00.000Z',
        respondido_em: null,
      },
      {
        id: 3,
        festa_id: 3,
        fornecedor_id: 1,
        categoria_id: 2,
        mensagem: 'Sonorização em dezembro',
        status: 'PENDENTE',
        resposta: null,
        criado_em: '2026-11-15T12:00:00.000Z',
        respondido_em: null,
      },
    );
  });

  it('GET /solicitacoes/recebidas retorna pedidos com contato do cliente e filtra por status', async () => {
    const proibido = await request(app)
      .get('/solicitacoes/recebidas')
      .set('Authorization', `Bearer ${tokenCliente}`);
    expect(proibido.status).toBe(403);
    expect(proibido.body.erro).toBe('SEM_PERMISSAO');

    const filtroInvalido = await request(app)
      .get('/solicitacoes/recebidas?status=INVALIDO')
      .set('Authorization', `Bearer ${tokenFornecedor1}`);
    expect(filtroInvalido.status).toBe(400);
    expect(filtroInvalido.body.erro).toBe('DADOS_INVALIDOS');

    const recebidas = await request(app)
      .get('/solicitacoes/recebidas')
      .set('Authorization', `Bearer ${tokenFornecedor1}`);
    expect(recebidas.status).toBe(200);
    expect(recebidas.body).toHaveLength(3);
    expect(recebidas.body[0]).toEqual(
      expect.objectContaining({
        cliente_nome: 'Ana Cliente',
        cliente_email: 'ana@partyhub.com',
        cliente_telefone: '(53) 99999-1111',
      }),
    );

    // Aceita a solicitação 1 e filtra por ?status=ACEITA
    await request(app)
      .patch('/solicitacoes/1/responder')
      .set('Authorization', `Bearer ${tokenFornecedor1}`)
      .send({ status: 'ACEITA', resposta: 'Combinado pelo WhatsApp!' });

    const apenasAceitas = await request(app)
      .get('/solicitacoes/recebidas?status=ACEITA')
      .set('Authorization', `Bearer ${tokenFornecedor1}`);
    expect(apenasAceitas.body).toHaveLength(1);
    expect(apenasAceitas.body[0].id).toBe(1);
  });

  it('PATCH /solicitacoes/:id/responder valida destinatário (403), JA_RESPONDIDA (409) e DATA_OCUPADA (409)', async () => {
    // Outro fornecedor não pode responder pedido do fornecedor 1
    const outroFornecedor = await request(app)
      .patch('/solicitacoes/1/responder')
      .set('Authorization', `Bearer ${tokenFornecedor2}`)
      .send({ status: 'ACEITA' });
    expect(outroFornecedor.status).toBe(403);
    expect(outroFornecedor.body.erro).toBe('SEM_PERMISSAO');

    // Status inválido no corpo
    const statusInvalido = await request(app)
      .patch('/solicitacoes/1/responder')
      .set('Authorization', `Bearer ${tokenFornecedor1}`)
      .send({ status: 'PENDENTE' });
    expect(statusInvalido.status).toBe(400);
    expect(statusInvalido.body.erro).toBe('DADOS_INVALIDOS');

    // Fornecedor 1 aceita a festa 1 (data 2026-11-14)
    const aceita1 = await request(app)
      .patch('/solicitacoes/1/responder')
      .set('Authorization', `Bearer ${tokenFornecedor1}`)
      .send({ status: 'ACEITA', resposta: 'Confirmado!' });
    expect(aceita1.status).toBe(200);
    expect(aceita1.body.status).toBe('ACEITA');
    expect(aceita1.body.resposta).toBe('Confirmado!');
    expect(aceita1.body.respondido_em).toEqual(expect.any(String));

    // Não pode responder novamente a mesma solicitação
    const jaRespondida = await request(app)
      .patch('/solicitacoes/1/responder')
      .set('Authorization', `Bearer ${tokenFornecedor1}`)
      .send({ status: 'RECUSADA' });
    expect(jaRespondida.status).toBe(409);
    expect(jaRespondida.body.erro).toBe('JA_RESPONDIDA');

    // Tentativa de aceitar a solicitação 2 (festa 2 na mesma data 2026-11-14) -> 409 DATA_OCUPADA
    const dataOcupada = await request(app)
      .patch('/solicitacoes/2/responder')
      .set('Authorization', `Bearer ${tokenFornecedor1}`)
      .send({ status: 'ACEITA' });
    expect(dataOcupada.status).toBe(409);
    expect(dataOcupada.body.erro).toBe('DATA_OCUPADA');

    // Mas pode recusar a solicitação 2 na mesma data
    const recusadaMesmaData = await request(app)
      .patch('/solicitacoes/2/responder')
      .set('Authorization', `Bearer ${tokenFornecedor1}`)
      .send({ status: 'RECUSADA', resposta: 'Já tenho evento nesta data.' });
    expect(recusadaMesmaData.status).toBe(200);
    expect(recusadaMesmaData.body.status).toBe('RECUSADA');

    // E pode aceitar a solicitação 3 em outra data (2026-12-20)
    const aceitaOutraData = await request(app)
      .patch('/solicitacoes/3/responder')
      .set('Authorization', `Bearer ${tokenFornecedor1}`)
      .send({ status: 'ACEITA', resposta: 'Data livre, confirmado!' });
    expect(aceitaOutraData.status).toBe(200);
    expect(aceitaOutraData.body.status).toBe('ACEITA');
  });
});
