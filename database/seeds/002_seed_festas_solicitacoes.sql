-- seed de festa para testes
INSERT INTO festas (cliente_id, titulo, data, hora_inicio, hora_fim, local, qtd_convidados, tema, observacoes, status)
SELECT 
    id,
    'Aniversário de 7 anos do Pedro',
    '2026-12-12',
    '14:00:00',
    '19:00:00',
    'Salão de Festas Central - Rio Grande/RS',
    60,
    'Super-Heróis',
    'Festa infantil à tarde, precisamos de montagem 1h antes.',
    'PLANEJANDO'
FROM usuarios 
WHERE email = 'cliente@partyhub.com'
AND NOT EXISTS (
    SELECT 1 FROM festas WHERE titulo = 'Aniversário de 7 anos do Pedro'
);

-- seed de request para testes
-- caso A: solicitação de DJ já ACEITA por Carlos Som & DJ Pro
INSERT INTO solicitacoes (festa_id, fornecedor_id, categoria_id, mensagem, status, resposta, respondido_em)
VALUES (
    (SELECT id FROM festas WHERE titulo = 'Aniversário de 7 anos do Pedro' LIMIT 1),
    (SELECT id FROM fornecedores WHERE nome_empresa = 'Carlos Som & DJ Pro' LIMIT 1),
    (SELECT id FROM categorias WHERE nome = 'DJ' LIMIT 1),
    'Olá Carlos! Gostaria de verificar disponibilidade para tocar músicas infantis e flashback.',
    'ACEITA',
    'Data confirmada! Já conversamos pelo WhatsApp e fechei o pacote de 5h.',
    NOW()
)
ON CONFLICT (festa_id, fornecedor_id, categoria_id) DO NOTHING;

-- caso B: solicitação de Buffet ainda PENDENTE para a Maria Buffet
INSERT INTO solicitacoes (festa_id, fornecedor_id, categoria_id, mensagem, status, resposta, respondido_em)
VALUES (
    (SELECT id FROM festas WHERE titulo = 'Aniversário de 7 anos do Pedro' LIMIT 1),
    (SELECT id FROM fornecedores WHERE nome_empresa = 'Sabor & Festa Buffet' LIMIT 1),
    (SELECT id FROM categorias WHERE nome = 'Buffet' LIMIT 1),
    'Oi Maria, precisamos de orçamento completo para 60 pessoas (40 adultos e 20 crianças).',
    'PENDENTE',
    NULL,
    NULL
)
ON CONFLICT (festa_id, fornecedor_id, categoria_id) DO NOTHING;