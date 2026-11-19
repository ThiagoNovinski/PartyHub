import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { Link, useRouter } from '../router';
import { MENSAGEM_SENHA_INVALIDA, validarSenha } from '../utils/validarSenha';

export function Login() {
  const { usuario, entrar } = useAuth();
  const { navegar } = useRouter();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (usuario) {
      navegar(usuario.perfil === 'fornecedor' ? '/fornecedor/perfil' : '/festas', {
        substituir: true,
      });
    }
  }, [usuario, navegar]);

  async function aoEnviar(event) {
    event.preventDefault();
    setErro('');

    if (!validarSenha(senha)) {
      setErro(MENSAGEM_SENHA_INVALIDA);
      return;
    }

    setEnviando(true);
    try {
      const logado = await entrar({ email, senha });
      navegar(logado.perfil === 'fornecedor' ? '/fornecedor/perfil' : '/festas', {
        substituir: true,
      });
    } catch (err) {
      setErro(err.message || 'Erro ao fazer login.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Layout titulo="Entrar">
      <form onSubmit={aoEnviar}>
        <div>
          <label htmlFor="login-email">E-mail</label>
          <br />
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={120}
            required
          />
        </div>
        <br />
        <div>
          <label htmlFor="login-senha">Senha</label>
          <br />
          <input
            id="login-senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            minLength={6}
            required
          />
        </div>
        <br />
        {erro && (
          <p role="alert">
            <strong>Erro:</strong> {erro}
          </p>
        )}
        <button type="submit" disabled={enviando}>
          {enviando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      <p>
        Não tem conta? <Link to="/cadastro">Cadastre-se</Link>
      </p>
    </Layout>
  );
}
