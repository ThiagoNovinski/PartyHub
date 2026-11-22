import { Layout } from './components/Layout';
import { RotaProtegida } from './components/RotaProtegida';
import { AuthProvider } from './context/AuthContext';
import { Cadastro } from './pages/Cadastro';
import { Catalogo } from './pages/Catalogo';
import { DetalheFornecedor } from './pages/DetalheFornecedor';
import { Login } from './pages/Login';
import { MinhasFestas } from './pages/MinhasFestas';
import { Pedidos } from './pages/Pedidos';
import { PerfilFornecedor } from './pages/PerfilFornecedor';
import { StackDaFesta } from './pages/StackDaFesta';
import { combinarRota, Link, RouterProvider, useRouter } from './router';
import { LayoutPagsInicio } from './components/LayoutPagsInicio';
import '../static/css/PaginaNaoEncontrada.css';

function ConteudoRotas() {
  const { caminho } = useRouter();

  if (caminho === '/' || caminho === '/catalogo') {
    return <Catalogo />;
  }
  if (caminho === '/login') {
    return <Login />;
  }
  if (caminho === '/cadastro') {
    return <Cadastro />;
  }

  const paramsFornecedor = combinarRota('/fornecedores/:id', caminho);
  if (paramsFornecedor) {
    return <DetalheFornecedor id={paramsFornecedor.id} />;
  }

  if (caminho === '/festas') {
    return (
      <RotaProtegida perfilPermitido="cliente">
        <MinhasFestas />
      </RotaProtegida>
    );
  }

  const paramsFesta = combinarRota('/festas/:id', caminho);
  if (paramsFesta) {
    return (
      <RotaProtegida perfilPermitido="cliente">
        <StackDaFesta id={paramsFesta.id} />
      </RotaProtegida>
    );
  }

  if (caminho === '/fornecedor/perfil') {
    return (
      <RotaProtegida perfilPermitido="fornecedor">
        <PerfilFornecedor />
      </RotaProtegida>
    );
  }

  if (caminho === '/fornecedor/pedidos') {
    return (
      <RotaProtegida perfilPermitido="fornecedor">
        <Pedidos />
      </RotaProtegida>
    );
  }

  return (
    <LayoutPagsInicio>
      <div className="nao-encontrada-container">

        <h2 className="nao-encontrada-titulo">
          Página não encontrada
        </h2>

        <p className="nao-encontrada-texto">
          A rota <span className="nao-encontrada-rota">"{caminho}"</span> não existe.
        </p>

        <div className="nao-encontrada-acoes">
          <Link to="/catalogo" className="nao-encontrada-link">
            Voltar para o catálogo
          </Link>
        </div>

      </div>
    </LayoutPagsInicio>
  );
}

export function App() {
  return (
    <AuthProvider>
      <RouterProvider>
        <ConteudoRotas />
      </RouterProvider>
    </AuthProvider>
  );
}

export default App;
