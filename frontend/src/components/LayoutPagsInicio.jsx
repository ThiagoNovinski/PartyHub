// layout reutilizável para as páginas principais: catálogo, perfil fornecedor, minhas festas, stack da festa,
// acesso restrito, página não encontrada, meus pedidos

import { Link } from '../router';
import { useAuth } from '../context/AuthContext';
import '../../static/css/Catalogo.css';

export function LayoutPagsInicio({ titulo, children }) {
  const { usuario, sair } = useAuth();

  return (
    <div className="partyhub-home-wrapper">
      <header className="partyhub-header-dark">
        <div className="header-left">
          <Link to="/" className="brand-logo-white">
            PartyHub
          </Link>

          <img
            src="../../static/imagens/presente.png"
            alt="Presente"
            className="brand-gift-icon"
          />
        </div>

        <nav className="header-nav-dark">
          <Link
            to="/catalogo"
            className={`nav-link-white ${titulo === 'Catálogo de Fornecedores' ? 'active' : ''}`}
          >
            Catálogo
          </Link>

          {usuario && usuario.perfil === 'cliente' && (
            <Link
              to="/festas"
              className={`nav-link-white ${titulo === 'Minhas Festas' ? 'active' : ''}`}
            >
              Minhas Festas
            </Link>
          )}

          {usuario && usuario.perfil === 'fornecedor' && (
            <>
              <Link
                to="/fornecedor/perfil"
                className={`nav-link-white ${titulo === 'Meu perfil e Serviços' ? 'active' : ''}`}
              >
                Meu Perfil
              </Link>

              <Link
                to="/fornecedor/pedidos"
                className={`nav-link-white ${titulo === 'Pedidos Recebidos' ? 'active' : ''}`}
              >
                Meus Pedidos
              </Link>
            </>
          )}

          {!usuario ? (
            <>
              <Link to="/login" className="nav-link-white">
                Entrar
              </Link>

              <Link to="/cadastro" className="nav-link-white">
                Cadastro
              </Link>
            </>
          ) : (
            <button
              type="button"
              className="btn-sair-header"
              onClick={sair}
            >
              Sair
            </button>
          )}
        </nav>
      </header>

      <div className="page-content-white">
        {children}
      </div>

      <footer className="partyhub-footer">
        PartyHub
      </footer>
    </div>
  );
}
