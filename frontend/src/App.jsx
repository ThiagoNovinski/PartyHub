import { useEffect, useState } from 'react';
import { Login } from './pages/Login';
import { Cadastro } from './pages/Cadastro';

function obterRotaInicial() {
  return window.location.pathname === '/cadastro' ? '/cadastro' : '/login';
}

export function App() {
  const [rota, setRota] = useState(obterRotaInicial);

  useEffect(() => {
    function aoMudarHistorico() {
      setRota(obterRotaInicial());
    }
    window.addEventListener('popstate', aoMudarHistorico);
    return () => window.removeEventListener('popstate', aoMudarHistorico);
  }, []);

  function navegar(novaRota) {
    if (window.location.pathname !== novaRota) {
      window.history.pushState({}, '', novaRota);
    }
    setRota(novaRota);
  }

  if (rota === '/cadastro') {
    return <Cadastro onNavegarLogin={() => navegar('/login')} />;
  }

  return <Login onNavegarCadastro={() => navegar('/cadastro')} />;
}

export default App;
