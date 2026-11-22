import { useCallback, useEffect, useState } from 'react';
import { LayoutPagsInicio } from '../components/LayoutPagsInicio'; 
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import '../../static/css/PerfilFornecedor.css';

function chaveFornecedorUsuario(usuarioId) {
  return `partyhub_fornecedor_id_${usuarioId}`;
}

export function PerfilFornecedor() {
  const { usuario } = useAuth();

  const [perfil, setPerfil] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [formPerfil, setFormPerfil] = useState({
    nome_empresa: '',
    telefone_contato: '',
    whatsapp: '',
    email_contato: '',
    cidade: '',
    descricao: '',
  });

  const [novoServico, setNovoServico] = useState({
    categoria_id: '',
    descricao: '',
    preco_referencia: '',
  });
  const [servicoEditandoId, setServicoEditandoId] = useState(null);
  const [formServicoEdicao, setFormServicoEdicao] = useState({
    descricao: '',
    preco_referencia: '',
  });

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const preencherFormPerfil = useCallback((dados) => {
    setFormPerfil({
      nome_empresa: dados?.nome_empresa || '',
      telefone_contato: dados?.telefone_contato || '',
      whatsapp: dados?.whatsapp || '',
      email_contato: dados?.email_contato || '',
      cidade: dados?.cidade || '',
      descricao: dados?.descricao || '',
    });
  }, []);

  const carregarDados = useCallback(async () => {
    if (!usuario) return;
    setCarregando(true);
    setErro('');
    try {
      const listaCategorias = await api.listarCategorias();
      setCategorias(listaCategorias);
      if (listaCategorias.length > 0) {
        setNovoServico((prev) =>
          prev.categoria_id ? prev : { ...prev, categoria_id: String(listaCategorias[0].id) },
        );
      }

      let encontrado = null;
      const idSalvo = localStorage.getItem(chaveFornecedorUsuario(usuario.id));
      if (idSalvo) {
        try {
          const candidato = await api.obterFornecedor(idSalvo);
          if (candidato.usuario_id === usuario.id) {
            encontrado = candidato;
          }
        } catch {
          localStorage.removeItem(chaveFornecedorUsuario(usuario.id));
        }
      }

      if (!encontrado) {
        const catalogo = await api.listarFornecedores();
        encontrado = catalogo.find((f) => f.usuario_id === usuario.id) || null;
      }

      if (encontrado) {
        localStorage.setItem(
          chaveFornecedorUsuario(usuario.id),
          String(encontrado.id),
        );
        setPerfil(encontrado);
        preencherFormPerfil(encontrado);
      } else {
        setPerfil(null);
        setFormPerfil((prev) => ({
          ...prev,
          email_contato: prev.email_contato || usuario.email || '',
          telefone_contato: prev.telefone_contato || usuario.telefone || '',
        }));
      }
    } catch (err) {
      setErro(err.message || 'Erro ao carregar dados do perfil.');
    } finally {
      setCarregando(false);
    }
  }, [usuario, preencherFormPerfil]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  async function aoSalvarPerfil(event) {
    event.preventDefault();
    setErro('');
    setSucesso('');
    try {
      const salvo = await api.salvarMeuPerfilFornecedor({
        nome_empresa: formPerfil.nome_empresa,
        telefone_contato: formPerfil.telefone_contato,
        whatsapp: formPerfil.whatsapp.trim() || null,
        email_contato: formPerfil.email_contato.trim() || null,
        cidade: formPerfil.cidade.trim() || null,
        descricao: formPerfil.descricao.trim() || null,
      });
      localStorage.setItem(chaveFornecedorUsuario(usuario.id), String(salvo.id));
      setPerfil(salvo);
      preencherFormPerfil(salvo);
      setSucesso('Perfil de fornecedor salvo com sucesso!');
    } catch (err) {
      setErro(err.message || 'Erro ao salvar perfil.');
    }
  }

  async function aoAlternarAtivo() {
    if (!perfil) return;
    setErro('');
    setSucesso('');
    try {
      const atualizado = await api.alterarAtivoFornecedor(!perfil.ativo);
      setPerfil((prev) => ({ ...prev, ...atualizado }));
      setSucesso(
        atualizado.ativo
          ? 'Perfil ativado no catálogo.'
          : 'Perfil desativado temporariamente do catálogo.',
      );
    } catch (err) {
      setErro(err.message || 'Erro ao alterar status do perfil.');
    }
  }

  async function aoAdicionarServico(event) {
    event.preventDefault();
    setErro('');
    setSucesso('');
    try {
      const criado = await api.adicionarServico({
        categoria_id: Number(novoServico.categoria_id),
        descricao: novoServico.descricao.trim() || null,
        preco_referencia: novoServico.preco_referencia.trim() || null,
      });
      setPerfil((prev) => ({
        ...prev,
        servicos: [...(prev?.servicos || []), criado],
      }));
      setNovoServico((prev) => ({
        ...prev,
        descricao: '',
        preco_referencia: '',
      }));
      setSucesso('Serviço adicionado com sucesso!');
    } catch (err) {
      setErro(err.message || 'Erro ao adicionar serviço.');
    }
  }

  function iniciarEdicaoServico(servico) {
    setServicoEditandoId(servico.id);
    setFormServicoEdicao({
      descricao: servico.descricao || '',
      preco_referencia: servico.preco_referencia || '',
    });
  }

  async function aoSalvarEdicaoServico(event, servicoId) {
    event.preventDefault();
    setErro('');
    setSucesso('');
    try {
      const atualizado = await api.editarServico(servicoId, {
        descricao: formServicoEdicao.descricao.trim() || null,
        preco_referencia: formServicoEdicao.preco_referencia.trim() || null,
      });
      setPerfil((prev) => ({
        ...prev,
        servicos: (prev?.servicos || []).map((s) =>
          s.id === servicoId ? atualizado : s,
        ),
      }));
      setServicoEditandoId(null);
      setSucesso('Serviço atualizado!');
    } catch (err) {
      setErro(err.message || 'Erro ao atualizar serviço.');
    }
  }

  async function aoRemoverServico(servicoId) {
    if (!window.confirm('Remover este serviço?')) return;
    setErro('');
    setSucesso('');
    try {
      await api.removerServico(servicoId);
      setPerfil((prev) => ({
        ...prev,
        servicos: (prev?.servicos || []).filter((s) => s.id !== servicoId),
      }));
      setSucesso('Serviço removido.');
    } catch (err) {
      setErro(err.message || 'Erro ao remover serviço.');
    }
  }

  return (
    <LayoutPagsInicio titulo="Meu perfil e Serviços">
      <main className="perfil-fornecedor-container">
        <h1 className="perfil-page-title">Meu perfil e Serviços</h1>

        {sucesso && <p className="msg-feedback msg-sucesso">{sucesso}</p>}
        {erro && (
          <p role="alert" className="msg-feedback msg-erro">
            <strong>Erro:</strong> {erro}
          </p>
        )}
        {carregando && <p className="perfil-loading">Carregando dados do perfil...</p>}

        {!carregando && (
          <>
            <section className="perfil-secao">
              <h2 className="perfil-secao-titulo">Dados da empresa</h2>

              {perfil && (
                <div className="visibilidade-box">
                  <div className="visibilidade-status-row">
                    <span className="visibilidade-label">
                      Visibilidade no catálogo:{' '}
                      <strong className={perfil.ativo ? 'status-ativo' : 'status-inativo'}>
                        {perfil.ativo ? 'Ativo' : 'Desativado'}
                      </strong>
                    </span>
                    <button
                      type="button"
                      className="btn-toggle-status"
                      onClick={aoAlternarAtivo}
                    >
                      {perfil.ativo ? 'Desativar perfil' : 'Ativar perfil'}
                    </button>
                  </div>
                  <small className="visibilidade-nota">
                    Nota: seu perfil aparece no catálogo público apenas quando está ativo e possui ao menos 1 serviço cadastrado.
                  </small>
                </div>
              )}

              <form onSubmit={aoSalvarPerfil} className="fornecedor-form">
                <div className="form-row">
                  <label htmlFor="forn-empresa">Nome da empresa *</label>
                  <input
                    id="forn-empresa"
                    type="text"
                    value={formPerfil.nome_empresa}
                    onChange={(e) =>
                      setFormPerfil((p) => ({ ...p, nome_empresa: e.target.value }))
                    }
                    maxLength={120}
                    required
                  />
                </div>

                <div className="form-row">
                  <label htmlFor="forn-tel">Telefone de contato *</label>
                  <input
                    id="forn-tel"
                    type="text"
                    value={formPerfil.telefone_contato}
                    onChange={(e) =>
                      setFormPerfil((p) => ({
                        ...p,
                        telefone_contato: e.target.value,
                      }))
                    }
                    maxLength={30}
                    required
                  />
                </div>

                <div className="form-row">
                  <label htmlFor="forn-whats">WhatsApp</label>
                  <input
                    id="forn-whats"
                    type="text"
                    value={formPerfil.whatsapp}
                    onChange={(e) =>
                      setFormPerfil((p) => ({ ...p, whatsapp: e.target.value }))
                    }
                    maxLength={30}
                  />
                </div>

                <div className="form-row">
                  <label htmlFor="forn-email">E-mail de contato</label>
                  <input
                    id="forn-email"
                    type="email"
                    value={formPerfil.email_contato}
                    onChange={(e) =>
                      setFormPerfil((p) => ({ ...p, email_contato: e.target.value }))
                    }
                    maxLength={120}
                  />
                </div>

                <div className="form-row">
                  <label htmlFor="forn-cidade">Cidade</label>
                  <input
                    id="forn-cidade"
                    type="text"
                    value={formPerfil.cidade}
                    onChange={(e) =>
                      setFormPerfil((p) => ({ ...p, cidade: e.target.value }))
                    }
                    maxLength={80}
                  />
                </div>

                <div className="form-row form-row-textarea">
                  <label htmlFor="forn-desc">Descrição</label>
                  <textarea
                    id="forn-desc"
                    rows={3}
                    value={formPerfil.descricao}
                    onChange={(e) =>
                      setFormPerfil((p) => ({ ...p, descricao: e.target.value }))
                    }
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-acao-magenta">
                    {perfil ? 'Atualizar perfil' : 'Criar perfil de fornecedor'}
                  </button>
                </div>
              </form>
            </section>

            <hr className="perfil-divider" />

            <section className="perfil-secao">
              <h2 className="perfil-secao-titulo">Serviços que entrego</h2>

              {!perfil ? (
                <p className="perfil-aviso-bloqueio">
                  Salve os dados da empresa acima antes de adicionar serviços.
                </p>
              ) : (
                <div className="servicos-gestao">
                  {(perfil.servicos || []).length === 0 ? (
                    <p className="servicos-vazio">Nenhum serviço cadastrado ainda.</p>
                  ) : (
                    <ul className="servicos-cadastrados-list">
                      {perfil.servicos.map((s) => (
                        <li key={s.id} className="servico-item">
                          {servicoEditandoId === s.id ? (
                            <form
                              onSubmit={(e) => aoSalvarEdicaoServico(e, s.id)}
                              className="form-edicao-servico"
                            >
                              <strong className="servico-categoria-titulo">{s.categoria_nome}</strong>
                              <div className="form-row-inline">
                                <label htmlFor={`ed-serv-desc-${s.id}`}>Descrição:</label>
                                <input
                                  id={`ed-serv-desc-${s.id}`}
                                  type="text"
                                  value={formServicoEdicao.descricao}
                                  onChange={(e) =>
                                    setFormServicoEdicao((p) => ({
                                      ...p,
                                      descricao: e.target.value,
                                    }))
                                  }
                                />
                                <label htmlFor={`ed-serv-preco-${s.id}`}>Preço de ref.:</label>
                                <input
                                  id={`ed-serv-preco-${s.id}`}
                                  type="text"
                                  maxLength={80}
                                  value={formServicoEdicao.preco_referencia}
                                  onChange={(e) =>
                                    setFormServicoEdicao((p) => ({
                                      ...p,
                                      preco_referencia: e.target.value,
                                    }))
                                  }
                                />
                                <button type="submit" className="btn-acao-magenta btn-sm">Salvar</button>
                                <button
                                  type="button"
                                  className="btn-cancelar-sm"
                                  onClick={() => setServicoEditandoId(null)}
                                >
                                  Cancelar
                                </button>
                              </div>
                            </form>
                          ) : (
                            <div className="servico-item-view">
                              <span className="servico-texto">
                                • <strong>{s.categoria_nome}</strong>
                                {s.preco_referencia ? ` — a partir de ${s.preco_referencia}` : ''}
                                {s.descricao ? ` (${s.descricao})` : ''}
                              </span>
                              <div className="servico-acoes">
                                <button
                                  type="button"
                                  className="btn-link-acao"
                                  onClick={() => iniciarEdicaoServico(s)}
                                >
                                  Editar
                                </button>
                                <span className="separador">|</span>
                                <button
                                  type="button"
                                  className="btn-link-acao btn-link-remover"
                                  onClick={() => aoRemoverServico(s.id)}
                                >
                                  Remover
                                </button>
                              </div>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="adicionar-servico-box">
                    <h3 className="subtitulo-adicionar">Adicionar serviço</h3>
                    <form onSubmit={aoAdicionarServico} className="fornecedor-form">
                      <div className="form-row">
                        <label htmlFor="serv-cat">Categoria *</label>
                        <select
                          id="serv-cat"
                          value={novoServico.categoria_id}
                          onChange={(e) =>
                            setNovoServico((p) => ({
                              ...p,
                              categoria_id: e.target.value,
                            }))
                          }
                          required
                        >
                          {categorias.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.nome}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-row">
                        <label htmlFor="serv-preco">Preço de referência</label>
                        <input
                          id="serv-preco"
                          type="text"
                          placeholder="Ex.: a partir de R$ 800"
                          maxLength={80}
                          value={novoServico.preco_referencia}
                          onChange={(e) =>
                            setNovoServico((p) => ({
                              ...p,
                              preco_referencia: e.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="form-row form-row-textarea">
                        <label htmlFor="serv-desc">Descrição</label>
                        <textarea
                          id="serv-desc"
                          rows={2}
                          value={novoServico.descricao}
                          onChange={(e) =>
                            setNovoServico((p) => ({ ...p, descricao: e.target.value }))
                          }
                        />
                      </div>

                      <div className="form-actions">
                        <button type="submit" className="btn-acao-magenta">
                          Adicionar serviço
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </LayoutPagsInicio>
  );
}
