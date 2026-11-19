import { useAuth } from '../context/AuthContext';
import { Link } from '../router';
import { Layout } from './Layout';

export function RotaProtegida({ perfilPermitido, children }) {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return (
      <Layout titulo="Carregando">
        <p>Verificando sessão...</p>
      </Layout>
    );
  }

  if (!usuario) {
    return (
      <Layout titulo="Acesso restrito">
        <p>Você precisa estar autenticado para acessar esta página.</p>
        <p>
          <Link to="/login">Ir para Login</Link> | <Link to="/cadastro">Criar conta</Link>
        </p>
      </Layout>
    );
  }

  if (perfilPermitido && usuario.perfil !== perfilPermitido) {
    return (
      <Layout titulo="Sem permissão">
        <p>
          Esta página é exclusiva para usuários do perfil <strong>{perfilPermitido}</strong>.
        </p>
        <p>
          <Link to="/catalogo">Voltar ao catálogo</Link>
        </p>
      </Layout>
    );
  }

  return children;
}
