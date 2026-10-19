-- SEED DE CATEGORIAS (Lista fixa do sistema)
INSERT INTO categorias (nome) VALUES 
('DJ'),
('Buffet'),
('Equipe de Garçom'),
('Sonorização'),
('Iluminação'),
('Decoração'),
('Bolo e Doces'),
('Fotografia'),
('Espaço')
ON CONFLICT (nome) DO NOTHING;


-- 2. SEED DE USUÁRIOS DE TESTE
-- (Senhas em hash bcrypt correspondentes a "123456")
INSERT INTO usuarios (nome, email, telefone, senha_hash, perfil) VALUES 
('Ana Cliente', 'cliente@partyhub.com', '(53) 99999-1111', '$2b$10$39ZlC8vT5Q8.D5Ue0yYl2uG9y9ZlC8vT5Q8.D5Ue0yYl2uG9y9ZlC', 'cliente'),
('Carlos DJ', 'dj@partyhub.com', '(53) 98888-2222', '$2b$10$39ZlC8vT5Q8.D5Ue0yYl2uG9y9ZlC8vT5Q8.D5Ue0yYl2uG9y9ZlC', 'fornecedor'),
('Maria Buffet', 'buffet@partyhub.com', '(53) 97777-3333', '$2b$10$39ZlC8vT5Q8.D5Ue0yYl2uG9y9ZlC8vT5Q8.D5Ue0yYl2uG9y9ZlC', 'fornecedor')
ON CONFLICT (email) DO NOTHING;

-- 3. SEED DE PERFIS DE FORNECEDOR
INSERT INTO fornecedores (usuario_id, nome_empresa, descricao, cidade, telefone_contato, whatsapp, email_contato, ativo) VALUES 
(
    (SELECT id FROM usuarios WHERE email = 'dj@partyhub.com'),
    'Carlos Som & DJ Pro',
    'Anos 80, 90, eletrônica e pista animada para todos os tipos de festas.',
    'Rio Grande',
    '(53) 98888-2222',
    '(53) 98888-2222',
    'dj@partyhub.com',
    true
),
(
    (SELECT id FROM usuarios WHERE email = 'buffet@partyhub.com'),
    'Sabor & Festa Buffet',
    'Buffet completo com salgados, doces finos e jantar para festas infantis e adultas.',
    'Rio Grande',
    '(53) 97777-3333',
    '(53) 97777-3333',
    'buffet@partyhub.com',
    true
)
ON CONFLICT DO NOTHING;

-- 4. SEED DE SERVIÇOS DOS FORNECEDORES
INSERT INTO fornecedorservicos (fornecedor_id, categoria_id, descricao, preco_referencia) VALUES 
(
    (SELECT id FROM fornecedores WHERE nome_empresa = 'Carlos Som & DJ Pro'),
    (SELECT id FROM categorias WHERE nome = 'DJ'),
    'Set completo com repertório personalizado de 5 horas.',
    'a partir de R$ 800'
),
(
    (SELECT id FROM fornecedores WHERE nome_empresa = 'Carlos Som & DJ Pro'),
    (SELECT id FROM categorias WHERE nome = 'Sonorização'),
    'Caixas ativas de alta potência e microfones sem fio.',
    'a partir de R$ 400'
),
(
    (SELECT id FROM fornecedores WHERE nome_empresa = 'Sabor & Festa Buffet'),
    (SELECT id FROM categorias WHERE nome = 'Buffet'),
    'Cardápio infantil tradicional com salgados variados e bolo temático.',
    'a partir de R$ 35 por pessoa'
)
ON CONFLICT DO NOTHING;