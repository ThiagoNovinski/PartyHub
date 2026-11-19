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
    <Layout titulo="Página não encontrada">
      <p>A rota "{caminho}" não existe.</p>
      <p>
        <Link to="/catalogo">Ir para o catálogo</Link>
      </p>
    </Layout>
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
