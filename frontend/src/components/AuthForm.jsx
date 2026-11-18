import { useEffect, useMemo, useRef } from 'react';
import '../../static/css/style.css';
import presenteImg from '../../static/imagens/presente.png';
import { MENSAGEM_SENHA_INVALIDA, validarSenha } from '../utils/validarSenha';

/**
 * Extrai o título e o conteúdo de <main class="container"> de um template HTML,
 * substituindo o helper Jinja de imagem pelo asset resolvido pelo Vite.
 */
function prepararTemplate(templateHtml) {
  const matchTitulo = templateHtml.match(/<title>([\s\S]*?)<\/title>/i);
  const matchMain = templateHtml.match(/<main[^>]*>([\s\S]*?)<\/main>/i);

  const titulo = matchTitulo ? matchTitulo[1].trim() : 'PartyHub';
  const corpoHtml = (matchMain ? matchMain[1] : templateHtml).replaceAll(
    "{{ url_for('static', filename='imagens/presente.png') }}",
    presenteImg
  );

  return { titulo, corpoHtml };
}

export function AuthForm({ templateHtml, onSubmit, rodape }) {
  const containerRef = useRef(null);
  const { titulo, corpoHtml } = useMemo(
    () => prepararTemplate(templateHtml),
    [templateHtml]
  );

  useEffect(() => {
    document.title = titulo;
  }, [titulo]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const formulario = container.querySelector('#formulario-cadastro');
    const campoSenha = container.querySelector('#senha');
    const campoUsuario = container.querySelector('#nomeusuario');
    if (!formulario || !campoSenha) return;

    function handleSubmit(event) {
      event.preventDefault();
      const senha = campoSenha.value;

      if (!validarSenha(senha)) {
        alert(MENSAGEM_SENHA_INVALIDA);
        return;
      }

      if (onSubmit) {
        onSubmit({
          nomeUsuario: campoUsuario ? campoUsuario.value : '',
          senha,
        });
      }
    }

    formulario.addEventListener('submit', handleSubmit);
    return () => formulario.removeEventListener('submit', handleSubmit);
  }, [corpoHtml, onSubmit]);

  return (
    <main className="container">
      <div ref={containerRef} dangerouslySetInnerHTML={{ __html: corpoHtml }} />
      {rodape}
    </main>
  );
}
