-- tabela de festas (eventos cadastrados pelos clientes)
CREATE TABLE IF NOT EXISTS festas (
    id SERIAL PRIMARY KEY,
    cliente_id INT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    titulo VARCHAR(120) NOT NULL,
    data DATE NOT NULL,
    hora_inicio TIME,
    hora_fim TIME,
    local VARCHAR(200),
    qtd_convidados INT CHECK (qtd_convidados IS NULL OR qtd_convidados > 0),
    tema VARCHAR(80),
    observacoes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PLANEJANDO' 
        CHECK (status IN ('PLANEJANDO', 'CONCLUIDA', 'CANCELADA')),
    
    -- regra: hora_fim deve ser depois de hora_inicio
    CONSTRAINT chk_festas_horario CHECK (
        hora_inicio IS NULL OR hora_fim IS NULL OR hora_fim > hora_inicio
    )
);

-- tabela de solicitações (ttack da festa e status das respostas)
CREATE TABLE IF NOT EXISTS solicitacoes (
    id SERIAL PRIMARY KEY,
    festa_id INT NOT NULL REFERENCES festas(id) ON DELETE RESTRICT,
    fornecedor_id INT NOT NULL REFERENCES fornecedores(id) ON DELETE RESTRICT,
    categoria_id INT NOT NULL REFERENCES categorias(id) ON DELETE RESTRICT,
    mensagem TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE' 
        CHECK (status IN ('PENDENTE', 'ACEITA', 'RECUSADA', 'CANCELADA')),
    resposta TEXT,
    criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
    respondido_em TIMESTAMP,

    -- regra: não pode haver duas solicitações iguais (mesma festa, fornecedor e categoria)
    CONSTRAINT uk_festa_fornecedor_categoria UNIQUE (festa_id, fornecedor_id, categoria_id),

    -- integridade temporal: se respondida (ACEITA ou RECUSADA), deve ter data de resposta
    CONSTRAINT chk_solicitacoes_respondido_em CHECK (
        (status = 'PENDENTE' AND respondido_em IS NULL) OR (status <> 'PENDENTE')
    )
);

-- indices para acelerar as consultas principais da API REST
CREATE INDEX IF NOT EXISTS idx_festas_cliente_id ON festas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_festas_data ON festas(data);
CREATE INDEX IF NOT EXISTS idx_festas_status ON festas(status);

CREATE INDEX IF NOT EXISTS idx_solicitacoes_festa_id ON solicitacoes(festa_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_fornecedor_status ON solicitacoes(fornecedor_id, status);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_categoria_id ON solicitacoes(categoria_id);