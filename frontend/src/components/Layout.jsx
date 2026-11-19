import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useRouter } from '../router';

export function Layout({ titulo = 'PartyHub', children }) {
  const { usuario, sair } = useAuth();
  const { navegar } = useRouter();

  useEffect(() => {
    document.title = `${titulo} - PartyHub`;
  }, [titulo]);

  function aoSair() {
    sair();
    navegar('/login');
  }

  return (
    <div>
      <header>
        <h1>
          <Link to="/catalogo">PartyHub</Link>
        </h1>
        <nav>
          <Link to="/catalogo">Catálogo</Link>
          {' | '}
          {!usuario && (
            <>
              <Link to="/login">Entrar</Link>
              {' | '}
              <Link to="/cadastro">Cadastro</Link>
            </>
          )}
          {usuario?.perfil === 'cliente' && (
            <>
              <Link to="/festas">Minhas Festas</Link>
              {' | '}
            </>
          )}
          {usuario?.perfil === 'fornecedor' && (
            <>
              <Link to="/fornecedor/perfil">Meu Perfil e Serviços</Link>
              {' | '}
              <Link to="/fornecedor/pedidos">Pedidos Recebidos</Link>
              {' | '}
            </>
          )}
          {usuario && (
            <>
              <span>
                {usuario.nome} ({usuario.perfil})
              </span>{' '}
              <button type="button" onClick={aoSair}>
                Sair
              </button>
            </>
          )}
        </nav>
        <hr />
      </header>
      <main>
        <h2>{titulo}</h2>
        {children}
      </main>
    </div>
  );
}
