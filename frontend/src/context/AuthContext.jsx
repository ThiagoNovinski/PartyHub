import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, obterToken, salvarToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(() => Boolean(obterToken()));

  const carregarSessao = useCallback(async () => {
    const token = obterToken();
    if (!token) {
      setUsuario(null);
      setCarregando(false);
      return;
    }

    setCarregando(true);
    try {
      const dados = await api.obterEu();
      setUsuario(dados);
    } catch {
      salvarToken(null);
      setUsuario(null);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarSessao();
  }, [carregarSessao]);

  const entrar = useCallback(async (credenciais) => {
    const resposta = await api.login(credenciais);
    salvarToken(resposta.token);
    setUsuario(resposta.usuario);
    return resposta.usuario;
  }, []);

  const registrar = useCallback(async (dados) => {
    const resposta = await api.registrar(dados);
    salvarToken(resposta.token);
    setUsuario(resposta.usuario);
    return resposta.usuario;
  }, []);

  const sair = useCallback(() => {
    salvarToken(null);
    setUsuario(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ usuario, carregando, entrar, registrar, sair, recarregarSessao: carregarSessao }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  }
  return ctx;
}
