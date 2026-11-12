export class AppError extends Error {
  constructor(status, erro, mensagem) {
    super(mensagem);
    this.status = status;
    this.erro = erro;
  }
}

export const dadosInvalidos = (mensagem) => new AppError(400, 'DADOS_INVALIDOS', mensagem);

export const naoAutenticado = (mensagem = 'Autenticação necessária.') =>
  new AppError(401, 'NAO_AUTENTICADO', mensagem);

export const semPermissao = (mensagem = 'Você não tem permissão para esta ação.') =>
  new AppError(403, 'SEM_PERMISSAO', mensagem);

export const naoEncontrado = (mensagem = 'Recurso não encontrado.') =>
  new AppError(404, 'NAO_ENCONTRADO', mensagem);

export const conflito = (erro, mensagem) => new AppError(409, erro, mensagem);