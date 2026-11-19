const API_BASE = import.meta.env.VITE_API_BASE || '/api';
const TOKEN_KEY = 'partyhub_token';

export class ApiError extends Error {
  constructor(status, erro, mensagem) {
    super(mensagem || 'Erro na requisição.');
    this.status = status;
    this.erro = erro || 'ERRO_DESCONHECIDO';
  }
}

export function obterToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function salvarToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function requisitar(caminho, opcoes = {}) {
  const { metodo = 'GET', corpo, token = obterToken() } = opcoes;
  const cabecalhos = {};

  if (corpo !== undefined) {
    cabecalhos['Content-Type'] = 'application/json';
  }
  if (token) {
    cabecalhos.Authorization = `Bearer ${token}`;
  }

  let resposta;
  try {
    resposta = await fetch(`${API_BASE}${caminho}`, {
      method: metodo,
      headers: cabecalhos,
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
    });
  } catch {
    throw new ApiError(0, 'REDE', 'Não foi possível conectar ao servidor da API.');
  }

  if (resposta.status === 204) {
    return null;
  }

  let dados = null;
  const tipoConteudo = resposta.headers.get('content-type') || '';
  if (tipoConteudo.includes('application/json')) {
    dados = await resposta.json().catch(() => null);
  }

  if (!resposta.ok) {
    throw new ApiError(
      resposta.status,
      dados?.erro || 'ERRO_HTTP',
      dados?.mensagem || `Erro HTTP ${resposta.status}.`,
    );
  }

  return dados;
}

export const api = {
  // Saúde
  health: () => requisitar('/health', { token: null }),

  // Autenticação
  registrar: (dados) =>
    requisitar('/auth/registrar', { metodo: 'POST', corpo: dados, token: null }),
  login: (dados) =>
    requisitar('/auth/login', { metodo: 'POST', corpo: dados, token: null }),
  obterEu: () => requisitar('/auth/eu'),

  // Categorias e catálogo público
  listarCategorias: () => requisitar('/categorias', { token: null }),
  listarFornecedores: (filtros = {}) => {
    const params = new URLSearchParams();
    if (filtros.categoria) params.set('categoria', String(filtros.categoria));
    if (filtros.cidade) params.set('cidade', filtros.cidade);
    const qs = params.toString();
    return requisitar(`/fornecedores${qs ? `?${qs}` : ''}`, { token: null });
  },
  obterFornecedor: (id) => requisitar(`/fornecedores/${id}`, { token: null }),

  // Fornecedor logado
  salvarMeuPerfilFornecedor: (dados) =>
    requisitar('/fornecedores/meu', { metodo: 'PUT', corpo: dados }),
  adicionarServico: (dados) =>
    requisitar('/fornecedores/meu/servicos', { metodo: 'POST', corpo: dados }),
  editarServico: (id, dados) =>
    requisitar(`/fornecedores/meu/servicos/${id}`, { metodo: 'PUT', corpo: dados }),
  removerServico: (id) =>
    requisitar(`/fornecedores/meu/servicos/${id}`, { metodo: 'DELETE' }),
  alterarAtivoFornecedor: (ativo) =>
    requisitar('/fornecedores/meu/ativo', { metodo: 'PATCH', corpo: { ativo } }),

  // Festas (cliente logado)
  listarMinhasFestas: () => requisitar('/festas'),
  criarFesta: (dados) =>
    requisitar('/festas', { metodo: 'POST', corpo: dados }),
  obterFesta: (id) => requisitar(`/festas/${id}`),
  editarFesta: (id, dados) =>
    requisitar(`/festas/${id}`, { metodo: 'PUT', corpo: dados }),
  cancelarFesta: (id) =>
    requisitar(`/festas/${id}/cancelar`, { metodo: 'PATCH' }),

  // Solicitações
  criarSolicitacao: (festaId, dados) =>
    requisitar(`/festas/${festaId}/solicitacoes`, { metodo: 'POST', corpo: dados }),
  cancelarSolicitacao: (id) =>
    requisitar(`/solicitacoes/${id}/cancelar`, { metodo: 'PATCH' }),
  listarSolicitacoesRecebidas: (status) => {
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    return requisitar(`/solicitacoes/recebidas${qs}`);
  },
  responderSolicitacao: (id, dados) =>
    requisitar(`/solicitacoes/${id}/responder`, { metodo: 'PATCH', corpo: dados }),
};
