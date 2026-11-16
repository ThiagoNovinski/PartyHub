import { query } from '../db.js';
import { dadosInvalidos, naoEncontrado, semPermissao } from '../erros.js';

const DATA_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const HORA_REGEX = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;

function converterHoraParaMinutos(hora) {
  if (typeof hora !== 'string' || !HORA_REGEX.test(hora.trim())) {
    return null;
  }
  const [h, m] = hora.trim().split(':').map(Number);
  return h * 60 + m;
}

function validarData(dataStr) {
  if (typeof dataStr !== 'string' || !DATA_REGEX.test(dataStr.trim())) {
    throw dadosInvalidos('O campo data é obrigatório no formato AAAA-MM-DD.');
  }
  const texto = dataStr.trim();
  const [ano, mes, dia] = texto.split('-').map(Number);
  const dt = new Date(Date.UTC(ano, mes - 1, dia));
  if (
    dt.getUTCFullYear() !== ano ||
    dt.getUTCMonth() !== mes - 1 ||
    dt.getUTCDate() !== dia
  ) {
    throw dadosInvalidos('Data informada é inválida.');
  }
  return texto;
}

function limparTextoOpcional(valor, maxLen, nomeCampo) {
  if (valor === undefined || valor === null || valor === '') return null;
  if (typeof valor !== 'string') {
    throw dadosInvalidos(`O campo ${nomeCampo} deve ser um texto.`);
  }
  const limpo = valor.trim();
  if (!limpo) return null;
  if (maxLen && limpo.length > maxLen) {
    throw dadosInvalidos(`O campo ${nomeCampo} deve ter até ${maxLen} caracteres.`);
  }
  return limpo;
}

function validarPayloadFesta(body) {
  const {
    titulo,
    data,
    hora_inicio,
    hora_fim,
    local,
    qtd_convidados,
    tema,
    observacoes,
  } = body ?? {};

  const tituloLimpo = typeof titulo === 'string' ? titulo.trim() : '';
  if (!tituloLimpo || tituloLimpo.length > 120) {
    throw dadosInvalidos(
      'O campo titulo é obrigatório e deve ter até 120 caracteres.',
    );
  }

  const dataValidada = validarData(data);

  const minInicio = converterHoraParaMinutos(hora_inicio);
  const minFim = converterHoraParaMinutos(hora_fim);
  if (minInicio === null || minFim === null) {
    throw dadosInvalidos(
      'Os campos hora_inicio e hora_fim são obrigatórios no formato HH:MM.',
    );
  }
  if (minFim <= minInicio) {
    throw dadosInvalidos('O campo hora_fim deve ser posterior a hora_inicio.');
  }

  let qtdConvidados = null;
  if (qtd_convidados !== undefined && qtd_convidados !== null && qtd_convidados !== '') {
    const num = Number(qtd_convidados);
    if (!Number.isInteger(num) || num <= 0) {
      throw dadosInvalidos('O campo qtd_convidados deve ser um inteiro positivo.');
    }
    qtdConvidados = num;
  }

  return {
    titulo: tituloLimpo,
    data: dataValidada,
    hora_inicio: hora_inicio.trim(),
    hora_fim: hora_fim.trim(),
    local: limparTextoOpcional(local, 200, 'local'),
    qtd_convidados: qtdConvidados,
    tema: limparTextoOpcional(tema, 80, 'tema'),
    observacoes: limparTextoOpcional(observacoes, null, 'observacoes'),
  };
}

async function buscarFestaDoCliente(festaIdParam, clienteId) {
  const festaId = Number(festaIdParam);
  if (!Number.isInteger(festaId) || festaId <= 0) {
    throw dadosInvalidos('Identificador de festa inválido.');
  }

  const resultado = await query(
    `SELECT id, cliente_id, titulo, data, hora_inicio, hora_fim,
            local, qtd_convidados, tema, observacoes, status
     FROM festas
     WHERE id = $1`,
    [festaId],
  );

  if (resultado.rowCount === 0) {
    throw naoEncontrado('Festa não encontrada.');
  }

  const festa = resultado.rows[0];
  if (festa.cliente_id !== clienteId) {
    throw semPermissao('Você não tem permissão para acessar esta festa.');
  }

  return festa;
}

export async function listarMinhasFestas(req, res) {
  const resultado = await query(
    `SELECT id, cliente_id, titulo, data, hora_inicio, hora_fim,
            local, qtd_convidados, tema, observacoes, status
     FROM festas
     WHERE cliente_id = $1
     ORDER BY data ASC, id ASC`,
    [req.usuario.id],
  );

  res.json(resultado.rows);
}

export async function criarFesta(req, res) {
  const dados = validarPayloadFesta(req.body);

  const resultado = await query(
    `INSERT INTO festas (
       cliente_id, titulo, data, hora_inicio, hora_fim,
       local, qtd_convidados, tema, observacoes, status
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PLANEJANDO')
     RETURNING id, cliente_id, titulo, data, hora_inicio, hora_fim,
               local, qtd_convidados, tema, observacoes, status`,
    [
      req.usuario.id,
      dados.titulo,
      dados.data,
      dados.hora_inicio,
      dados.hora_fim,
      dados.local,
      dados.qtd_convidados,
      dados.tema,
      dados.observacoes,
    ],
  );

  res.status(201).json(resultado.rows[0]);
}

export async function obterFesta(req, res) {
  const festa = await buscarFestaDoCliente(req.params.id, req.usuario.id);

  const solRes = await query(
    `SELECT s.id, s.festa_id, s.fornecedor_id, f.nome_empresa AS fornecedor_nome,
            f.telefone_contato, f.whatsapp, f.email_contato,
            s.categoria_id, c.nome AS categoria_nome,
            s.mensagem, s.status, s.resposta, s.criado_em, s.respondido_em
     FROM solicitacoes s
     JOIN fornecedores f ON f.id = s.fornecedor_id
     JOIN categorias c ON c.id = s.categoria_id
     WHERE s.festa_id = $1
     ORDER BY s.id ASC`,
    [festa.id],
  );

  const categoriasVistas = new Map();
  for (const sol of solRes.rows) {
    if (!categoriasVistas.has(sol.categoria_id)) {
      categoriasVistas.set(sol.categoria_id, {
        categoria_id: sol.categoria_id,
        categoria_nome: sol.categoria_nome,
      });
    }
  }

  res.json({
    ...festa,
    stack: Array.from(categoriasVistas.values()),
    solicitacoes: solRes.rows,
  });
}

export async function editarFesta(req, res) {
  const festaAtual = await buscarFestaDoCliente(req.params.id, req.usuario.id);
  if (festaAtual.status === 'CANCELADA') {
    throw dadosInvalidos('Não é possível editar uma festa cancelada.');
  }

  const dados = validarPayloadFesta(req.body);
  const statusInformado = req.body?.status;
  let novoStatus = festaAtual.status;
  if (statusInformado !== undefined) {
    if (!['PLANEJANDO', 'CONCLUIDA'].includes(statusInformado)) {
      throw dadosInvalidos('O status na edição deve ser PLANEJANDO ou CONCLUIDA.');
    }
    novoStatus = statusInformado;
  }

  const resultado = await query(
    `UPDATE festas
     SET titulo = $1, data = $2, hora_inicio = $3, hora_fim = $4,
         local = $5, qtd_convidados = $6, tema = $7, observacoes = $8, status = $9
     WHERE id = $10
     RETURNING id, cliente_id, titulo, data, hora_inicio, hora_fim,
               local, qtd_convidados, tema, observacoes, status`,
    [
      dados.titulo,
      dados.data,
      dados.hora_inicio,
      dados.hora_fim,
      dados.local,
      dados.qtd_convidados,
      dados.tema,
      dados.observacoes,
      novoStatus,
      festaAtual.id,
    ],
  );

  res.json(resultado.rows[0]);
}

export async function cancelarFesta(req, res) {
  const festaAtual = await buscarFestaDoCliente(req.params.id, req.usuario.id);

  const resultado = await query(
    `UPDATE festas
     SET status = 'CANCELADA'
     WHERE id = $1
     RETURNING id, cliente_id, titulo, data, hora_inicio, hora_fim,
               local, qtd_convidados, tema, observacoes, status`,
    [festaAtual.id],
  );

  await query(
    `UPDATE solicitacoes
     SET status = 'CANCELADA'
     WHERE festa_id = $1 AND status = 'PENDENTE'`,
    [festaAtual.id],
  );

  res.json(resultado.rows[0]);
}
