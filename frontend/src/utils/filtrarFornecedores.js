/**
 * Normaliza texto para comparação insensível a maiúsculas/minúsculas e acentos.
 */
export function normalizarTexto(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

/**
 * Filtra fornecedores por correspondência parcial na cidade/local.
 */
export function filtrarFornecedoresPorLocal(fornecedores, termoLocal) {
  const termo = normalizarTexto(termoLocal);
  if (!termo) return fornecedores;
  return fornecedores.filter((f) =>
    normalizarTexto(f.cidade).includes(termo),
  );
}
