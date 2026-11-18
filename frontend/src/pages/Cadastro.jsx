import cadastroTemplate from '../../templates/cadastro.html?raw';
import { AuthForm } from '../components/AuthForm';

export function Cadastro({ onNavegarLogin }) {
  return (
    <AuthForm
      templateHtml={cadastroTemplate}
      rodape={
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#667' }}>
          Já tem conta?{' '}
          <a
            href="/login"
            onClick={(e) => {
              e.preventDefault();
              onNavegarLogin();
            }}
            style={{ color: '#e33b60', fontWeight: 'bold' }}
          >
            Entrar
          </a>
        </p>
      }
    />
  );
}
