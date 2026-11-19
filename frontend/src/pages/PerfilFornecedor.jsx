import { useCallback, useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

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
          : 'Perfil desativado temporariamente.',
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
    <Layout titulo="Meu Perfil e Serviços">
      {erro && (
        <p role="alert">
          <strong>Erro:</strong> {erro}
        </p>
      )}
      {sucesso && <p>{sucesso}</p>}
      {carregando && <p>Carregando...</p>}

      {!carregando && (
        <>
          <section>
            <h3>Dados da empresa</h3>
            {perfil && (
              <p>
                <strong>Visibilidade no catálogo:</strong>{' '}
                {perfil.ativo ? 'Ativo' : 'Desativado'}{' '}
                <button type="button" onClick={aoAlternarAtivo}>
                  {perfil.ativo ? 'Desativar perfil' : 'Ativar perfil'}
                </button>
                <br />
                <small>
                  Nota: seu perfil aparece no catálogo público apenas quando está
                  ativo e possui ao menos 1 serviço cadastrado.
                </small>
              </p>
            )}

            <form onSubmit={aoSalvarPerfil}>
              <div>
                <label htmlFor="forn-empresa">Nome da empresa *</label>
                <br />
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
              <br />
              <div>
                <label htmlFor="forn-tel">Telefone de contato *</label>
                <br />
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
              <br />
              <div>
                <label htmlFor="forn-whats">WhatsApp</label>
                <br />
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
              <br />
              <div>
                <label htmlFor="forn-email">E-mail de contato</label>
                <br />
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
              <br />
              <div>
                <label htmlFor="forn-cidade">Cidade</label>
                <br />
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
              <br />
              <div>
                <label htmlFor="forn-desc">Descrição</label>
                <br />
                <textarea
                  id="forn-desc"
                  rows={3}
                  cols={40}
                  value={formPerfil.descricao}
                  onChange={(e) =>
                    setFormPerfil((p) => ({ ...p, descricao: e.target.value }))
                  }
                />
              </div>
              <br />
              <button type="submit">
                {perfil ? 'Atualizar perfil' : 'Criar perfil de fornecedor'}
              </button>
            </form>
          </section>

          <hr />

          <section>
            <h3>Serviços que entrego</h3>
            {!perfil ? (
              <p>Salve os dados da empresa acima antes de adicionar serviços.</p>
            ) : (
              <>
                {(perfil.servicos || []).length === 0 ? (
                  <p>Nenhum serviço cadastrado ainda.</p>
                ) : (
                  <ul>
                    {perfil.servicos.map((s) => (
                      <li key={s.id}>
                        {servicoEditandoId === s.id ? (
                          <form onSubmit={(e) => aoSalvarEdicaoServico(e, s.id)}>
                            <strong>{s.categoria_nome}</strong>
                            <br />
                            <label htmlFor={`ed-serv-desc-${s.id}`}>
                              Descrição:{' '}
                            </label>
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
                            />{' '}
                            <label htmlFor={`ed-serv-preco-${s.id}`}>
                              Preço de referência:{' '}
                            </label>
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
                            />{' '}
                            <button type="submit">Salvar</button>{' '}
                            <button
                              type="button"
                              onClick={() => setServicoEditandoId(null)}
                            >
                              Cancelar
                            </button>
                          </form>
                        ) : (
                          <div>
                            <strong>{s.categoria_nome}</strong>
                            {s.preco_referencia ? ` (${s.preco_referencia})` : ''}
                            {s.descricao ? ` — ${s.descricao}` : ''}{' '}
                            <button
                              type="button"
                              onClick={() => iniciarEdicaoServico(s)}
                            >
                              Editar
                            </button>{' '}
                            <button
                              type="button"
                              onClick={() => aoRemoverServico(s.id)}
                            >
                              Remover
                            </button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                <h4>Adicionar serviço</h4>
                <form onSubmit={aoAdicionarServico}>
                  <div>
                    <label htmlFor="serv-cat">Categoria *</label>
                    <br />
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
                  <br />
                  <div>
                    <label htmlFor="serv-preco">Preço de referência</label>
                    <br />
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
                  <br />
                  <div>
                    <label htmlFor="serv-desc">Descrição</label>
                    <br />
                    <textarea
                      id="serv-desc"
                      rows={2}
                      cols={40}
                      value={novoServico.descricao}
                      onChange={(e) =>
                        setNovoServico((p) => ({ ...p, descricao: e.target.value }))
                      }
                    />
                  </div>
                  <br />
                  <button type="submit">Adicionar serviço</button>
                </form>
              </>
            )}
          </section>
        </>
      )}
    </Layout>
  );
}
