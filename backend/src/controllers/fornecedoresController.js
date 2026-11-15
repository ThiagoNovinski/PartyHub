import { query } from '../db.js';
import {
  conflito,
  dadosInvalidos,
  naoEncontrado,
  semPermissao,
} from '../erros.js';

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

async function obterFornecedorPorUsuario(usuarioId) {
  const resultado = await query(
    `SELECT id, usuario_id, nome_empresa, descricao, cidade,
            telefone_contato, whatsapp, email_contato, ativo
     FROM fornecedores
     WHERE usuario_id = $1`,
    [usuarioId],
  );
  return resultado.rows[0] || null;
}

async function listarServicosDoFornecedor(fornecedorId) {
  const resultado = await query(
    `SELECT fs.id, fs.fornecedor_id, fs.categoria_id, c.nome AS categoria_nome,
            fs.descricao, fs.preco_referencia
     FROM fornecedorservicos fs
     JOIN categorias c ON c.id = fs.categoria_id
     WHERE fs.fornecedor_id = $1
     ORDER BY fs.id ASC`,
    [fornecedorId],
  );
  return resultado.rows;
}

export async function salvarMeuPerfil(req, res) {
  const {
    nome_empresa,
    descricao,
    cidade,
    telefone_contato,
    whatsapp,
    email_contato,
  } = req.body ?? {};

  const nomeEmpresa =
    typeof nome_empresa === 'string' ? nome_empresa.trim() : '';
  const telefoneContato =
    typeof telefone_contato === 'string' ? telefone_contato.trim() : '';

  if (!nomeEmpresa || nomeEmpresa.length > 120) {
    throw dadosInvalidos(
      'O campo nome_empresa é obrigatório e deve ter até 120 caracteres.',
    );
  }
  if (!telefoneContato || telefoneContato.length > 30) {
    throw dadosInvalidos(
      'O campo telefone_contato é obrigatório e deve ter até 30 caracteres.',
    );
  }

  const descricaoLimpa = limparTextoOpcional(descricao, null, 'descricao');
  const cidadeLimpa = limparTextoOpcional(cidade, 80, 'cidade');
  const whatsappLimpo = limparTextoOpcional(whatsapp, 30, 'whatsapp');
  const emailContatoLimpo = limparTextoOpcional(
    email_contato,
    120,
    'email_contato',
  );

  const resultado = await query(
    `INSERT INTO fornecedores (
       usuario_id, nome_empresa, descricao, cidade,
       telefone_contato, whatsapp, email_contato
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (usuario_id) DO UPDATE SET
       nome_empresa = EXCLUDED.nome_empresa,
       descricao = EXCLUDED.descricao,
       cidade = EXCLUDED.cidade,
       telefone_contato = EXCLUDED.telefone_contato,
       whatsapp = EXCLUDED.whatsapp,
       email_contato = EXCLUDED.email_contato
     RETURNING id, usuario_id, nome_empresa, descricao, cidade,
               telefone_contato, whatsapp, email_contato, ativo`,
    [
      req.usuario.id,
      nomeEmpresa,
      descricaoLimpa,
      cidadeLimpa,
      telefoneContato,
      whatsappLimpo,
      emailContatoLimpo,
    ],
  );

  const fornecedor = resultado.rows[0];
  const servicos = await listarServicosDoFornecedor(fornecedor.id);

  res.json({ ...fornecedor, servicos });
}

export async function adicionarServico(req, res) {
  const fornecedor = await obterFornecedorPorUsuario(req.usuario.id);
  if (!fornecedor) {
    throw naoEncontrado(
      'Cadastre o perfil do fornecedor antes de adicionar serviços.',
    );
  }

  const { categoria_id, descricao, preco_referencia } = req.body ?? {};
  const categoriaId = Number(categoria_id);
  if (!Number.isInteger(categoriaId) || categoriaId <= 0) {
    throw dadosInvalidos('O campo categoria_id deve ser um inteiro válido.');
  }

  const descricaoLimpa = limparTextoOpcional(descricao, null, 'descricao');
  const precoReferenciaLimpo = limparTextoOpcional(
    preco_referencia,
    80,
    'preco_referencia',
  );

  const catRes = await query('SELECT id, nome FROM categorias WHERE id = $1', [
    categoriaId,
  ]);
  if (catRes.rowCount === 0) {
    throw naoEncontrado('Categoria não encontrada.');
  }

  const duplicado = await query(
    'SELECT id FROM fornecedorservicos WHERE fornecedor_id = $1 AND categoria_id = $2',
    [fornecedor.id, categoriaId],
  );
  if (duplicado.rowCount > 0) {
    throw conflito(
      'SERVICO_DUPLICADO',
      'Você já cadastrou um serviço para esta categoria.',
    );
  }

  let inserido;
  try {
    inserido = await query(
      `INSERT INTO fornecedorservicos (fornecedor_id, categoria_id, descricao, preco_referencia)
       VALUES ($1, $2, $3, $4)
       RETURNING id, fornecedor_id, categoria_id, descricao, preco_referencia`,
      [fornecedor.id, categoriaId, descricaoLimpa, precoReferenciaLimpo],
    );
  } catch (err) {
    if (err.code === '23505') {
      throw conflito(
        'SERVICO_DUPLICADO',
        'Você já cadastrou um serviço para esta categoria.',
      );
    }
    throw err;
  }

  res.status(201).json({
    ...inserido.rows[0],
    categoria_nome: catRes.rows[0].nome,
  });
}

export async function editarServico(req, res) {
  const servicoId = Number(req.params.id);
  if (!Number.isInteger(servicoId) || servicoId <= 0) {
    throw dadosInvalidos('Identificador de serviço inválido.');
  }

  const fornecedor = await obterFornecedorPorUsuario(req.usuario.id);
  if (!fornecedor) {
    throw naoEncontrado('Perfil de fornecedor não encontrado.');
  }

  const servicoAtual = await query(
    `SELECT fs.id, fs.fornecedor_id, fs.categoria_id, c.nome AS categoria_nome
     FROM fornecedorservicos fs
     JOIN categorias c ON c.id = fs.categoria_id
     WHERE fs.id = $1`,
    [servicoId],
  );
  if (servicoAtual.rowCount === 0) {
    throw naoEncontrado('Serviço não encontrado.');
  }
  if (servicoAtual.rows[0].fornecedor_id !== fornecedor.id) {
    throw semPermissao('Você não pode editar o serviço de outro fornecedor.');
  }

  const { descricao, preco_referencia } = req.body ?? {};
  const descricaoLimpa = limparTextoOpcional(descricao, null, 'descricao');
  const precoReferenciaLimpo = limparTextoOpcional(
    preco_referencia,
    80,
    'preco_referencia',
  );

  const atualizado = await query(
    `UPDATE fornecedorservicos
     SET descricao = $1, preco_referencia = $2
     WHERE id = $3
     RETURNING id, fornecedor_id, categoria_id, descricao, preco_referencia`,
    [descricaoLimpa, precoReferenciaLimpo, servicoId],
  );

  res.json({
    ...atualizado.rows[0],
    categoria_nome: servicoAtual.rows[0].categoria_nome,
  });
}

export async function removerServico(req, res) {
  const servicoId = Number(req.params.id);
  if (!Number.isInteger(servicoId) || servicoId <= 0) {
    throw dadosInvalidos('Identificador de serviço inválido.');
  }

  const fornecedor = await obterFornecedorPorUsuario(req.usuario.id);
  if (!fornecedor) {
    throw naoEncontrado('Perfil de fornecedor não encontrado.');
  }

  const servicoAtual = await query(
    'SELECT id, fornecedor_id FROM fornecedorservicos WHERE id = $1',
    [servicoId],
  );
  if (servicoAtual.rowCount === 0) {
    throw naoEncontrado('Serviço não encontrado.');
  }
  if (servicoAtual.rows[0].fornecedor_id !== fornecedor.id) {
    throw semPermissao('Você não pode remover o serviço de outro fornecedor.');
  }

  await query('DELETE FROM fornecedorservicos WHERE id = $1', [servicoId]);
  res.status(204).send();
}

export async function alterarAtivo(req, res) {
  const { ativo } = req.body ?? {};
  if (typeof ativo !== 'boolean') {
    throw dadosInvalidos('O campo ativo é obrigatório e deve ser booleano.');
  }

  const resultado = await query(
    `UPDATE fornecedores
     SET ativo = $1
     WHERE usuario_id = $2
     RETURNING id, usuario_id, nome_empresa, descricao, cidade,
               telefone_contato, whatsapp, email_contato, ativo`,
    [ativo, req.usuario.id],
  );

  if (resultado.rowCount === 0) {
    throw naoEncontrado('Perfil de fornecedor não encontrado.');
  }

  res.json(resultado.rows[0]);
}
