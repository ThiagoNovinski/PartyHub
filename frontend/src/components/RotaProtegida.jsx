import { useAuth } from '../context/AuthContext';
import { Link } from '../router';
import { LayoutPagsInicio } from './LayoutPagsInicio';
import '../../static/css/RotaProtegida.css';

export function RotaProtegida({ perfilPermitido, children }) {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return (
      <LayoutPagsInicio titulo="Carregando">
        <main className="protegida-container">
          <p className="protegida-loading">Verificando sessão...</p>
        </main>
      </LayoutPagsInicio>
    );
  }

  if (!usuario) {
    return (
      <LayoutPagsInicio titulo="Acesso restrito">
        <main className="protegida-container">
          <h1 className="protegida-titulo">Acesso Restrito</h1>
          <p className="protegida-texto">
            Você precisa estar autenticado para acessar esta página.
          </p>
          <div className="protegida-links">
            <Link to="/login" className="protegida-link">
              Ir para Login
            </Link>
            <span className="protegida-separador">|</span>
            <Link to="/cadastro" className="protegida-link">
              Criar Conta
            </Link>
          </div>
        </main>
      </LayoutPagsInicio>
    );
  }

  if (perfilPermitido && usuario.perfil !== perfilPermitido) {
    return (
      <LayoutPagsInicio titulo="Sem permissão">
        <main className="protegida-container">
          <h1 className="protegida-titulo">Sem permissão</h1>
          <p className="protegida-texto">
            Esta página é exclusiva para usuários do perfil{' '}
            <strong>{perfilPermitido}</strong>.
          </p>
          <div className="protegida-links">
            <Link to="/catalogo" className="protegida-link">
              Voltar ao catálogo
            </Link>
          </div>
        </main>
      </LayoutPagsInicio>
    );
  }

  return children;
}
