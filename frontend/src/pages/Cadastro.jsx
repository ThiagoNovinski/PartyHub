import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { Link, useRouter } from '../router';
import { MENSAGEM_SENHA_INVALIDA, validarSenha } from '../utils/validarSenha';

export function Cadastro() {
  const { usuario, registrar } = useAuth();
  const { navegar } = useRouter();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [perfil, setPerfil] = useState('cliente');
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
      const criado = await registrar({
        nome,
        email,
        telefone: telefone.trim() || null,
        senha,
        perfil,
      });
      navegar(criado.perfil === 'fornecedor' ? '/fornecedor/perfil' : '/festas', {
        substituir: true,
      });
    } catch (err) {
      setErro(err.message || 'Erro ao criar conta.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Layout titulo="Cadastro">
      <form onSubmit={aoEnviar}>
        <div>
          <label htmlFor="cad-nome">Nome</label>
          <br />
          <input
            id="cad-nome"
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            maxLength={120}
            required
          />
        </div>
        <br />
        <div>
          <label htmlFor="cad-email">E-mail</label>
          <br />
          <input
            id="cad-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={120}
            required
          />
        </div>
        <br />
        <div>
          <label htmlFor="cad-telefone">Telefone (opcional)</label>
          <br />
          <input
            id="cad-telefone"
            type="text"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            maxLength={30}
          />
        </div>
        <br />
        <div>
          <label htmlFor="cad-senha">Senha (mínimo 6 caracteres)</label>
          <br />
          <input
            id="cad-senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            minLength={6}
            required
          />
        </div>
        <br />
        <div>
          <label htmlFor="cad-perfil">Perfil</label>
          <br />
          <select
            id="cad-perfil"
            value={perfil}
            onChange={(e) => setPerfil(e.target.value)}
          >
            <option value="cliente">Cliente (organizo festas)</option>
            <option value="fornecedor">Fornecedor (ofereço serviços)</option>
          </select>
        </div>
        <br />
        {erro && (
          <p role="alert">
            <strong>Erro:</strong> {erro}
          </p>
        )}
        <button type="submit" disabled={enviando}>
          {enviando ? 'Cadastrando...' : 'Cadastre-se'}
        </button>
      </form>
      <p>
        Já tem conta? <Link to="/login">Entrar</Link>
      </p>
    </Layout>
  );
}
