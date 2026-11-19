import { useCallback, useEffect, useState } from 'react';
import { InputHora24h } from '../components/InputHora24h';
import { Layout } from '../components/Layout';
import { Link } from '../router';
import { api } from '../services/api';

const ESTADO_INICIAL_FORM = {
  titulo: '',
  data: '',
  hora_inicio: '14:00',
  hora_fim: '19:00',
  local: '',
  qtd_convidados: '',
  tema: '',
  observacoes: '',
};

export function MinhasFestas() {
  const [festas, setFestas] = useState([]);
  const [form, setForm] = useState(ESTADO_INICIAL_FORM);
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState('');
  const [erroForm, setErroForm] = useState('');
  const [enviando, setEnviando] = useState(false);

  const carregarFestas = useCallback(async () => {
    setCarregando(true);
    setErroLista('');
    try {
      const lista = await api.listarMinhasFestas();
      setFestas(lista);
    } catch (err) {
      setErroLista(err.message || 'Erro ao carregar festas.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarFestas();
  }, [carregarFestas]);

  function atualizarCampo(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function aoCriarFesta(event) {
    event.preventDefault();
    setErroForm('');
    setEnviando(true);

    try {
      await api.criarFesta({
        titulo: form.titulo,
        data: form.data,
        hora_inicio: form.hora_inicio,
        hora_fim: form.hora_fim,
        local: form.local.trim() || null,
        qtd_convidados: form.qtd_convidados ? Number(form.qtd_convidados) : null,
        tema: form.tema.trim() || null,
        observacoes: form.observacoes.trim() || null,
      });
      setForm(ESTADO_INICIAL_FORM);
      await carregarFestas();
    } catch (err) {
      setErroForm(err.message || 'Erro ao cadastrar festa.');
    } finally {
      setEnviando(false);
    }
  }

  async function aoCancelarFesta(festa) {
    if (
      !window.confirm(
        `Cancelar a festa "${festa.titulo}"? As solicitações pendentes também serão canceladas.`,
      )
    ) {
      return;
    }

    setErroLista('');
    try {
      await api.cancelarFesta(festa.id);
      await carregarFestas();
    } catch (err) {
      setErroLista(err.message || 'Erro ao cancelar festa.');
    }
  }

  return (
    <Layout titulo="Minhas Festas">
      <section>
        <h3>Cadastrar nova festa</h3>
        <form onSubmit={aoCriarFesta}>
          <div>
            <label htmlFor="festa-titulo">Título *</label>
            <br />
            <input
              id="festa-titulo"
              type="text"
              value={form.titulo}
              onChange={(e) => atualizarCampo('titulo', e.target.value)}
              maxLength={120}
              required
            />
          </div>
          <br />
          <div>
            <label htmlFor="festa-data">Data *</label>
            <br />
            <input
              id="festa-data"
              type="date"
              value={form.data}
              onChange={(e) => atualizarCampo('data', e.target.value)}
              required
            />
          </div>
          <br />
          <div>
            <label htmlFor="festa-hora-inicio">Hora de início (24h) *</label>
            <br />
            <InputHora24h
              id="festa-hora-inicio"
              value={form.hora_inicio}
              onChange={(valor) => atualizarCampo('hora_inicio', valor)}
              required
            />
          </div>
          <br />
          <div>
            <label htmlFor="festa-hora-fim">Hora de término (24h) *</label>
            <br />
            <InputHora24h
              id="festa-hora-fim"
              value={form.hora_fim}
              onChange={(valor) => atualizarCampo('hora_fim', valor)}
              required
            />
          </div>
          <br />
          <div>
            <label htmlFor="festa-local">Local</label>
            <br />
            <input
              id="festa-local"
              type="text"
              value={form.local}
              onChange={(e) => atualizarCampo('local', e.target.value)}
              maxLength={200}
            />
          </div>
          <br />
          <div>
            <label htmlFor="festa-convidados">Quantidade de convidados</label>
            <br />
            <input
              id="festa-convidados"
              type="number"
              min={1}
              value={form.qtd_convidados}
              onChange={(e) => atualizarCampo('qtd_convidados', e.target.value)}
            />
          </div>
          <br />
          <div>
            <label htmlFor="festa-tema">Tema</label>
            <br />
            <input
              id="festa-tema"
              type="text"
              value={form.tema}
              onChange={(e) => atualizarCampo('tema', e.target.value)}
              maxLength={80}
            />
          </div>
          <br />
          <div>
            <label htmlFor="festa-obs">Observações</label>
            <br />
            <textarea
              id="festa-obs"
              rows={3}
              cols={40}
              value={form.observacoes}
              onChange={(e) => atualizarCampo('observacoes', e.target.value)}
            />
          </div>
          <br />
          {erroForm && (
            <p role="alert">
              <strong>Erro:</strong> {erroForm}
            </p>
          )}
          <button type="submit" disabled={enviando}>
            {enviando ? 'Salvando...' : 'Criar festa'}
          </button>
        </form>
      </section>

      <hr />

      <section>
        <h3>Festas cadastradas</h3>
        {erroLista && (
          <p role="alert">
            <strong>Erro:</strong> {erroLista}
          </p>
        )}
        {carregando && <p>Carregando festas...</p>}
        {!carregando && festas.length === 0 && (
          <p>Você ainda não cadastrou nenhuma festa.</p>
        )}
        {!carregando && festas.length > 0 && (
          <ul>
            {festas.map((f) => (
              <li key={f.id}>
                <h4>
                  {f.titulo} — [{f.status}]
                </h4>
                <p>
                  <strong>Data:</strong> {f.data} | <strong>Horário:</strong>{' '}
                  {String(f.hora_inicio || '').slice(0, 5)} às{' '}
                  {String(f.hora_fim || '').slice(0, 5)}
                </p>
                {f.local && (
                  <p>
                    <strong>Local:</strong> {f.local}
                  </p>
                )}
                {f.qtd_convidados && (
                  <p>
                    <strong>Convidados:</strong> {f.qtd_convidados}
                  </p>
                )}
                {f.tema && (
                  <p>
                    <strong>Tema:</strong> {f.tema}
                  </p>
                )}
                <p>
                  <Link to={`/festas/${f.id}`}>Abrir stack da festa e solicitações</Link>
                  {f.status !== 'CANCELADA' && (
                    <>
                      {' | '}
                      <button type="button" onClick={() => aoCancelarFesta(f)}>
                        Cancelar festa
                      </button>
                    </>
                  )}
                </p>
                <hr />
              </li>
            ))}
          </ul>
        )}
      </section>
    </Layout>
  );
}
