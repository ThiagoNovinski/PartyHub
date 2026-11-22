import { useCallback, useEffect, useState } from 'react';
import { LayoutPagsInicio } from '../components/LayoutPagsInicio';
import { Link } from '../router';
import { api } from '../services/api';
import { filtrarFornecedoresPorLocal } from '../utils/filtrarFornecedores';
import '../../static/css/Catalogo.css';

export function Catalogo() {
  const [categorias, setCategorias] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [categoria, setCategoria] = useState('');
  const [cidade, setCidade] = useState('');
  const [buscaRealizada, setBuscaRealizada] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    api
      .listarCategorias()
      .then(setCategorias)
      .catch(() => {});
  }, []);

  const buscarCatalogo = useCallback(async (categoriaFiltro = '', cidadeFiltro = '') => {
    setCarregando(true);
    setErro('');
    setBuscaRealizada(true);

    try {
      const lista = await api.listarFornecedores({
        categoria: categoriaFiltro || undefined,
      });

      const fornecedoresAtivos = lista.filter((f) => f.ativo !== false);

      const resultadoFinal = filtrarFornecedoresPorLocal(fornecedoresAtivos, cidadeFiltro);
      setFornecedores(resultadoFinal);
    } catch (err) {
      setErro(err.message || 'Erro ao carregar fornecedores.');
    } finally {
      setCarregando(false);
    }
  }, []);

  function aoFiltrar(event) {
    event.preventDefault();
    buscarCatalogo(categoria, cidade);
  }

  function aoLimpar() {
    setCategoria('');
    setCidade('');
    setFornecedores([]);
    setBuscaRealizada(false);
    setErro('');
  }

  return (
    <LayoutPagsInicio titulo="Catálogo de Fornecedores">
      <main className="catalogo-main-container">
        <h1 className="catalogo-title">Catálogo de Fornecedores</h1>

        <form className="catalogo-filter-form" onSubmit={aoFiltrar}>
          <div className="filter-item">
            <label htmlFor="filtro-categoria">Categoria:</label>
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
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="filtro-cidade">Cidade/Local:</label>
            <input
              id="filtro-cidade"
              type="text"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-filtrar">
            Filtrar
          </button>
          <button type="button" className="btn-limpar" onClick={aoLimpar}>
            Limpar
          </button>
        </form>

        <hr className="catalogo-divider" />

        {carregando && (
          <p className="catalogo-msg-info">Pesquisando fornecedores...</p>
        )}

        {erro && (
          <p className="catalogo-msg-erro" role="alert">
            {erro}
          </p>
        )}

        {buscaRealizada && !carregando && !erro && fornecedores.length === 0 && (
          <p className="catalogo-msg-vazio">
            Nenhum fornecedor ativo encontrado para os filtros selecionados.
          </p>
        )}

        {buscaRealizada && !carregando && fornecedores.length > 0 && (
          <div className="catalogo-lista-fornecedores">
            {fornecedores.map((fornecedor) => (
              <div key={fornecedor.id}>
                <article className="supplier-item">
                  <h3>• {fornecedor.nome_empresa}</h3>
                  <p className="supplier-city">
                    <strong>Cidade:</strong> {fornecedor.cidade || 'Não informada'}
                  </p>
                  
                  {fornecedor.descricao && (
                    <p className="supplier-desc">{fornecedor.descricao}</p>
                  )}

                  {fornecedor.servicos && fornecedor.servicos.length > 0 && (
                    <>
                      <p className="supplier-services-title">Serviços:</p>
                      <ul className="supplier-services-list">
                        {fornecedor.servicos.map((servico) => (
                          <li key={servico.id}>
                            • {servico.categoria_nome || servico.nome}
                            {servico.preco_referencia ? ` - a partir de ${servico.preco_referencia}` : ''}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  <p className="supplier-link">
                    <Link to={`/fornecedores/${fornecedor.id}`}>
                      Ver detalhes e contatos
                    </Link>
                  </p>
                </article>
                <hr className="supplier-separator" />
              </div>
            ))}
          </div>
        )}
      </main>
    </LayoutPagsInicio>
  );
}
