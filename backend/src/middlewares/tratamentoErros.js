import { AppError } from '../erros.js';

export function rotaNaoEncontrada(_req, res) {
  res.status(404).json({ erro: 'NAO_ENCONTRADO', mensagem: 'Rota não encontrada.' });
}

export function tratarErros(err, _req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ erro: err.erro, mensagem: err.message });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'DADOS_INVALIDOS', mensagem: 'JSON inválido no corpo da requisição.' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(400).json({ erro: 'DADOS_INVALIDOS', mensagem: 'Corpo da requisição muito grande.' });
  }

  console.error(err);
  return res.status(500).json({ erro: 'ERRO_INTERNO', mensagem: 'Erro interno do servidor.' });
}