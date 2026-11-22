import { useEffect, useState } from 'react';
import { LayoutPagsInicio } from '../components/LayoutPagsInicio';
import { useAuth } from '../context/AuthContext';
import { Link } from '../router';
import { api } from '../services/api';
import '../../static/css/DetalheFornecedor.css';

export function DetalheFornecedor({ id }) {
  const { usuario } = useAuth();
  const [fornecedor, setFornecedor] = useState(null);
  const [festas, setFestas] = useState([]);
  const [festaId, setFestaId] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [erroSolicitacao, setErroSolicitacao] = useState('');
  const [sucessoSolicitacao, setSucessoSolicitacao] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setErro('');

    api
      .obterFornecedor(id)
      .then((dados) => {
        if (!ativo) return;
        setFornecedor(dados);
        if (dados.servicos?.length > 0) {
          setCategoriaId(String(dados.servicos[0].categoria_id));
        }
      })
      .catch((err) => {
        if (!ativo) return;
        setErro(err.message || 'Fornecedor não encontrado.');
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, [id]);

  useEffect(() => {
    if (usuario?.perfil !== 'cliente') return;
    api
      .listarMinhasFestas()
      .then((lista) => {
        const planejando = lista.filter((f) => f.status === 'PLANEJANDO');
        setFestas(planejando);
        if (planejando.length > 0) {
          setFestaId(String(planejando[0].id));
        }
      })
      .catch(() => {});
  }, [usuario]);

  async function aoSolicitar(event) {
    event.preventDefault();
    setErroSolicitacao('');
    setSucessoSolicitacao('');

    if (!festaId || !categoriaId) {
      setErroSolicitacao('Selecione uma festa e uma categoria de serviço.');
      return;
    }

    setEnviando(true);
    try {
      await api.criarSolicitacao(festaId, {
        fornecedor_id: Number(id),
        categoria_id: Number(categoriaId),
        mensagem: mensagem.trim() || null,
      });
      setMensagem('');
      setSucessoSolicitacao('Solicitação enviada com sucesso!');
    } catch (err) {
      setErroSolicitacao(err.message || 'Não foi possível enviar a solicitação.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <LayoutPagsInicio titulo={fornecedor ? fornecedor.nome_empresa : 'Detalhes do Fornecedor'}>
      <main className="detalhes-fornecedor-container">
        {carregando && <p className="detalhes-info-msg">Carregando...</p>}
        {erro && (
          <p role="alert" className="msg-feedback msg-erro">
            <strong>Erro:</strong> {erro}
          </p>
        )}

        {!carregando && fornecedor && (
          <div className="detalhes-fornecedor-card">
            <h1 className="fornecedor-nome-titulo">
              <span className="bullet-ponto">•</span> {fornecedor.nome_empresa}
            </h1>

            <div className="fornecedor-voltar-box">
              <Link to="/catalogo" className="btn-voltar-catalogo">
                Voltar ao catálogo
              </Link>
            </div>

            <div className="fornecedor-info-bloco">
              <p className="info-linha">
                <strong className="info-rotulo">Status:</strong>{' '}
                <span className={fornecedor.ativo ? 'status-ativo' : 'status-inativo'}>
                  {fornecedor.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </p>
              <p className="info-linha">
                <strong className="info-rotulo">Cidade:</strong> {fornecedor.cidade || 'Não informada'}
              </p>
              <p className="info-linha">
                <strong className="info-rotulo">Descrição:</strong> {fornecedor.descricao || 'Sem descrição.'}
              </p>
            </div>

            <section className="fornecedor-secao">
              <h2 className="fornecedor-secao-titulo">Contatos</h2>
              <ul className="fornecedor-bullets-lista">
                <li>
                  <strong>Telefone:</strong> {fornecedor.telefone_contato || 'Não informado'}
                </li>
                <li>
                  <strong>WhatsApp:</strong> {fornecedor.whatsapp || 'Não informado'}
                </li>
                <li>
                  <strong>E-mail:</strong> {fornecedor.email_contato || 'Não informado'}
                </li>
              </ul>
            </section>

            <section className="fornecedor-secao">
              <h2 className="fornecedor-secao-titulo">Serviços oferecidos</h2>
              {fornecedor.servicos?.length === 0 ? (
                <p className="fornecedor-aviso-vazio">Nenhum serviço cadastrado.</p>
              ) : (
                <ul className="fornecedor-bullets-lista">
                  {fornecedor.servicos.map((s) => (
                    <li key={s.id}>
                      <strong>{s.categoria_nome}</strong>
                      {s.preco_referencia ? ` (a partir de ${s.preco_referencia})` : ''}
                      {s.descricao ? ` - ${s.descricao}` : ''}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {usuario?.perfil === 'cliente' &&
              fornecedor.ativo &&
              fornecedor.servicos?.length > 0 &&
              festas.length > 0 && (
                <section className="fornecedor-secao secao-solicitar-contato">
                  <h2 className="fornecedor-secao-titulo">Solicitar contato para uma festa</h2>

                  <form onSubmit={aoSolicitar} className="form-solicitar-contato">
                    <div className="form-linha-pilula">
                      <label htmlFor="sol-festa">Festa:</label>
                      <select
                        id="sol-festa"
                        className="input-select-pilula"
                        value={festaId}
                        onChange={(e) => setFestaId(e.target.value)}
                      >
                        {festas.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.titulo} {f.data ? `(${f.data})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-linha-pilula">
                      <label htmlFor="sol-categoria">Serviço / Categoria:</label>
                      <select
                        id="sol-categoria"
                        className="input-select-pilula"
                        value={categoriaId}
                        onChange={(e) => setCategoriaId(e.target.value)}
                      >
                        {fornecedor.servicos.map((s) => (
                          <option key={s.id} value={s.categoria_id}>
                            {s.categoria_nome}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-linha-pilula form-linha-textarea">
                      <label htmlFor="sol-mensagem">Mensagem (opcional):</label>
                      <textarea
                        id="sol-mensagem"
                        className="textarea-pilula"
                        rows={2}
                        value={mensagem}
                        onChange={(e) => setMensagem(e.target.value)}
                      />
                    </div>

                    {erroSolicitacao && (
                      <p role="alert" className="msg-feedback msg-erro">
                        <strong>Erro:</strong> {erroSolicitacao}
                      </p>
                    )}

                    {sucessoSolicitacao && (
                      <p className="msg-feedback msg-sucesso">
                        {sucessoSolicitacao}{' '}
                        <Link to={`/festas/${festaId}`} className="link-stack">
                          Ver stack da festa
                        </Link>
                      </p>
                    )}

                    <div className="form-acoes-centro">
                      <button
                        type="submit"
                        className="btn-solicitar-magenta"
                        disabled={enviando}
                      >
                        {enviando ? 'Enviando...' : 'Solicitar contato'}
                      </button>
                    </div>
                  </form>
                </section>
              )}
          </div>
        )}
      </main>
    </LayoutPagsInicio>
  );
}
