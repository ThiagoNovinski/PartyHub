import { useCallback, useEffect, useState } from 'react';
import { InputHora24h } from '../components/InputHora24h';
import { LayoutPagsInicio } from '../components/LayoutPagsInicio';
import { Link } from '../router';
import { api } from '../services/api';
import '../../static/css/MinhasFestas.css';

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

  // Carrega apenas as festas que NÃO estão canceladas
  const carregarFestas = useCallback(async () => {
    setCarregando(true);
    setErroLista('');
    try {
      const lista = await api.listarMinhasFestas();
      const festasAtivas = (lista || []).filter(
        (f) => f.status !== 'CANCELADA' && f.ativo !== false
      );
      setFestas(festasAtivas);
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
      setFestas((prevFestas) => prevFestas.filter((f) => f.id !== festa.id));
    } catch (err) {
      setErroLista(err.message || 'Erro ao cancelar festa.');
    }
  }

  const festasVisiveis = festas.filter((f) => f.status !== 'CANCELADA');

  return (
    <LayoutPagsInicio titulo="Minhas Festas">
      <main className="minhas-festas-container">
        <h1 className="festas-page-title">Minhas Festas</h1>

        <section className="festa-form-section">
          <h2 className="festa-section-subtitle">Cadastrar nova festa</h2>

          <form onSubmit={aoCriarFesta} className="festa-form">
            <div className="form-row">
              <label htmlFor="festa-titulo">Título *</label>
              <input
                id="festa-titulo"
                type="text"
                value={form.titulo}
                onChange={(e) => atualizarCampo('titulo', e.target.value)}
                maxLength={120}
                required
              />
            </div>

            <div className="form-row">
              <label htmlFor="festa-data">Data *</label>
              <input
                id="festa-data"
                type="date"
                value={form.data}
                onChange={(e) => atualizarCampo('data', e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <label htmlFor="festa-hora-inicio">Hora de início (24h) *</label>
              <InputHora24h
                id="festa-hora-inicio"
                value={form.hora_inicio}
                onChange={(valor) => atualizarCampo('hora_inicio', valor)}
                required
              />
            </div>

            <div className="form-row">
              <label htmlFor="festa-hora-fim">Hora de término (24h) *</label>
              <InputHora24h
                id="festa-hora-fim"
                value={form.hora_fim}
                onChange={(valor) => atualizarCampo('hora_fim', valor)}
                required
              />
            </div>

            <div className="form-row">
              <label htmlFor="festa-local">Local</label>
              <input
                id="festa-local"
                type="text"
                value={form.local}
                onChange={(e) => atualizarCampo('local', e.target.value)}
                maxLength={200}
              />
            </div>

            <div className="form-row">
              <label htmlFor="festa-convidados">Quantidade de convidados</label>
              <input
                id="festa-convidados"
                type="number"
                min={1}
                value={form.qtd_convidados}
                onChange={(e) => atualizarCampo('qtd_convidados', e.target.value)}
              />
            </div>

            <div className="form-row">
              <label htmlFor="festa-tema">Tema</label>
              <input
                id="festa-tema"
                type="text"
                value={form.tema}
                onChange={(e) => atualizarCampo('tema', e.target.value)}
                maxLength={80}
              />
            </div>

            <div className="form-row form-row-textarea">
              <label htmlFor="festa-obs">Observações</label>
              <textarea
                id="festa-obs"
                rows={3}
                value={form.observacoes}
                onChange={(e) => atualizarCampo('observacoes', e.target.value)}
              />
            </div>

            {erroForm && (
              <p role="alert" className="form-error-msg">
                <strong>Erro:</strong> {erroForm}
              </p>
            )}

            <div className="form-actions">
              <button type="submit" className="btn-cadastrar-festa" disabled={enviando}>
                {enviando ? 'Salvando...' : 'Cadastrar festa'}
              </button>
            </div>
          </form>
        </section>

        {erroLista && (
          <p role="alert" className="form-error-msg">
            <strong>Erro:</strong> {erroLista}
          </p>
        )}

        {!carregando && festasVisiveis.length > 0 && (
          <>
            <hr className="festas-divider" />

            <section className="festas-cadastradas-section">
              <h2 className="festas-cadastradas-title">Festas cadastradas</h2>

              <ul className="festas-cadastradas-list">
                {festasVisiveis.map((f) => (
                  <li key={f.id} className="festa-cadastrada-item">
                    <h3 className="festa-item-name">• {f.titulo}</h3>

                    <p className="festa-item-detail">
                      <strong>Data:</strong> {f.data}
                      {f.hora_inicio && (
                        <span>
                          {' '}| <strong>Horário:</strong>{' '}
                          {String(f.hora_inicio || '').slice(0, 5)} às{' '}
                          {String(f.hora_fim || '').slice(0, 5)}
                        </span>
                      )}
                    </p>

                    <p className="festa-item-detail">
                      <strong>Local:</strong> {f.local || 'Não informado'}
                    </p>

                    <p className="festa-item-detail">
                      <strong>Convidados:</strong> {f.qtd_convidados || 'Não informado'}
                    </p>

                    <p className="festa-item-detail">
                      <strong>Tema:</strong> {f.tema || 'Não informado'}
                    </p>

                    {f.observacoes && (
                      <p className="festa-item-detail">
                        <strong>Observações:</strong> {f.observacoes}
                      </p>
                    )}

                    <div className="festa-item-actions">
                      <Link to={`/festas/${f.id}`} className="festa-link-stack">
                        Abrir stack da festa e solicitações
                      </Link>
                      <span className="action-separator">|</span>
                      <button
                        type="button"
                        className="btn-cancelar-festa"
                        onClick={() => aoCancelarFesta(f)}
                      >
                        Cancelar festa
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </main>
    </LayoutPagsInicio>
  );
}
