import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const RouterContext = createContext(null);

function normalizarCaminho(pathname) {
  if (!pathname || pathname === '/') return '/';
  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

export function RouterProvider({ children }) {
  const [caminho, setCaminho] = useState(() =>
    normalizarCaminho(window.location.pathname),
  );

  useEffect(() => {
    function aoMudarHistorico() {
      setCaminho(normalizarCaminho(window.location.pathname));
    }
    window.addEventListener('popstate', aoMudarHistorico);
    return () => window.removeEventListener('popstate', aoMudarHistorico);
  }, []);

  const navegar = useCallback((destino, { substituir = false } = {}) => {
    const normalizado = normalizarCaminho(destino);
    if (normalizado !== normalizarCaminho(window.location.pathname)) {
      if (substituir) {
        window.history.replaceState({}, '', normalizado);
      } else {
        window.history.pushState({}, '', normalizado);
      }
      setCaminho(normalizado);
    }
    window.scrollTo(0, 0);
  }, []);

  return (
    <RouterContext.Provider value={{ caminho, navegar }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) {
    throw new Error('useRouter deve ser usado dentro de RouterProvider.');
  }
  return ctx;
}

export function Link({ to, children, ...props }) {
  const { navegar } = useRouter();
  return (
    <a
      href={to}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
          return;
        }
        e.preventDefault();
        navegar(to);
      }}
      {...props}
    >
      {children}
    </a>
  );
}

/**
 * Casa um padrão simples de rota (ex.: "/festas/:id") com o caminho atual.
 */
export function combinarRota(padrao, caminho) {
  const partesPadrao = normalizarCaminho(padrao).split('/').filter(Boolean);
  const partesCaminho = normalizarCaminho(caminho).split('/').filter(Boolean);
  if (partesPadrao.length !== partesCaminho.length) return null;

  const params = {};
  for (let i = 0; i < partesPadrao.length; i += 1) {
    const segPadrao = partesPadrao[i];
    const segCaminho = partesCaminho[i];
    if (segPadrao.startsWith(':')) {
      params[segPadrao.slice(1)] = decodeURIComponent(segCaminho);
    } else if (segPadrao !== segCaminho) {
      return null;
    }
  }
  return params;
}
