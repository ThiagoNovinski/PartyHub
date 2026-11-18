-- ============================================================================
-- QUERIES DE REFERÊNCIA PARA INTEGRAÇÃO COM O BACK-END (PARTYHUB)
-- ============================================================================
-- Nota para o back-end: Os parâmetros $1, $2, etc. representam os valores recebidos na requisição HTTP (req.params, req.query ou req.body).
-- ============================================================================

--CATÁLOGO PÚBLICO DE FORNECEDORES
-- Rota: GET /fornecedores?categoria=$1&cidade=$2
-- Regra: Lista apenas fornecedores ativos que possuam pelo menos 1 serviço.
SELECT DISTINCT
    f.id,
    f.nome_empresa,
    f.descricao,
    f.cidade,
    f.telefone_contato,
    f.whatsapp,
    f.email_contato
FROM fornecedores f
JOIN fornecedorservicos fs ON fs.fornecedor_id = f.id
WHERE f.ativo = TRUE
  AND ($1::INT IS NULL OR fs.categoria_id = $1)
  AND ($2::VARCHAR IS NULL OR f.cidade ILIKE '%' || $2 || '%')
ORDER BY f.nome_empresa ASC;


-- VALIDAÇÃO: SERVIÇO NÃO OFERECIDO PELO FORNECEDOR
-- Rota: POST /festas/:id/solicitacoes
-- Parâmetros: $1 = fornecedor_id, $2 = categoria_id
-- Regra: Se retornar 0 linhas, retornar HTTP 409 (SERVICO_NAO_OFERECIDO).
SELECT 1
FROM fornecedorservicos fs
JOIN fornecedores f ON f.id = fs.fornecedor_id
WHERE fs.fornecedor_id = $1
  AND fs.categoria_id = $2
  AND f.ativo = TRUE;


-- VALIDAÇÃO: DATA OCUPADA DO FORNECEDOR
-- Rota: PATCH /solicitacoes/:id/responder (quando body.status === 'ACEITA')
-- Parâmetros: $1 = fornecedor_id (do usuário logado), $2 = solicitacao_id
-- Regra: Se retornar >= 1 linha, retornar HTTP 409 (DATA_OCUPADA).
SELECT f_existente.data
FROM solicitacoes s_existente
JOIN festas f_existente ON f_existente.id = s_existente.festa_id
WHERE s_existente.fornecedor_id = $1
  AND s_existente.status = 'ACEITA'
  AND s_existente.id <> $2
  AND f_existente.data = (
      SELECT f_alvo.data
      FROM solicitacoes s_alvo
      JOIN festas f_alvo ON f_alvo.id = s_alvo.festa_id
      WHERE s_alvo.id = $2
  );


-- CANCELAMENTO DE FESTA EM CASCATA LÓGICA
-- Rota: PATCH /festas/:id/cancelar
-- Parâmetros: $1 = festa_id, $2 = cliente_id (do usuário logado)
-- Regra: Cancela a festa e apenas as solicitações PENDENTES (mantém ACEITAS).
BEGIN;

UPDATE festas
SET status = 'CANCELADA'
WHERE id = $1 AND cliente_id = $2;

UPDATE solicitacoes
SET status = 'CANCELADA',
    respondido_em = NOW()
WHERE festa_id = $1
  AND status = 'PENDENTE';

COMMIT;