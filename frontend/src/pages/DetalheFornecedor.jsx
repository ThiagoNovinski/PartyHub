import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { Link } from '../router';
import { api } from '../services/api';

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
    <Layout titulo={fornecedor ? fornecedor.nome_empresa : 'Detalhes do Fornecedor'}>
      <p>
        <Link to="/catalogo">Voltar ao catálogo</Link>
      </p>

      {carregando && <p>Carregando...</p>}
      {erro && (
        <p role="alert">
          <strong>Erro:</strong> {erro}
        </p>
      )}

      {!carregando && fornecedor && (
        <>
          <p>
            <strong>Status:</strong> {fornecedor.ativo ? 'Ativo' : 'Inativo'}
          </p>
          <p>
            <strong>Cidade:</strong> {fornecedor.cidade || 'Não informada'}
          </p>
          <p>
            <strong>Descrição:</strong> {fornecedor.descricao || 'Sem descrição.'}
          </p>

          <h3>Contatos</h3>
          <ul>
            <li>
              <strong>Telefone:</strong> {fornecedor.telefone_contato}
            </li>
            <li>
              <strong>WhatsApp:</strong> {fornecedor.whatsapp || 'Não informado'}
            </li>
            <li>
              <strong>E-mail:</strong> {fornecedor.email_contato || 'Não informado'}
            </li>
          </ul>

          <h3>Serviços oferecidos</h3>
          {fornecedor.servicos.length === 0 ? (
            <p>Nenhum serviço cadastrado.</p>
          ) : (
            <ul>
              {fornecedor.servicos.map((s) => (
                <li key={s.id}>
                  <strong>{s.categoria_nome}</strong>
                  {s.preco_referencia ? ` (${s.preco_referencia})` : ''}
                  {s.descricao ? ` — ${s.descricao}` : ''}
                </li>
              ))}
            </ul>
          )}

          {usuario?.perfil === 'cliente' &&
            fornecedor.ativo &&
            fornecedor.servicos.length > 0 && (
              <>
                <hr />
                <h3>Solicitar contato para uma festa</h3>
                {festas.length === 0 ? (
                  <p>
                    Você não possui festas em planejamento.{' '}
                    <Link to="/festas">Cadastrar festa</Link>
                  </p>
                ) : (
                  <form onSubmit={aoSolicitar}>
                    <div>
                      <label htmlFor="sol-festa">Festa: </label>
                      <select
                        id="sol-festa"
                        value={festaId}
                        onChange={(e) => setFestaId(e.target.value)}
                      >
                        {festas.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.titulo} ({f.data})
                          </option>
                        ))}
                      </select>
                    </div>
                    <br />
                    <div>
                      <label htmlFor="sol-categoria">Serviço / Categoria: </label>
                      <select
                        id="sol-categoria"
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
                    <br />
                    <div>
                      <label htmlFor="sol-mensagem">Mensagem (opcional):</label>
                      <br />
                      <textarea
                        id="sol-mensagem"
                        rows={3}
                        cols={40}
                        value={mensagem}
                        onChange={(e) => setMensagem(e.target.value)}
                      />
                    </div>
                    <br />
                    {erroSolicitacao && (
                      <p role="alert">
                        <strong>Erro:</strong> {erroSolicitacao}
                      </p>
                    )}
                    {sucessoSolicitacao && (
                      <p>
                        {sucessoSolicitacao}{' '}
                        <Link to={`/festas/${festaId}`}>Ver stack da festa</Link>
                      </p>
                    )}
                    <button type="submit" disabled={enviando}>
                      {enviando ? 'Enviando...' : 'Solicitar contato'}
                    </button>
                  </form>
                )}
              </>
            )}
        </>
      )}
    </Layout>
  );
}
