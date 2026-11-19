import { useCallback, useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { api } from '../services/api';

export function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [respostasPorId, setRespostasPorId] = useState({});
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

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
    <Layout titulo="Pedidos Recebidos">
      <div>
        <label htmlFor="pedidos-status">Filtrar por status: </label>
        <select
          id="pedidos-status"
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

      <hr />

      {erro && (
        <p role="alert">
          <strong>Erro:</strong> {erro}
        </p>
      )}
      {sucesso && <p>{sucesso}</p>}
      {carregando && <p>Carregando pedidos...</p>}

      {!carregando && pedidos.length === 0 && (
        <p>Nenhum pedido encontrado.</p>
      )}

      {!carregando && pedidos.length > 0 && (
        <ul>
          {pedidos.map((p) => (
            <li key={p.id}>
              <h4>
                {p.festa_titulo} — {p.categoria_nome} [{p.status}]
              </h4>
              <p>
                <strong>Data da festa:</strong> {p.festa_data} |{' '}
                <strong>Horário:</strong> {String(p.hora_inicio || '').slice(0, 5)} às{' '}
                {String(p.hora_fim || '').slice(0, 5)}
              </p>
              <p>
                <strong>Local:</strong> {p.local || 'Não informado'} |{' '}
                <strong>Convidados:</strong> {p.qtd_convidados ?? 'Não informado'} |{' '}
                <strong>Tema:</strong> {p.tema || 'Não informado'}
              </p>
              <p>
                <strong>Cliente:</strong> {p.cliente_nome} |{' '}
                <strong>Telefone:</strong> {p.cliente_telefone || 'Não informado'} |{' '}
                <strong>E-mail:</strong> {p.cliente_email}
              </p>
              {p.mensagem && (
                <p>
                  <strong>Mensagem do cliente:</strong> {p.mensagem}
                </p>
              )}
              {p.resposta && (
                <p>
                  <strong>Sua resposta:</strong> {p.resposta}
                </p>
              )}

              {p.status === 'PENDENTE' && (
                <div>
                  <label htmlFor={`resp-${p.id}`}>Observação/resposta (opcional): </label>
                  <input
                    id={`resp-${p.id}`}
                    type="text"
                    value={respostasPorId[p.id] || ''}
                    onChange={(e) =>
                      setRespostasPorId((prev) => ({
                        ...prev,
                        [p.id]: e.target.value,
                      }))
                    }
                  />{' '}
                  <button type="button" onClick={() => aoResponder(p.id, 'ACEITA')}>
                    Aceitar
                  </button>{' '}
                  <button type="button" onClick={() => aoResponder(p.id, 'RECUSADA')}>
                    Recusar
                  </button>
                </div>
              )}
              <hr />
            </li>
          ))}
        </ul>
      )}
    </Layout>
  );
}
