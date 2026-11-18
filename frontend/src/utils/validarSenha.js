export const MENSAGEM_SENHA_INVALIDA =
  'A senha deve ter no mínimo 8 caracteres, incluindo uma letra maiúscula, um número e um caractere especial.';

/**
 * Valida se a senha atende aos critérios mínimos definidos no template original.
 */
export function validarSenha(senha) {
  return (
    senha.length >= 8 &&
    /[A-Z]/.test(senha) &&
    /[0-9]/.test(senha) &&
    /[^A-Za-z0-9]/.test(senha)
  );
}
