import { useCallback, useEffect, useMemo, useState } from 'react';
import { InputHora24h } from '../components/InputHora24h';
import { LayoutPagsInicio } from '../components/LayoutPagsInicio';
import { Link } from '../router';
import { api } from '../services/api';
import { filtrarFornecedoresPorLocal } from '../utils/filtrarFornecedores';
import '../../static/css/StackDaFesta.css';

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
  const [cidadeAplicada, setCidadeAplicada] = useState('');
  const [totalFornecedoresCategoria, setTotalFornecedoresCategoria] = useState(0);
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
    setCidadeFiltro('');
    setCidadeAplicada('');
    setTotalFornecedoresCategoria(0);
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

  // Filtra as categorias ativas que ainda NÃO possuem solicitações enviadas
  const categoriasSemSolicitacao = useMemo(() => {
    return categoriasDaStack.filter((cat) => {
      const temSolicitacao = (festa?.solicitacoes || []).some(
        (s) => s.categoria_id === cat.categoria_id,
      );
      return !temSolicitacao;
    });
  }, [categoriasDaStack, festa?.solicitacoes]);

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
      });
      setTotalFornecedoresCategoria(lista.length);
      setCidadeAplicada(cidadeOpc.trim());
      setFornecedoresEncontrados(filtrarFornecedoresPorLocal(lista, cidadeOpc));
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
    <LayoutPagsInicio titulo={festa ? `Festa: ${festa.titulo}` : 'Stack da Festa'}>
      <main className="stack-festa-container">
        <h1 className="stack-page-title">
          Festa: {festa ? festa.titulo : 'nome cadastrado para a festa'}
        </h1>
        <p className="stack-voltar-row">
          <Link to="/festas" className="stack-link-voltar">
            Voltar para Minhas Festas
          </Link>
        </p>

        {erro && (
          <p role="alert" className="msg-feedback msg-erro">
            <strong>Erro:</strong> {erro}
          </p>
        )}
        {mensagemStatus && <p className="msg-feedback msg-sucesso">{mensagemStatus}</p>}
        {carregando && <p className="stack-info-msg">Carregando dados da festa...</p>}

        {!carregando && festa && (
          <>
            <section className="stack-secao">
              <h2 className="stack-secao-titulo">Detalhes da festa</h2>
              <div className="stack-dados-detalhes">
                <p className="stack-linha-detalhe">
                  <span className="detalhe-rotulo">Status:</span> {festa.status}
                </p>
                <p className="stack-linha-detalhe">
                  <span className="detalhe-rotulo">Data:</span> {festa.data} |{' '}
                  <span className="detalhe-rotulo">Horário:</span>{' '}
                  {String(festa.hora_inicio || '').slice(0, 5)} às{' '}
                  {String(festa.hora_fim || '').slice(0, 5)}
                </p>
                <p className="stack-linha-detalhe">
                  <span className="detalhe-rotulo">Local:</span> {festa.local || 'local escolhido'}
                </p>
                <p className="stack-linha-detalhe">
                  <span className="detalhe-rotulo">Convidados:</span>{' '}
                  {festa.qtd_convidados ?? 'quantidade de convidados escolhidos'}
                </p>
                <p className="stack-linha-detalhe">
                  <span className="detalhe-rotulo">Tema:</span> {festa.tema || 'tema escolhido'}
                </p>
                {festa.observacoes && (
                  <p className="stack-linha-detalhe">
                    <span className="detalhe-rotulo">Observações:</span> {festa.observacoes}
                  </p>
                )}
              </div>

              {festa.status !== 'CANCELADA' && (
                <div className="stack-acoes-festa">
                  <button
                    type="button"
                    className="btn-pilula-magenta"
                    onClick={() => setEditando((v) => !v)}
                  >
                    {editando ? 'Fechar edição' : 'Editar festa'}
                  </button>
                  <button
                    type="button"
                    className="btn-pilula-magenta"
                    onClick={aoCancelarFesta}
                  >
                    Cancelar festa
                  </button>
                </div>
              )}

              {editando && formEdicao && (
                <form onSubmit={aoSalvarEdicao} className="stack-form-edicao">
                  <h3 className="subtitulo-edicao">Editar dados da festa</h3>
                  
                  <div className="form-edicao-grid">
                    <div className="form-campo">
                      <label htmlFor="ed-titulo">Título *</label>
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

                    <div className="form-campo">
                      <label htmlFor="ed-data">Data *</label>
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

                    <div className="form-campo">
                      <label htmlFor="ed-inicio">Hora início (24h) *</label>
                      <InputHora24h
                        id="ed-inicio"
                        value={formEdicao.hora_inicio}
                        onChange={(valor) =>
                          setFormEdicao((p) => ({ ...p, hora_inicio: valor }))
                        }
                        required
                      />
                    </div>

                    <div className="form-campo">
                      <label htmlFor="ed-fim">Hora término (24h) *</label>
                      <InputHora24h
                        id="ed-fim"
                        value={formEdicao.hora_fim}
                        onChange={(valor) =>
                          setFormEdicao((p) => ({ ...p, hora_fim: valor }))
                        }
                        required
                      />
                    </div>

                    <div className="form-campo">
                      <label htmlFor="ed-local">Local</label>
                      <input
                        id="ed-local"
                        type="text"
                        value={formEdicao.local}
                        onChange={(e) =>
                          setFormEdicao((p) => ({ ...p, local: e.target.value }))
                        }
                      />
                    </div>

                    <div className="form-campo">
                      <label htmlFor="ed-qtd">Convidados</label>
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

                    <div className="form-campo">
                      <label htmlFor="ed-tema">Tema</label>
                      <input
                        id="ed-tema"
                        type="text"
                        value={formEdicao.tema}
                        onChange={(e) =>
                          setFormEdicao((p) => ({ ...p, tema: e.target.value }))
                        }
                      />
                    </div>

                    <div className="form-campo">
                      <label htmlFor="ed-status">Status</label>
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

                    <div className="form-campo form-campo-full">
                      <label htmlFor="ed-obs">Observações</label>
                      <textarea
                        id="ed-obs"
                        rows={2}
                        value={formEdicao.observacoes}
                        onChange={(e) =>
                          setFormEdicao((p) => ({ ...p, observacoes: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  <div className="form-edicao-acoes">
                    <button type="submit" className="btn-pilula-magenta">
                      Salvar alterações
                    </button>
                  </div>
                </form>
              )}
            </section>

            <hr className="stack-divisor" />

            <section className="stack-secao">
              <h2 className="stack-secao-titulo">Stack da Festa (Categorias de serviço)</h2>

              {festa.status === 'PLANEJANDO' && (
                <form onSubmit={aoAdicionarCategoriaNaStack} className="stack-adicionar-form">
                  <label htmlFor="stack-cat" className="stack-adicionar-label">
                    Adicionar categoria à stack:
                  </label>
                  <select
                    id="stack-cat"
                    className="stack-select-pilula"
                    value={categoriaSelecionada}
                    onChange={(e) => setCategoriaSelecionada(e.target.value)}
                  >
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="btn-pilula-magenta">
                    Adicionar e buscar fornecedores
                  </button>
                </form>
              )}

              {categoriasSemSolicitacao.length === 0 ? (
                <p className="stack-aviso-vazio">
                  Nenhuma categoria pendente de solicitação na stack. Adicione uma categoria acima para
                  montar a stack e buscar fornecedores.
                </p>
              ) : (
                <ul className="stack-lista-itens">
                  {categoriasSemSolicitacao.map((cat) => {
                    const jaNoBanco = (festa.stack || []).some(
                      (s) => s.categoria_id === cat.categoria_id,
                    );

                    return (
                      <li key={cat.categoria_id} className="stack-item-linha">
                        <div className="stack-item-info">
                          <strong>{cat.categoria_nome}</strong> — Sem solicitações enviadas
                        </div>
                        <div className="stack-item-botoes">
                          <button
                            type="button"
                            className="btn-pilula-magenta btn-sm"
                            onClick={() =>
                              buscarFornecedoresDaCategoria(cat.categoria_id)
                            }
                          >
                            Buscar fornecedores
                          </button>
                          {!jaNoBanco && (
                            <button
                              type="button"
                              className="btn-pilula-remover btn-sm"
                              onClick={() =>
                                aoRemoverCategoriaLocal(cat.categoria_id)
                              }
                            >
                              Remover da lista
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              {categoriaBuscaAtiva !== null && (
                <div className="stack-busca-resultado">
                  <h3 className="subtitulo-busca">
                    Fornecedores para: {nomeCategoriaAtiva}
                  </h3>
                  
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      buscarFornecedoresDaCategoria(categoriaBuscaAtiva, cidadeFiltro);
                    }}
                    className="stack-busca-filtro-form"
                  >
                    <label htmlFor="stack-cidade">Filtrar por cidade / local:</label>
                    <input
                      id="stack-cidade"
                      type="text"
                      className="stack-input-pilula"
                      value={cidadeFiltro}
                      onChange={(e) => setCidadeFiltro(e.target.value)}
                      placeholder="Ex.: Pelotas"
                    />
                    <button type="submit" className="btn-pilula-magenta btn-sm">
                      Filtrar
                    </button>
                    <button
                      type="button"
                      className="btn-pilula-magenta btn-sm"
                      onClick={() => {
                        setCidadeFiltro('');
                        buscarFornecedoresDaCategoria(categoriaBuscaAtiva, '');
                      }}
                    >
                      Limpar
                    </button>
                    {festa.local && (
                      <button
                        type="button"
                        className="btn-pilula-secundario btn-sm"
                        onClick={() => {
                          setCidadeFiltro(festa.local);
                          buscarFornecedoresDaCategoria(
                            categoriaBuscaAtiva,
                            festa.local,
                          );
                        }}
                      >
                        Usar local da festa ({festa.local})
                      </button>
                    )}
                  </form>

                  {carregandoFornecedores && (
                    <p className="stack-info-msg">Buscando fornecedores...</p>
                  )}

                  {!carregandoFornecedores && fornecedoresEncontrados.length === 0 && (
                    <div className="stack-aviso-busca">
                      <p>
                        Nenhum fornecedor ativo encontrado para {nomeCategoriaAtiva}
                        {cidadeAplicada ? ` em "${cidadeAplicada}"` : ''}.
                      </p>
                      {cidadeAplicada && totalFornecedoresCategoria > 0 && (
                        <p>
                          Existem {totalFornecedoresCategoria} fornecedor(es) ativo(s)
                          para esta categoria em outras cidades.{' '}
                          <button
                            type="button"
                            className="btn-pilula-magenta btn-sm"
                            style={{ marginLeft: '8px' }}
                            onClick={() => {
                              setCidadeFiltro('');
                              buscarFornecedoresDaCategoria(categoriaBuscaAtiva, '');
                            }}
                          >
                            Mostrar todas as cidades
                          </button>
                        </p>
                      )}
                    </div>
                  )}

                  {!carregandoFornecedores && fornecedoresEncontrados.length > 0 && (
                    <ul className="stack-fornecedores-lista">
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
                          <li key={forn.id} className="fornecedor-card-item">
                            <div className="forn-info-topo">
                              <strong>{forn.nome_empresa}</strong> ({forn.cidade || 'Sem cidade'})
                            </div>
                            <div className="forn-detalhes-texto">
                              {servico?.descricao && <span>{servico.descricao} — </span>}
                              {servico?.preco_referencia && (
                                <span>Preço: {servico.preco_referencia} — </span>
                              )}
                              <span>
                                Contatos: {forn.telefone_contato}
                                {forn.whatsapp ? ` / WhatsApp: ${forn.whatsapp}` : ''}
                                {forn.email_contato ? ` / ${forn.email_contato}` : ''}
                              </span>
                            </div>
                            <div className="forn-perfil-link-row">
                              <Link to={`/fornecedores/${forn.id}`} className="stack-link-underline">
                                Ver perfil completo
                              </Link>
                            </div>

                            {festa.status === 'PLANEJANDO' && (
                              <div className="forn-solicitar-box">
                                {jaSolicitado ? (
                                  <span className="forn-ja-solicitado">
                                    <em>Já solicitado para esta categoria nesta festa.</em>
                                  </span>
                                ) : (
                                  <div className="forn-solicitar-form">
                                    <input
                                      type="text"
                                      className="stack-input-pilula forn-input-msg"
                                      placeholder="Mensagem opcional para o fornecedor"
                                      value={mensagensPorFornecedor[chave] || ''}
                                      onChange={(e) =>
                                        setMensagensPorFornecedor((prev) => ({
                                          ...prev,
                                          [chave]: e.target.value,
                                        }))
                                      }
                                    />
                                    <button
                                      type="button"
                                      className="btn-pilula-magenta btn-sm"
                                      onClick={() =>
                                        aoSolicitarContato(forn.id, categoriaBuscaAtiva)
                                      }
                                    >
                                      Solicitar contato
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}
            </section>

            <hr className="stack-divisor" />

            <section className="stack-secao">
              <h2 className="stack-secao-titulo">Solicitações da festa</h2>
              {festa.solicitacoes.length === 0 ? (
                <p className="stack-aviso-vazio">
                  Nenhuma solicitação enviada para esta festa ainda.
                </p>
              ) : (
                <ul className="stack-solicitacoes-lista">
                  {festa.solicitacoes.map((s) => (
                    <li key={s.id} className="solicitacao-item-card">
                      <div className="solicitacao-topo">
                        <strong className="solic-cat-nome">{s.categoria_nome}</strong> — {s.fornecedor_nome}
                        <span className={`solic-badge badge-${s.status.toLowerCase()}`}>
                          Status: {s.status}
                        </span>
                      </div>
                      <p className="solic-contatos">
                        Contatos do fornecedor: {s.telefone_contato}
                        {s.whatsapp ? ` | WhatsApp: ${s.whatsapp}` : ''}
                        {s.email_contato ? ` | E-mail: ${s.email_contato}` : ''}
                      </p>
                      {s.mensagem && (
                        <p className="solic-mensagem">
                          <strong>Sua mensagem:</strong> &quot;{s.mensagem}&quot;
                        </p>
                      )}
                      {s.resposta && (
                        <p className="solic-resposta">
                          <strong>Resposta do fornecedor:</strong> &quot;{s.resposta}&quot;
                        </p>
                      )}
                      {s.status === 'PENDENTE' && festa.status === 'PLANEJANDO' && (
                        <div className="solic-acoes">
                          <button
                            type="button"
                            className="btn-pilula-remover btn-sm"
                            onClick={() => aoCancelarSolicitacao(s.id)}
                          >
                            Cancelar solicitação
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
    </LayoutPagsInicio>
  );
}
