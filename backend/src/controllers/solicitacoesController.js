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
