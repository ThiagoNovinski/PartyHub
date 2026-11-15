import { query } from '../db.js';
import {
  conflito,
  dadosInvalidos,
  naoEncontrado,
  semPermissao,
} from '../erros.js';

export async function criarSolicitacao(req, res) {
  const festaId = Number(req.params.id);
  if (!Number.isInteger(festaId) || festaId <= 0) {
    throw dadosInvalidos('Identificador de festa inválido.');
  }

  const { fornecedor_id, categoria_id, mensagem } = req.body ?? {};
  const fornecedorId = Number(fornecedor_id);
  const categoriaId = Number(categoria_id);

  if (!Number.isInteger(fornecedorId) || fornecedorId <= 0) {
    throw dadosInvalidos('O campo fornecedor_id deve ser um inteiro válido.');
  }
  if (!Number.isInteger(categoriaId) || categoriaId <= 0) {
    throw dadosInvalidos('O campo categoria_id deve ser um inteiro válido.');
  }
  if (mensagem !== undefined && mensagem !== null && typeof mensagem !== 'string') {
    throw dadosInvalidos('O campo mensagem deve ser um texto.');
  }
  const mensagemLimpa =
    typeof mensagem === 'string' && mensagem.trim() ? mensagem.trim() : null;

  const festaRes = await query(
    'SELECT id, cliente_id, status FROM festas WHERE id = $1',
    [festaId],
  );
  if (festaRes.rowCount === 0) {
    throw naoEncontrado('Festa não encontrada.');
  }

  const festa = festaRes.rows[0];
  if (festa.cliente_id !== req.usuario.id) {
    throw semPermissao('Você não tem permissão para solicitar fornecedores nesta festa.');
  }
  if (festa.status !== 'PLANEJANDO') {
    throw dadosInvalidos('Só é possível criar solicitações para festas em planejamento.');
  }

  const fornecedorRes = await query(
    'SELECT id, ativo FROM fornecedores WHERE id = $1',
    [fornecedorId],
  );
  if (fornecedorRes.rowCount === 0 || !fornecedorRes.rows[0].ativo) {
    throw naoEncontrado('Fornecedor não encontrado ou inativo.');
  }

  const servicoRes = await query(
    'SELECT id FROM fornecedorservicos WHERE fornecedor_id = $1 AND categoria_id = $2',
    [fornecedorId, categoriaId],
  );
  if (servicoRes.rowCount === 0) {
    throw conflito(
      'SERVICO_NAO_OFERECIDO',
      'O fornecedor não entrega a categoria solicitada.',
    );
  }

  const duplicadaRes = await query(
    `SELECT id FROM solicitacoes
     WHERE festa_id = $1 AND fornecedor_id = $2 AND categoria_id = $3`,
    [festaId, fornecedorId, categoriaId],
  );
  if (duplicadaRes.rowCount > 0) {
    throw conflito(
      'SOLICITACAO_DUPLICADA',
      'Mesmo fornecedor e categoria já foram solicitados nesta festa.',
    );
  }

  let inserida;
  try {
    inserida = await query(
      `INSERT INTO solicitacoes (festa_id, fornecedor_id, categoria_id, mensagem, status)
       VALUES ($1, $2, $3, $4, 'PENDENTE')
       RETURNING id, festa_id, fornecedor_id, categoria_id, mensagem,
                 status, resposta, criado_em, respondido_em`,
      [festaId, fornecedorId, categoriaId, mensagemLimpa],
    );
  } catch (err) {
    if (err.code === '23505') {
      throw conflito(
        'SOLICITACAO_DUPLICADA',
        'Mesmo fornecedor e categoria já foram solicitados nesta festa.',
      );
    }
    throw err;
  }

  res.status(201).json(inserida.rows[0]);
}

export async function cancelarSolicitacao(req, res) {
  const solicitacaoId = Number(req.params.id);
  if (!Number.isInteger(solicitacaoId) || solicitacaoId <= 0) {
    throw dadosInvalidos('Identificador de solicitação inválido.');
  }

  const solRes = await query(
    `SELECT s.id, s.festa_id, s.status, f.cliente_id
     FROM solicitacoes s
     JOIN festas f ON f.id = s.festa_id
     WHERE s.id = $1`,
    [solicitacaoId],
  );
  if (solRes.rowCount === 0) {
    throw naoEncontrado('Solicitação não encontrada.');
  }

  const solicitacao = solRes.rows[0];
  if (solicitacao.cliente_id !== req.usuario.id) {
    throw semPermissao('Você não tem permissão para cancelar esta solicitação.');
  }

  const atualizada = await query(
    `UPDATE solicitacoes
     SET status = 'CANCELADA'
     WHERE id = $1
     RETURNING id, festa_id, fornecedor_id, categoria_id, mensagem,
               status, resposta, criado_em, respondido_em`,
    [solicitacaoId],
  );

  res.json(atualizada.rows[0]);
}

const STATUS_SOLICITACAO_VALIDOS = [
  'PENDENTE',
  'ACEITA',
  'RECUSADA',
  'CANCELADA',
];

export async function listarSolicitacoesRecebidas(req, res) {
  const { status } = req.query ?? {};
  let filtroStatus = null;
  if (typeof status === 'string' && status.trim()) {
    filtroStatus = status.trim().toUpperCase();
    if (!STATUS_SOLICITACAO_VALIDOS.includes(filtroStatus)) {
      throw dadosInvalidos(
        'Filtro status inválido. Use PENDENTE, ACEITA, RECUSADA ou CANCELADA.',
      );
    }
  }

  const fornRes = await query(
    'SELECT id FROM fornecedores WHERE usuario_id = $1',
    [req.usuario.id],
  );
  if (fornRes.rowCount === 0) {
    return res.json([]);
  }

  const fornecedorId = fornRes.rows[0].id;
  const resultado = await query(
    `SELECT s.id, s.festa_id, s.fornecedor_id, s.categoria_id,
            c.nome AS categoria_nome,
            s.mensagem, s.status, s.resposta, s.criado_em, s.respondido_em,
            f.titulo AS festa_titulo, f.data AS festa_data,
            f.hora_inicio, f.hora_fim, f.local, f.qtd_convidados, f.tema,
            u.nome AS cliente_nome, u.email AS cliente_email, u.telefone AS cliente_telefone
     FROM solicitacoes s
     JOIN festas f ON f.id = s.festa_id
     JOIN usuarios u ON u.id = f.cliente_id
     JOIN categorias c ON c.id = s.categoria_id
     WHERE s.fornecedor_id = $1
     ORDER BY s.criado_em DESC, s.id DESC`,
    [fornecedorId],
  );

  const lista = filtroStatus
    ? resultado.rows.filter((s) => s.status === filtroStatus)
    : resultado.rows;

  return res.json(lista);
}

export async function responderSolicitacao(req, res) {
  const solicitacaoId = Number(req.params.id);
  if (!Number.isInteger(solicitacaoId) || solicitacaoId <= 0) {
    throw dadosInvalidos('Identificador de solicitação inválido.');
  }

  const { status, resposta } = req.body ?? {};
  if (status !== 'ACEITA' && status !== 'RECUSADA') {
    throw dadosInvalidos('O campo status deve ser "ACEITA" ou "RECUSADA".');
  }
  if (resposta !== undefined && resposta !== null && typeof resposta !== 'string') {
    throw dadosInvalidos('O campo resposta deve ser um texto.');
  }
  const respostaLimpa =
    typeof resposta === 'string' && resposta.trim() ? resposta.trim() : null;

  const fornRes = await query(
    'SELECT id FROM fornecedores WHERE usuario_id = $1',
    [req.usuario.id],
  );
  if (fornRes.rowCount === 0) {
    throw semPermissao('Perfil de fornecedor não encontrado para este usuário.');
  }
  const fornecedorId = fornRes.rows[0].id;

  const solRes = await query(
    `SELECT s.id, s.festa_id, s.fornecedor_id, s.categoria_id, s.status,
            f.data AS festa_data
     FROM solicitacoes s
     JOIN festas f ON f.id = s.festa_id
     WHERE s.id = $1`,
    [solicitacaoId],
  );
  if (solRes.rowCount === 0) {
    throw naoEncontrado('Solicitação não encontrada.');
  }

  const solicitacao = solRes.rows[0];
  if (solicitacao.fornecedor_id !== fornecedorId) {
    throw semPermissao('Apenas o fornecedor destinatário pode responder a esta solicitação.');
  }

  if (solicitacao.status !== 'PENDENTE') {
    throw conflito(
      'JA_RESPONDIDA',
      'Esta solicitação não está mais pendente e não pode ser respondida novamente.',
    );
  }

  if (status === 'ACEITA') {
    const conflitoData = await query(
      `SELECT s.id
       FROM solicitacoes s
       JOIN festas f ON f.id = s.festa_id
       WHERE s.fornecedor_id = $1
         AND s.status = 'ACEITA'
         AND s.festa_id <> $2
         AND f.data = $3`,
      [fornecedorId, solicitacao.festa_id, solicitacao.festa_data],
    );

    if (conflitoData.rowCount > 0) {
      throw conflito(
        'DATA_OCUPADA',
        `Você já aceitou outra festa na data ${solicitacao.festa_data}.`,
      );
    }
  }

  const atualizada = await query(
    `UPDATE solicitacoes
     SET status = $1, resposta = $2, respondido_em = NOW()
     WHERE id = $3
     RETURNING id, festa_id, fornecedor_id, categoria_id, mensagem,
               status, resposta, criado_em, respondido_em`,
    [status, respostaLimpa, solicitacaoId],
  );

  res.json(atualizada.rows[0]);
}
