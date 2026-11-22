import { useCallback, useEffect, useState } from 'react';
import { LayoutPagsInicio } from '../components/LayoutPagsInicio';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import '../../static/css/Pedidos.css';

export function Pedidos() {
  const { usuario } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [respostasPorId, setRespostasPorId] = useState({});
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const [nomeFornecedor, setNomeFornecedor] = useState(usuario?.nome || 'Fornecedor');

  useEffect(() => {
    async function carregarInfoFornecedor() {
      if (!usuario) return;
      try {
        const catalogo = await api.listarFornecedores();
        const meuPerfil = catalogo.find((f) => f.usuario_id === usuario.id);
        if (meuPerfil?.nome_empresa) {
          setNomeFornecedor(meuPerfil.nome_empresa);
        }
      } catch {
      }
    }
    carregarInfoFornecedor();
  }, [usuario]);

  const carregarPedidos = useCallback(async (statusSelecionado = filtroStatus) => {
    setCarregando(true);
    setErro('');
    try {
      const lista = await api.listarSolicitacoesRecebidas(statusSelecionado);
      setPedidos(lista);
    } catch (err) {
      setErro(err.message || 'Erro ao carregar pedidos recebidos.');
    } finally {
      setCarregando(false);
    }
  }, [filtroStatus]);

  useEffect(() => {
    carregarPedidos(filtroStatus);
  }, [filtroStatus, carregarPedidos]);

  async function aoResponder(solicitacaoId, novoStatus) {
    setErro('');
    setSucesso('');
    const resposta = (respostasPorId[solicitacaoId] || '').trim() || null;

    try {
      await api.responderSolicitacao(solicitacaoId, {
        status: novoStatus,
        resposta,
      });
      setRespostasPorId((prev) => ({ ...prev, [solicitacaoId]: '' }));
      setSucesso(
        novoStatus === 'ACEITA' ? 'Solicitação aceita!' : 'Solicitação recusada.',
      );
      await carregarPedidos(filtroStatus);
    } catch (err) {
      setErro(err.message || 'Erro ao responder solicitação.');
    }
  }

  return (
    <LayoutPagsInicio titulo="Pedidos Recebidos" nomeFornecedor={nomeFornecedor}>
      <main className="pedidos-container">
        <h1 className="pedidos-page-title">Pedidos Recebidos</h1>

        <div className="pedidos-filtro-box">
          <label htmlFor="pedidos-status" className="pedidos-filtro-label">
            Filtrar por status:
          </label>
          <select
            id="pedidos-status"
            className="pedidos-status-select"
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="PENDENTE">PENDENTE</option>
            <option value="ACEITA">ACEITA</option>
            <option value="RECUSADA">RECUSADA</option>
            <option value="CANCELADA">CANCELADA</option>
          </select>
        </div>

        {erro && (
          <p role="alert" className="msg-feedback msg-erro">
            <strong>Erro:</strong> {erro}
          </p>
        )}
        {sucesso && <p className="msg-feedback msg-sucesso">{sucesso}</p>}
        {carregando && <p className="pedidos-info-msg">Carregando pedidos...</p>}

        {!carregando && pedidos.length === 0 && (
          <p className="pedidos-info-msg">Nenhum pedido encontrado.</p>
        )}

        {!carregando && pedidos.length > 0 && (
          <ul className="pedidos-lista">
            {pedidos.map((p) => (
              <li key={p.id} className="pedido-card">
                <div className="pedido-header-row">
                  <h3 className="pedido-titulo">
                    {p.festa_titulo} — {p.categoria_nome}
                  </h3>
                  <span className={`pedido-badge badge-${p.status.toLowerCase()}`}>
                    {p.status}
                  </span>
                </div>

                <div className="pedido-detalhes-grid">
                  <p className="pedido-linha">
                    <strong>Data da festa:</strong> {p.festa_data} |{' '}
                    <strong>Horário:</strong> {String(p.hora_inicio || '').slice(0, 5)} às{' '}
                    {String(p.hora_fim || '').slice(0, 5)}
                  </p>
                  <p className="pedido-linha">
                    <strong>Local:</strong> {p.local || 'Não informado'} |{' '}
                    <strong>Convidados:</strong> {p.qtd_convidados ?? 'Não informado'} |{' '}
                    <strong>Tema:</strong> {p.tema || 'Não informado'}
                  </p>
                  <p className="pedido-linha">
                    <strong>Cliente:</strong> {p.cliente_nome} |{' '}
                    <strong>Telefone:</strong> {p.cliente_telefone || 'Não informado'} |{' '}
                    <strong>E-mail:</strong> {p.cliente_email}
                  </p>
                </div>

                {p.mensagem && (
                  <div className="pedido-caixa-mensagem">
                    <strong>Mensagem do cliente:</strong> &quot;{p.mensagem}&quot;
                  </div>
                )}

                {p.resposta && (
                  <div className="pedido-caixa-resposta">
                    <strong>Sua resposta:</strong> &quot;{p.resposta}&quot;
                  </div>
                )}

                {p.status === 'PENDENTE' && (
                  <div className="pedido-resposta-form">
                    <input
                      id={`resp-${p.id}`}
                      type="text"
                      className="pedido-input-observacao"
                      placeholder="Observação ou resposta ao cliente (opcional)"
                      value={respostasPorId[p.id] || ''}
                      onChange={(e) =>
                        setRespostasPorId((prev) => ({
                          ...prev,
                          [p.id]: e.target.value,
                        }))
                      }
                    />
                    <div className="pedido-acoes-botoes">
                      <button
                        type="button"
                        className="btn-pedido-aceitar"
                        onClick={() => aoResponder(p.id, 'ACEITA')}
                      >
                        Aceitar
                      </button>
                      <button
                        type="button"
                        className="btn-pedido-recusar"
                        onClick={() => aoResponder(p.id, 'RECUSADA')}
                      >
                        Recusar
                      </button>
                    </div>
                  </div>
                )}

                <hr className="pedido-separador" />
              </li>
            ))}
          </ul>
        )}
      </main>
    </LayoutPagsInicio>
  );
}
