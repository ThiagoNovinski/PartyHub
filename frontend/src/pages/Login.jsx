import loginTemplate from '../../templates/login.html?raw';
import { AuthForm } from '../components/AuthForm';

export function Login({ onNavegarCadastro }) {
  return (
    <AuthForm
      templateHtml={loginTemplate}
      rodape={
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#667' }}>
          Não tem conta?{' '}
          <a
            href="/cadastro"
            onClick={(e) => {
              e.preventDefault();
              onNavegarCadastro();
            }}
            style={{ color: '#e33b60', fontWeight: 'bold' }}
          >
            Cadastre-se
          </a>
        </p>
      }
    />
  );
}
