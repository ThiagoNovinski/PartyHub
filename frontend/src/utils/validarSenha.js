export const MENSAGEM_SENHA_INVALIDA =
  'A senha é obrigatória e deve ter pelo menos 6 caracteres.';

/**
 * Valida se a senha atende ao tamanho mínimo exigido pelo back-end.
 */
export function validarSenha(senha) {
  return typeof senha === 'string' && senha.length >= 6;
}
