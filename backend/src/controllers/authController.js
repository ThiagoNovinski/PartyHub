import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { query } from '../db.js';
import { conflito, dadosInvalidos, naoAutenticado } from '../erros.js';

const PERFIS_VALIDOS = ['cliente', 'fornecedor'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function gerarToken(usuario) {
  return jwt.sign(
    { sub: usuario.id, perfil: usuario.perfil },
    config.jwtSecret(),
    { expiresIn: config.jwtExpiresIn },
  );
}

export async function registrar(req, res) {
  const { nome, email, telefone, senha, perfil } = req.body ?? {};

  const nomeLimpo = typeof nome === 'string' ? nome.trim() : '';
  const emailLimpo = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const telefoneLimpo =
    typeof telefone === 'string' && telefone.trim() ? telefone.trim() : null;

  if (!nomeLimpo || nomeLimpo.length > 120) {
    throw dadosInvalidos('O campo nome é obrigatório e deve ter até 120 caracteres.');
  }
  if (!emailLimpo || emailLimpo.length > 120 || !EMAIL_REGEX.test(emailLimpo)) {
    throw dadosInvalidos('Informe um e-mail válido com até 120 caracteres.');
  }
  if (telefoneLimpo && telefoneLimpo.length > 30) {
    throw dadosInvalidos('O telefone deve ter até 30 caracteres.');
  }
  if (typeof senha !== 'string' || senha.length < 6) {
    throw dadosInvalidos('A senha é obrigatória e deve ter pelo menos 6 caracteres.');
  }
  if (!PERFIS_VALIDOS.includes(perfil)) {
    throw dadosInvalidos('O perfil deve ser "cliente" ou "fornecedor".');
  }

  const existente = await query(
    'SELECT id FROM usuarios WHERE LOWER(email) = $1',
    [emailLimpo],
  );
  if (existente.rowCount > 0) {
    throw conflito('EMAIL_EM_USO', 'Este e-mail já está cadastrado.');
  }

  const senhaHash = await bcrypt.hash(senha, config.bcryptRounds);

  let resultado;
  try {
    resultado = await query(
      `INSERT INTO usuarios (nome, email, telefone, senha_hash, perfil)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nome, email, telefone, perfil, criado_em`,
      [nomeLimpo, emailLimpo, telefoneLimpo, senhaHash, perfil],
    );
  } catch (err) {
    if (err.code === '23505') {
      throw conflito('EMAIL_EM_USO', 'Este e-mail já está cadastrado.');
    }
    throw err;
  }

  const usuario = resultado.rows[0];
  const token = gerarToken(usuario);

  res.status(201).json({ token, usuario });
}

export async function login(req, res) {
  const { email, senha } = req.body ?? {};

  const emailLimpo = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!emailLimpo || typeof senha !== 'string' || !senha) {
    throw dadosInvalidos('E-mail e senha são obrigatórios.');
  }

  const resultado = await query(
    `SELECT id, nome, email, telefone, senha_hash, perfil, criado_em
     FROM usuarios
     WHERE LOWER(email) = $1`,
    [emailLimpo],
  );

  if (resultado.rowCount === 0) {
    throw naoAutenticado('E-mail ou senha inválidos.');
  }

  const registro = resultado.rows[0];
  const senhaCorreta = await bcrypt.compare(senha, registro.senha_hash);
  if (!senhaCorreta) {
    throw naoAutenticado('E-mail ou senha inválidos.');
  }

  const { senha_hash: _senhaHash, ...usuario } = registro;
  const token = gerarToken(usuario);

  res.json({ token, usuario });
}

export async function eu(req, res) {
  const resultado = await query(
    `SELECT id, nome, email, telefone, perfil, criado_em
     FROM usuarios
     WHERE id = $1`,
    [req.usuario.id],
  );

  if (resultado.rowCount === 0) {
    throw naoAutenticado('Usuário não encontrado.');
  }

  res.json(resultado.rows[0]);
}
