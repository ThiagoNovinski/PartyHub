import { useCallback, useEffect, useMemo, useState } from 'react';
import { Layout } from '../components/Layout';
import { Link } from '../router';
import { api } from '../services/api';

function chaveStackLocal(festaId) {
  return `partyhub_stack_local_${festaId}`;
}

function lerStackLocal(festaId) {
  try {
    const bruto = localStorage.getItem(chaveStackLocal(festaId));
    return bruto ? JSON.parse(bruto) : [];
  } catch {
    return [];
  }
}

export function StackDaFesta({ id }) {
  const [festa, setFesta] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [stackLocalIds, setStackLocalIds] = useState(() => lerStackLocal(id));
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('');

  const [categoriaBuscaAtiva, setCategoriaBuscaAtiva] = useState(null);
  const [cidadeFiltro, setCidadeFiltro] = useState('');
  const [fornecedoresEncontrados, setFornecedoresEncontrados] = useState([]);
  const [carregandoFornecedores, setCarregandoFornecedores] = useState(false);
  const [mensagensPorFornecedor, setMensagensPorFornecedor] = useState({});

  const [editando, setEditando] = useState(false);
  const [formEdicao, setFormEdicao] = useState(null);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [mensagemStatus, setMensagemStatus] = useState('');

  const carregarDados = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      const [dadosFesta, listaCategorias] = await Promise.all([
        api.obterFesta(id),
        api.listarCategorias(),
      ]);
      setFesta(dadosFesta);
      setCategorias(listaCategorias);
      if (listaCategorias.length > 0) {
        setCategoriaSelecionada((prev) => prev || String(listaCategorias[0].id));
      }
      setFormEdicao({
        titulo: dadosFesta.titulo || '',
        data: dadosFesta.data || '',
        hora_inicio: String(dadosFesta.hora_inicio || '').slice(0, 5),
        hora_fim: String(dadosFesta.hora_fim || '').slice(0, 5),
        local: dadosFesta.local || '',
        qtd_convidados: dadosFesta.qtd_convidados ?? '',
        tema: dadosFesta.tema || '',
        observacoes: dadosFesta.observacoes || '',
        status: dadosFesta.status || 'PLANEJANDO',
      });
    } catch (err) {
      setErro(err.message || 'Erro ao carregar festa.');
    } finally {
      setCarregando(false);
    }
  }, [id]);

  useEffect(() => {
    setStackLocalIds(lerStackLocal(id));
    setCategoriaBuscaAtiva(null);
    setFornecedoresEncontrados([]);
    carregarDados();
  }, [id, carregarDados]);

  const categoriasDaStack = useMemo(() => {
    const mapa = new Map();
    for (const item of festa?.stack || []) {
      mapa.set(item.categoria_id, item.categoria_nome);
    }
    for (const catId of stackLocalIds) {
      if (!mapa.has(catId)) {
        const cat = categorias.find((c) => c.id === catId);
        if (cat) mapa.set(cat.id, cat.nome);
      }
    }
    return Array.from(mapa.entries()).map(([categoria_id, categoria_nome]) => ({
      categoria_id,
      categoria_nome,
    }));
  }, [festa, stackLocalIds, categorias]);

  function salvarStackLocal(novosIds) {
    setStackLocalIds(novosIds);
    localStorage.setItem(chaveStackLocal(id), JSON.stringify(novosIds));
  }

  function aoAdicionarCategoriaNaStack(event) {
    event.preventDefault();
    const catId = Number(categoriaSelecionada);
    if (!catId) return;
    if (!stackLocalIds.includes(catId)) {
      salvarStackLocal([...stackLocalIds, catId]);
    }
    buscarFornecedoresDaCategoria(catId);
  }

  function aoRemoverCategoriaLocal(catId) {
    salvarStackLocal(stackLocalIds.filter((item) => item !== catId));
    if (categoriaBuscaAtiva === catId) {
      setCategoriaBuscaAtiva(null);
      setFornecedoresEncontrados([]);
    }
  }

  async function buscarFornecedoresDaCategoria(catId, cidadeOpc = cidadeFiltro) {
    setCategoriaBuscaAtiva(catId);
    setCarregandoFornecedores(true);
    setErro('');
    setMensagemStatus('');
    try {
      const lista = await api.listarFornecedores({
        categoria: catId,
        cidade: cidadeOpc.trim() || undefined,
      });
      setFornecedoresEncontrados(lista);
    } catch (err) {
      setErro(err.message || 'Erro ao buscar fornecedores.');
    } finally {
      setCarregandoFornecedores(false);
    }
  }

  async function aoSolicitarContato(fornecedorId, categoriaId) {
    setErro('');
    setMensagemStatus('');
    const chave = `${fornecedorId}-${categoriaId}`;
    const mensagem = (mensagensPorFornecedor[chave] || '').trim() || null;

    try {
      await api.criarSolicitacao(id, {
        fornecedor_id: fornecedorId,
        categoria_id: categoriaId,
        mensagem,
      });
      setMensagensPorFornecedor((prev) => ({ ...prev, [chave]: '' }));
      setMensagemStatus('Solicitação enviada com sucesso.');
      await carregarDados();
    } catch (err) {
      setErro(err.message || 'Erro ao enviar solicitação.');
    }
  }

  async function aoCancelarSolicitacao(solicitacaoId) {
    if (!window.confirm('Cancelar esta solicitação?')) return;
    setErro('');
    setMensagemStatus('');
    try {
      await api.cancelarSolicitacao(solicitacaoId);
      setMensagemStatus('Solicitação cancelada.');
      await carregarDados();
    } catch (err) {
      setErro(err.message || 'Erro ao cancelar solicitação.');
    }
  }

  async function aoSalvarEdicao(event) {
    event.preventDefault();
    setErro('');
    setMensagemStatus('');
    try {
      await api.editarFesta(id, {
        titulo: formEdicao.titulo,
        data: formEdicao.data,
        hora_inicio: formEdicao.hora_inicio,
        hora_fim: formEdicao.hora_fim,
        local: formEdicao.local.trim() || null,
        qtd_convidados: formEdicao.qtd_convidados
          ? Number(formEdicao.qtd_convidados)
          : null,
        tema: formEdicao.tema.trim() || null,
        observacoes: formEdicao.observacoes.trim() || null,
        status: formEdicao.status,
      });
      setEditando(false);
      setMensagemStatus('Festa atualizada com sucesso.');
      await carregarDados();
    } catch (err) {
      setErro(err.message || 'Erro ao editar festa.');
    }
  }

  async function aoCancelarFesta() {
    if (
      !window.confirm(
        'Deseja cancelar esta festa? Todas as solicitações pendentes serão canceladas.',
      )
    ) {
      return;
    }
    setErro('');
    setMensagemStatus('');
    try {
      await api.cancelarFesta(id);
      setMensagemStatus('Festa cancelada.');
      await carregarDados();
    } catch (err) {
      setErro(err.message || 'Erro ao cancelar festa.');
    }
  }

  const nomeCategoriaAtiva =
    categorias.find((c) => c.id === categoriaBuscaAtiva)?.nome || '';

  return (
    <Layout titulo={festa ? `Festa: ${festa.titulo}` : 'Stack da Festa'}>
      <p>
        <Link to="/festas">Voltar para Minhas Festas</Link>
      </p>

      {erro && (
        <p role="alert">
          <strong>Erro:</strong> {erro}
        </p>
      )}
      {mensagemStatus && <p>{mensagemStatus}</p>}
      {carregando && <p>Carregando dados da festa...</p>}

      {!carregando && festa && (
        <>
          <section>
            <h3>Detalhes da festa</h3>
            <p>
              <strong>Status:</strong> {festa.status}
            </p>
            <p>
              <strong>Data:</strong> {festa.data} | <strong>Horário:</strong>{' '}
              {String(festa.hora_inicio || '').slice(0, 5)} às{' '}
              {String(festa.hora_fim || '').slice(0, 5)}
            </p>
            <p>
              <strong>Local:</strong> {festa.local || 'Não informado'}
            </p>
            <p>
              <strong>Convidados:</strong> {festa.qtd_convidados ?? 'Não informado'}
            </p>
            <p>
              <strong>Tema:</strong> {festa.tema || 'Não informado'}
            </p>
            {festa.observacoes && (
              <p>
                <strong>Observações:</strong> {festa.observacoes}
              </p>
            )}

            {festa.status !== 'CANCELADA' && (
              <p>
                <button type="button" onClick={() => setEditando((v) => !v)}>
                  {editando ? 'Fechar edição' : 'Editar festa'}
                </button>{' '}
                <button type="button" onClick={aoCancelarFesta}>
                  Cancelar festa
                </button>
              </p>
            )}

            {editando && formEdicao && (
              <form onSubmit={aoSalvarEdicao}>
                <h4>Editar dados da festa</h4>
                <div>
                  <label htmlFor="ed-titulo">Título *</label>
                  <br />
                  <input
                    id="ed-titulo"
                    type="text"
                    value={formEdicao.titulo}
                    onChange={(e) =>
                      setFormEdicao((p) => ({ ...p, titulo: e.target.value }))
                    }
                    required
                  />
                </div>
                <br />
                <div>
                  <label htmlFor="ed-data">Data *</label>
                  <br />
                  <input
                    id="ed-data"
                    type="date"
                    value={formEdicao.data}
                    onChange={(e) =>
                      setFormEdicao((p) => ({ ...p, data: e.target.value }))
                    }
                    required
                  />
                </div>
                <br />
                <div>
                  <label htmlFor="ed-inicio">Hora início *</label>
                  <br />
                  <input
                    id="ed-inicio"
                    type="time"
                    value={formEdicao.hora_inicio}
                    onChange={(e) =>
                      setFormEdicao((p) => ({ ...p, hora_inicio: e.target.value }))
                    }
                    required
                  />
                </div>
                <br />
                <div>
                  <label htmlFor="ed-fim">Hora término *</label>
                  <br />
                  <input
                    id="ed-fim"
                    type="time"
                    value={formEdicao.hora_fim}
                    onChange={(e) =>
                      setFormEdicao((p) => ({ ...p, hora_fim: e.target.value }))
                    }
                    required
                  />
                </div>
                <br />
                <div>
                  <label htmlFor="ed-local">Local</label>
                  <br />
                  <input
                    id="ed-local"
                    type="text"
                    value={formEdicao.local}
                    onChange={(e) =>
                      setFormEdicao((p) => ({ ...p, local: e.target.value }))
                    }
                  />
                </div>
                <br />
                <div>
                  <label htmlFor="ed-qtd">Convidados</label>
                  <br />
                  <input
                    id="ed-qtd"
                    type="number"
                    min={1}
                    value={formEdicao.qtd_convidados}
                    onChange={(e) =>
                      setFormEdicao((p) => ({
                        ...p,
                        qtd_convidados: e.target.value,
                      }))
                    }
                  />
                </div>
                <br />
                <div>
                  <label htmlFor="ed-tema">Tema</label>
                  <br />
                  <input
                    id="ed-tema"
                    type="text"
                    value={formEdicao.tema}
                    onChange={(e) =>
                      setFormEdicao((p) => ({ ...p, tema: e.target.value }))
                    }
                  />
                </div>
                <br />
                <div>
                  <label htmlFor="ed-obs">Observações</label>
                  <br />
                  <textarea
                    id="ed-obs"
                    rows={2}
                    cols={40}
                    value={formEdicao.observacoes}
                    onChange={(e) =>
                      setFormEdicao((p) => ({ ...p, observacoes: e.target.value }))
                    }
                  />
                </div>
                <br />
                <div>
                  <label htmlFor="ed-status">Status</label>
                  <br />
                  <select
                    id="ed-status"
                    value={formEdicao.status}
                    onChange={(e) =>
                      setFormEdicao((p) => ({ ...p, status: e.target.value }))
                    }
                  >
                    <option value="PLANEJANDO">PLANEJANDO</option>
                    <option value="CONCLUIDA">CONCLUIDA</option>
                  </select>
                </div>
                <br />
                <button type="submit">Salvar alterações</button>
              </form>
            )}
          </section>

          <hr />

          <section>
            <h3>Stack da Festa (Categorias de serviço)</h3>
            {festa.status === 'PLANEJANDO' && (
              <form onSubmit={aoAdicionarCategoriaNaStack}>
                <label htmlFor="stack-cat">Adicionar categoria à stack: </label>
                <select
                  id="stack-cat"
                  value={categoriaSelecionada}
                  onChange={(e) => setCategoriaSelecionada(e.target.value)}
                >
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>{' '}
                <button type="submit">Adicionar e buscar fornecedores</button>
              </form>
            )}

            {categoriasDaStack.length === 0 ? (
              <p>
                Nenhuma categoria na stack ainda. Escolha uma categoria acima para
                montar a stack e buscar fornecedores.
              </p>
            ) : (
              <ul>
                {categoriasDaStack.map((cat) => {
                  const solsDaCategoria = (festa.solicitacoes || []).filter(
                    (s) => s.categoria_id === cat.categoria_id,
                  );
                  const jaNoBanco = (festa.stack || []).some(
                    (s) => s.categoria_id === cat.categoria_id,
                  );

                  return (
                    <li key={cat.categoria_id}>
                      <strong>{cat.categoria_nome}</strong> —{' '}
                      {solsDaCategoria.length === 0
                        ? 'Sem solicitações enviadas'
                        : solsDaCategoria
                            .map((s) => `${s.fornecedor_nome}: ${s.status}`)
                            .join('; ')}{' '}
                      <button
                        type="button"
                        onClick={() =>
                          buscarFornecedoresDaCategoria(cat.categoria_id)
                        }
                      >
                        Buscar fornecedores
                      </button>
                      {!jaNoBanco && (
                        <>
                          {' '}
                          <button
                            type="button"
                            onClick={() =>
                              aoRemoverCategoriaLocal(cat.categoria_id)
                            }
                          >
                            Remover da lista
                          </button>
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            {categoriaBuscaAtiva !== null && (
              <div>
                <h4>Fornecedores para: {nomeCategoriaAtiva}</h4>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    buscarFornecedoresDaCategoria(categoriaBuscaAtiva, cidadeFiltro);
                  }}
                >
                  <label htmlFor="stack-cidade">Filtrar por cidade: </label>
                  <input
                    id="stack-cidade"
                    type="text"
                    value={cidadeFiltro}
                    onChange={(e) => setCidadeFiltro(e.target.value)}
                    placeholder="Ex.: Rio Grande"
                  />{' '}
                  <button type="submit">Filtrar</button>
                </form>

                {carregandoFornecedores && <p>Buscando fornecedores...</p>}
                {!carregandoFornecedores && fornecedoresEncontrados.length === 0 && (
                  <p>Nenhum fornecedor ativo encontrado para esta categoria.</p>
                )}
                {!carregandoFornecedores && fornecedoresEncontrados.length > 0 && (
                  <ul>
                    {fornecedoresEncontrados.map((forn) => {
                      const servico = (forn.servicos || []).find(
                        (s) => s.categoria_id === categoriaBuscaAtiva,
                      );
                      const chave = `${forn.id}-${categoriaBuscaAtiva}`;
                      const jaSolicitado = (festa.solicitacoes || []).some(
                        (s) =>
                          s.fornecedor_id === forn.id &&
                          s.categoria_id === categoriaBuscaAtiva,
                      );

                      return (
                        <li key={forn.id}>
                          <strong>{forn.nome_empresa}</strong> ({forn.cidade || 'Sem cidade'})
                          <br />
                          {servico?.descricao && <span>{servico.descricao} — </span>}
                          {servico?.preco_referencia && (
                            <span>Preço: {servico.preco_referencia} — </span>
                          )}
                          <span>
                            Contatos: {forn.telefone_contato}
                            {forn.whatsapp ? ` / WhatsApp: ${forn.whatsapp}` : ''}
                            {forn.email_contato ? ` / ${forn.email_contato}` : ''}
                          </span>
                          <br />
                          <Link to={`/fornecedores/${forn.id}`}>Ver perfil completo</Link>
                          {festa.status === 'PLANEJANDO' && (
                            <div>
                              {jaSolicitado ? (
                                <span>
                                  <em>Já solicitado para esta categoria nesta festa.</em>
                                </span>
                              ) : (
                                <>
                                  <input
                                    type="text"
                                    placeholder="Mensagem opcional para o fornecedor"
                                    value={mensagensPorFornecedor[chave] || ''}
                                    onChange={(e) =>
                                      setMensagensPorFornecedor((prev) => ({
                                        ...prev,
                                        [chave]: e.target.value,
                                      }))
                                    }
                                  />{' '}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      aoSolicitarContato(forn.id, categoriaBuscaAtiva)
                                    }
                                  >
                                    Solicitar contato
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                          <br />
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </section>

          <hr />

          <section>
            <h3>Solicitações da festa</h3>
            {festa.solicitacoes.length === 0 ? (
              <p>Nenhuma solicitação enviada para esta festa ainda.</p>
            ) : (
              <ul>
                {festa.solicitacoes.map((s) => (
                  <li key={s.id}>
                    <p>
                      <strong>{s.categoria_nome}</strong> — {s.fornecedor_nome} —{' '}
                      <strong>Status: {s.status}</strong>
                    </p>
                    <p>
                      Contatos do fornecedor: {s.telefone_contato}
                      {s.whatsapp ? ` | WhatsApp: ${s.whatsapp}` : ''}
                      {s.email_contato ? ` | E-mail: ${s.email_contato}` : ''}
                    </p>
                    {s.mensagem && (
                      <p>
                        <strong>Sua mensagem:</strong> {s.mensagem}
                      </p>
                    )}
                    {s.resposta && (
                      <p>
                        <strong>Resposta do fornecedor:</strong> {s.resposta}
                      </p>
                    )}
                    {s.status === 'PENDENTE' && festa.status === 'PLANEJANDO' && (
                      <p>
                        <button
                          type="button"
                          onClick={() => aoCancelarSolicitacao(s.id)}
                        >
                          Cancelar solicitação
                        </button>
                      </p>
                    )}
                    <hr />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </Layout>
  );
}
