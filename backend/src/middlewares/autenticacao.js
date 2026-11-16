import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { naoAutenticado, semPermissao } from '../erros.js';

export function autenticar(req, _res, next) {
  const cabecalho = req.headers.authorization;
  if (!cabecalho || !cabecalho.startsWith('Bearer ')) {
    throw naoAutenticado('Token ausente ou inválido.');
  }

  const token = cabecalho.slice(7).trim();
  if (!token) {
    throw naoAutenticado('Token ausente ou inválido.');
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret());
    req.usuario = {
      id: Number(payload.sub),
      perfil: payload.perfil,
    };
    next();
  } catch {
    throw naoAutenticado('Token ausente ou inválido.');
  }
}

export function exigirPerfil(...perfisPermitidos) {
  return (req, _res, next) => {
    if (!req.usuario) {
      throw naoAutenticado('Token ausente ou inválido.');
    }
    if (!perfisPermitidos.includes(req.usuario.perfil)) {
      throw semPermissao('Você não tem permissão para acessar este recurso.');
    }
    next();
  };
}
