import { useCallback, useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { Link } from '../router';
import { api } from '../services/api';
import { filtrarFornecedoresPorLocal } from '../utils/filtrarFornecedores';

export function Catalogo() {
  const [categorias, setCategorias] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [totalNaCategoria, setTotalNaCategoria] = useState(0);
  const [categoria, setCategoria] = useState('');
  const [cidade, setCidade] = useState('');
  const [cidadeAplicada, setCidadeAplicada] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const buscarCatalogo = useCallback(async (categoriaFiltro = '', cidadeFiltro = '') => {
    setCarregando(true);
    setErro('');
    try {
      const lista = await api.listarFornecedores({
        categoria: categoriaFiltro || undefined,
      });
      setTotalNaCategoria(lista.length);
      setCidadeAplicada(cidadeFiltro.trim());
      setFornecedores(filtrarFornecedoresPorLocal(lista, cidadeFiltro));
    } catch (err) {
      setErro(err.message || 'Erro ao carregar fornecedores.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    api
      .listarCategorias()
      .then(setCategorias)
      .catch(() => {});
    buscarCatalogo();
  }, [buscarCatalogo]);

  function aoFiltrar(event) {
    event.preventDefault();
    buscarCatalogo(categoria, cidade);
  }

  function aoLimpar() {
    setCategoria('');
    setCidade('');
    buscarCatalogo('', '');
  }

  return (
    <Layout titulo="Catálogo de Fornecedores">
      <form onSubmit={aoFiltrar}>
        <label htmlFor="filtro-categoria">Categoria: </label>
        <select
          id="filtro-categoria"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
        >
          <option value="">Todas</option>
          {categorias.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.nome}
            </option>
          ))}
        </select>{' '}
        <label htmlFor="filtro-cidade">Cidade / Local: </label>
        <input
          id="filtro-cidade"
          type="text"
          value={cidade}
          onChange={(e) => setCidade(e.target.value)}
          placeholder="Ex.: Pelotas"
        />{' '}
        <button type="submit">Filtrar</button>{' '}
        <button type="button" onClick={aoLimpar}>
          Limpar
        </button>
      </form>

      <hr />

      {erro && (
        <p role="alert">
          <strong>Erro:</strong> {erro}
        </p>
      )}
      {carregando && <p>Carregando fornecedores...</p>}

      {!carregando && !erro && fornecedores.length === 0 && (
        <div>
          <p>
            Nenhum fornecedor ativo encontrado
            {cidadeAplicada ? ` para "${cidadeAplicada}"` : ''} com os filtros
            informados.
          </p>
          {cidadeAplicada && totalNaCategoria > 0 && (
            <p>
              Existem {totalNaCategoria} fornecedor(es) ativo(s) em outras
              cidades.{' '}
              <button
                type="button"
                onClick={() => {
                  setCidade('');
                  buscarCatalogo(categoria, '');
                }}
              >
                Ver todas as cidades
              </button>
            </p>
          )}
        </div>
      )}

      {!carregando && fornecedores.length > 0 && (
        <ul>
          {fornecedores.map((f) => (
            <li key={f.id}>
              <h3>{f.nome_empresa}</h3>
              <p>
                <strong>Cidade:</strong> {f.cidade || 'Não informada'}
              </p>
              {f.descricao && <p>{f.descricao}</p>}
              <p>
                <strong>Serviços:</strong>
              </p>
              <ul>
                {(f.servicos || []).map((s) => (
                  <li key={s.id}>
                    {s.categoria_nome}
                    {s.preco_referencia ? ` — ${s.preco_referencia}` : ''}
                  </li>
                ))}
              </ul>
              <p>
                <Link to={`/fornecedores/${f.id}`}>Ver detalhes e contatos</Link>
              </p>
              <hr />
            </li>
          ))}
        </ul>
      )}
    </Layout>
  );
}
