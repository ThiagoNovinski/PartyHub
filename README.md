# Relatório de Progresso — Camada de Banco de Dados (PartyHub)

> **Responsável:** Guilherme Estrella
> **Status atual:** Estrutura inicial e dados de teste aplicados com sucesso via Docker (PostgreSQL 16).

## O que foi feito até o momento

### 1. Infraestrutura e Ambiente Local
- Configuração do serviço de banco de dados utilizando **PostgreSQL 16 (Alpine)** via `docker-compose.yml`.
- Definição de volumes persistentes (`pgdata`) e variáveis de ambiente padronizadas (`.env`) para isolamento do ambiente de desenvolvimento.

### 2. Modelagem e Migrations (`database/migrations/`)
Criação do esquema relacional inicial suportando as entidades principais do sistema:
- **`usuarios`**: Tabela unificada para clientes e fornecedores, contendo restrições de perfil (`cliente` ou `fornecedor`) e segurança para senhas (`senha_hash`).
- **`categorias`**: Tabela de domínio com a lista fixa de serviços oferecidos na plataforma (DJ, Buffet, Sonorização, etc.).
- **`fornecedores`**: Perfil detalhado vinculado a um usuário fornecedor, contendo dados de contato, cidade, descrição da empresa e status de atividade (`ativo`).
- **`fornecedorservicos`**: Relociação N-para-N entre fornecedores e categorias de serviços, incluindo restrição de unicidade composta para evitar duplicações de serviços por fornecedor.

### 3. Dados Iniciais / Seeds (`database/seeds/`)
- Inserção automatizada da lista fixa de categorias padrão do sistema.
- Criação de massa de dados inicial para testes (contas de cliente e fornecedores com hash de senha simulado).
- Associação prévia de serviços de teste aos fornecedores cadastrados para validação imediata do catálogo e das listagens no Front-end.

## Próximos Passos (Sprint 2)
- Planejamento e criação das tabelas **`festas`** (gestão de eventos do cliente) e **`solicitacoes`** (stack da festa e controle de status de pedidos/respostas dos fornecedores)