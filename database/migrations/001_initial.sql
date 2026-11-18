-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela de Usuários (Clientes e Fornecedores)
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    telefone VARCHAR(30),
    senha_hash VARCHAR(255) NOT NULL,
    perfil VARCHAR(20) NOT NULL CHECK (perfil IN ('cliente', 'fornecedor')),
    criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2. Tabela de Categorias (Lista fixa de serviços da festa)
CREATE TABLE IF NOT EXISTS categorias (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(60) NOT NULL UNIQUE
);

-- 3. Tabela de Fornecedores (Vinculada a um usuário do tipo 'fornecedor')
CREATE TABLE IF NOT EXISTS fornecedores (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
    nome_empresa VARCHAR(120) NOT NULL,
    descricao TEXT,
    cidade VARCHAR(80),
    telefone_contato VARCHAR(30) NOT NULL,
    whatsapp VARCHAR(30),
    email_contato VARCHAR(120),
    ativo BOOLEAN NOT NULL DEFAULT TRUE
);

-- 4. Tabela de Serviços do Fornecedor (Associa fornecedor às categorias que atende)
CREATE TABLE IF NOT EXISTS fornecedorservicos (
    id SERIAL PRIMARY KEY,
    fornecedor_id INT NOT NULL REFERENCES fornecedores(id) ON DELETE CASCADE,
    categoria_id INT NOT NULL REFERENCES categorias(id) ON DELETE RESTRICT,
    descricao TEXT,
    preco_referencia VARCHAR(80),
    -- Regra de negócio: Um fornecedor não pode cadastrar a mesma categoria duas vezes
    CONSTRAINT uk_fornecedor_categoria UNIQUE (fornecedor_id, categoria_id)
);

-- Índices recomendados para otimização de buscas no catálogo e relacionamentos
CREATE INDEX IF NOT EXISTS idx_fornecedores_cidade ON fornecedores(cidade);
CREATE INDEX IF NOT EXISTS idx_fornecedores_ativo ON fornecedores(ativo);
CREATE INDEX IF NOT EXISTS idx_fornecedorservicos_categoria ON fornecedorservicos(categoria_id);