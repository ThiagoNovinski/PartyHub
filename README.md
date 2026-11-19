# PartyHub

Plataforma web que conecta quem quer organizar uma festa a fornecedores de serviços (buffet, bebidas, decoração, local, segurança, música, fotografia e outros). O fornecedor se cadastra com o que entrega e seus contatos. O cliente monta a "stack" da festa, escolhe os fornecedores de interesse e envia a solicitação. O fornecedor combina os detalhes direto com o cliente e **aceita ou recusa** a festa na plataforma.

> Projeto da disciplina de **Engenharia de Software / Métodos Ágeis**  
> Universidade Federal do Rio Grande (FURG) — Centro de Ciências Computacionais (C3)  
> Objetivo da disciplina: vivenciar o trabalho de um **time de gerência** e de um **time de desenvolvimento** em um ambiente ágil.

---

## Sumário

1. [O problema](#1-o-problema)
2. [A solução](#2-a-solução)
3. [Equipe e responsabilidades](#3-equipe-e-responsabilidades)
4. [Tecnologias](#4-tecnologias)
5. [Estrutura do repositório](#5-estrutura-do-repositório)
6. [Como rodar o projeto](#6-como-rodar-o-projeto)
7. [Variáveis de ambiente](#7-variáveis-de-ambiente)
8. [Modelo de dados](#8-modelo-de-dados)
9. [API REST](#9-api-rest)
10. [Fluxo principal do usuário](#10-fluxo-principal-do-usuário)
11. [Regras de negócio](#11-regras-de-negócio)
12. [Cronograma](#12-cronograma)
13. [Operações (Ops)](#13-operações-ops)
14. [Fluxo de trabalho da equipe](#14-fluxo-de-trabalho-da-equipe)
15. [Definição de pronto](#15-definição-de-pronto)
16. [Próximos passos](#16-próximos-passos)

---

## 1. O problema

**Cenário:** uma mãe quer fazer a festa de 7 anos do filho. Ela precisa de DJ, buffet, garçons, som e iluminação. Cada serviço tem um fornecedor diferente, ela procura indicações em grupos e redes sociais, anota contatos em papéis e não sabe quem atende a data ou o tipo de festa. Do outro lado, os fornecedores dependem de indicação para serem encontrados.

**Causa raiz:** não existe um lugar único onde fornecedores se apresentam e clientes montam o que precisam para a festa.

**Insight principal:** o cliente pensa na festa como uma **lista de serviços** (uma "stack"). Se ele consegue montar essa lista e chamar os fornecedores de uma vez, o trabalho de organizar diminui muito.

**Ponto de vista (POV):**
O cliente que organiza uma festa precisa encontrar e contatar os fornecedores certos de forma centralizada. Mas hoje os contatos estão espalhados em indicações e conversas, então ele perde tempo e não tem visão do que já foi resolvido.

**Necessidades:**
- Cliente: descobrir fornecedores por tipo de serviço e acompanhar quem aceitou a festa.
- Fornecedor: divulgar o que entrega e receber pedidos organizados.

## 2. A solução

O MVP é uma **aplicação web com cadastros simples (CRUD)** e dois perfis:

**Fornecedor**
- Cria conta e preenche o perfil: nome da empresa, descrição, cidade, telefone/WhatsApp e e-mail.
- Marca quais serviços entrega (Buffet, Bebidas, Decoração, Local, Segurança, Música, Fotografia...) e descreve cada um com preço de referência.
- Vê os pedidos recebidos, entra em contato com o cliente e **aceita ou recusa** a festa.

**Cliente**
- Cria conta e cadastra a festa: título, data, horário (início e fim), local, número de convidados e tema.
- Monta a **stack da festa**: escolhe as categorias de serviço de que precisa.
- Para cada categoria, navega pelos fornecedores e **solicita contato** com os de interesse.
- Acompanha o status de cada solicitação: pendente, aceita, recusada ou cancelada.

**Fora do MVP, de propósito:** pagamento, contratos, chat interno, notificações e integrações externas. A negociação e o fechamento acontecem **fora da plataforma**, por telefone ou WhatsApp. A plataforma só organiza o contato e registra a resposta do fornecedor.

**Por que essa ideia:** é um recorte pequeno que ainda entrega valor e cabe em CRUDs simples. O foco da disciplina fica no **processo ágil**, não na complexidade técnica.

## 3. Equipe e responsabilidades

Os papéis simulam um ambiente ágil real. Preencher com os nomes do grupo.

### Gerência

| Integrante | Papel | Responsável por |
| --- | --- | --- |
| _a definir_ | **Product Owner** | Backlog, prioridades, critérios de aceite, aceitar ou recusar as entregas da sprint |
| _a definir_ | **Scrum Master** | Cerimônias (planning, daily, review, retrospectiva), quadro Kanban, remover impedimentos |

### Desenvolvimento

| Integrante | Papel | Responsável por |
| --- | --- | --- |
| _a definir_ | **Front-end** | Telas: cadastro, login, catálogo, perfil do fornecedor, minhas festas, stack da festa, pedidos |
| _a definir_ | **Back-end** | API REST, autenticação, regras de solicitação e resposta, testes das rotas |
| _a definir_ | **Banco de dados** | Modelo de dados, migrations, seeds, consultas de catálogo e pedidos |
| _a definir_ | **Ops / QA** | README, contrato da API (OpenAPI), containerização, rede entre serviços, gestão de chaves, CI/CD, testes de ponta a ponta |

## 4. Tecnologias

| Camada | Tecnologia |
| --- | --- |
| Front-end | React + Vite (roteamento client-side via History API e cliente `fetch`) |
| Back-end | Node.js + Express, JWT, bcrypt |
| Banco de dados | PostgreSQL 16 |
| Infraestrutura | Docker e Docker Compose |
| Proxy reverso (produção) | Nginx (`frontend/nginx.conf`, serve o build do Vite e encaminha `/api` ao back-end) |
| CI/CD | GitHub Actions, imagens no GitHub Container Registry (ghcr.io) *(planejado)* |
| Segredos | `.env` local, GitHub Secrets (CI/CD) e variáveis do servidor |
| Testes | Vitest + Supertest (back), testes manuais guiados (front) |
| Documentação da API | OpenAPI 3 ([`docs/openapi.yaml`](./docs/openapi.yaml)) |
| Versionamento | Git + GitHub |
| Gestão do projeto | Quadro Kanban (GitHub Projects ou Trello) |

## 5. Estrutura do repositório

```
PartyHub/
├── frontend/                  # React + Vite (+ build multi-stage Nginx para produção)
│   ├── src/
│   │   ├── components/        # Layout, RotaProtegida, InputHora24h
│   │   ├── context/           # AuthContext
│   │   ├── pages/             # Login, Cadastro, Catalogo, DetalheFornecedor,
│   │   │                      # MinhasFestas, StackDaFesta, PerfilFornecedor, Pedidos
│   │   ├── services/api.js
│   │   ├── utils/             # validarSenha, filtrarFornecedores
│   │   ├── router.jsx
│   │   └── App.jsx
│   ├── nginx.conf
│   ├── Dockerfile
│   └── package.json
├── backend/                   # Node.js + Express
│   ├── src/
│   │   ├── controllers/
│   │   ├── middlewares/       # autenticação JWT, perfil, tratamento de erros
│   │   ├── routes/
│   │   ├── scripts/           # executarSql.js (migrations e seeds)
│   │   └── app.js
│   ├── tests/
│   ├── Dockerfile
│   └── package.json
├── database/                  # PostgreSQL
│   ├── migrations/
│   ├── seeds/
│   ├── schemas/
│   │   └── queries_referencia.sql
│   ├── diagrama-er.png
│   └── README.md
├── docs/                      # Documentação
│   ├── openapi.yaml
│   ├── manual-do-usuario.md
│   └── PLAN.md                # visão técnica de longo prazo
├── docker-compose.yml         # desenvolvimento
├── .env.example
└── README.md
```

## 6. Como rodar o projeto

### Pré-requisitos

- Git
- Docker e Docker Compose
- Node.js 20+ e PostgreSQL 16 (apenas para rodar fora do Docker)

### Passo a passo (Docker — Desenvolvimento)

```bash
# 1. Clonar o repositório
git clone https://github.com/<organizacao>/partyhub.git
cd partyhub

# 2. Criar o arquivo de ambiente
cp .env.example .env

# 3. Subir banco, back-end e front-end (migrations rodam automaticamente no back-end)
docker compose up --build

# 4. (Opcional) Em outro terminal, popular categorias extras e dados de teste
docker compose exec backend npm run seed
```

| Serviço | Endereço |
| --- | --- |
| Front-end (dev Vite) | http://localhost:5173 |
| API | http://localhost:3000 |
| PostgreSQL | localhost:5432 |

**Usuários de teste (criados pelo seed):** veja [`database/seeds/`](./database/seeds/) e [`database/README.md`](./database/README.md). Há 1 cliente, 2 fornecedores e categorias já cadastradas. Não coloque senhas reais no repositório.

### Build de produção do Front-end (Nginx)

O [`frontend/Dockerfile`](./frontend/Dockerfile) possui estágio `dev` (usado pelo `docker-compose.yml`) e estágio padrão `prod` com multi-stage build do Vite + `nginx:1.27-alpine` servindo os arquivos estáticos na porta `80` e encaminhando `/api/` para `http://backend:3000/`:

```bash
docker build -t partyhub-frontend ./frontend
```

### Rodar sem Docker

Crie o banco no PostgreSQL local e ajuste o `.env`.

```bash
cd backend  && npm install && npm run migrate && npm run seed && npm run dev
cd frontend && npm install && npm run dev
```

### Comandos úteis

```bash
docker compose down              # parar tudo
docker compose down -v           # parar e apagar os dados
docker compose logs -f backend   # ver logs da API
docker compose exec backend npm test
```

## 7. Variáveis de ambiente

| Variável | Exemplo | Descrição |
| --- | --- | --- |
| `POSTGRES_HOST` | `localhost` (local) / `db` (Compose) | Host do banco |
| `POSTGRES_PORT` | `5432` | Porta do banco |
| `POSTGRES_DB` | `partyhub` | Nome do banco |
| `POSTGRES_USER` | `partyhub` | Usuário do banco |
| `POSTGRES_PASSWORD` | `troque-aqui` | Senha do banco |
| `JWT_SECRET` | `segredo-com-mais-de-32-caracteres` | Chave para assinar os tokens |
| `JWT_EXPIRES_IN` | `8h` | Validade do token |
| `BCRYPT_ROUNDS` | `10` | Fator de custo do bcrypt |
| `API_PORT` | `3000` | Porta da API |
| `FRONTEND_PORT` | `5173` | Porta do front-end em desenvolvimento |
| `VITE_API_URL` | `http://localhost:3000` | Endereço da API usado pelo proxy de desenvolvimento do Vite |

## 8. Modelo de dados

A documentação completa da camada de banco de dados (diagrama ER, constraints e índices) encontra-se em [`database/README.md`](./database/README.md) e [`database/diagrama-er.png`](./database/diagrama-er.png).

```
Usuario 1 ──── 0..1 Fornecedor 1 ──── N FornecedorServico N ──── 1 Categoria
Usuario 1 ──── N Festa 1 ──── N Solicitacao N ──── 1 Fornecedor
                                  Solicitacao N ──── 1 Categoria
```

### Usuario
| Campo | Tipo | Observação |
| --- | --- | --- |
| id | serial | PK |
| nome | varchar(120) | obrigatório |
| email | varchar(120) | único |
| telefone | varchar(30) | |
| senha_hash | varchar(255) | bcrypt |
| perfil | varchar(20) | `cliente` ou `fornecedor` |
| criado_em | timestamp | padrão `now()` |

### Categoria
| Campo | Tipo | Observação |
| --- | --- | --- |
| id | serial | PK |
| nome | varchar(60) | único. Migration inicial: Buffet, Bebidas, Decoração, Local, Segurança, Música, Fotografia (mais categorias adicionais no seed) |

### Fornecedor
| Campo | Tipo | Observação |
| --- | --- | --- |
| id | serial | PK |
| usuario_id | int | FK → Usuario, único |
| nome_empresa | varchar(120) | obrigatório |
| descricao | text | o que a empresa faz |
| cidade | varchar(80) | |
| telefone_contato | varchar(30) | obrigatório |
| whatsapp | varchar(30) | |
| email_contato | varchar(120) | |
| ativo | boolean | padrão `true` |

### FornecedorServico
| Campo | Tipo | Observação |
| --- | --- | --- |
| id | serial | PK |
| fornecedor_id | int | FK → Fornecedor |
| categoria_id | int | FK → Categoria |
| descricao | text | o que entrega nessa categoria |
| preco_referencia | varchar(80) | texto livre. Ex.: "a partir de R$ 800" |

Único em (`fornecedor_id`, `categoria_id`).

### Festa
| Campo | Tipo | Observação |
| --- | --- | --- |
| id | serial | PK |
| cliente_id | int | FK → Usuario |
| titulo | varchar(120) | ex.: "Aniversário de 7 anos do Pedro" |
| data | date | data local da festa (`YYYY-MM-DD`) |
| hora_inicio | time | formato 24h (`HH:MM`) |
| hora_fim | time | formato 24h (`HH:MM`), deve ser depois de `hora_inicio` |
| local | varchar(200) | |
| qtd_convidados | int | > 0 quando informado |
| tema | varchar(80) | |
| observacoes | text | |
| status | varchar(20) | `PLANEJANDO`, `CONCLUIDA`, `CANCELADA` |

### Solicitacao
| Campo | Tipo | Observação |
| --- | --- | --- |
| id | serial | PK |
| festa_id | int | FK → Festa |
| fornecedor_id | int | FK → Fornecedor |
| categoria_id | int | FK → Categoria |
| mensagem | text | recado do cliente ao fornecedor |
| status | varchar(20) | `PENDENTE`, `ACEITA`, `RECUSADA`, `CANCELADA` |
| resposta | text | motivo ou observação do fornecedor |
| criado_em | timestamp | padrão `now()` |
| respondido_em | timestamp | `null` enquanto pendente |

Único em (`festa_id`, `fornecedor_id`, `categoria_id`). A **stack da festa** é o conjunto de categorias presentes nas solicitações da festa.

## 9. API REST

Rotas de catálogo são públicas. As demais exigem `Authorization: Bearer <token>`. O contrato completo está em [`docs/openapi.yaml`](./docs/openapi.yaml).

### Autenticação e perfil
| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/health` | Verifica se a API está no ar |
| POST | `/auth/registrar` | Cria conta. Corpo inclui `perfil`: `cliente` ou `fornecedor` |
| POST | `/auth/login` | Retorna o token JWT e dados do usuário |
| GET | `/auth/eu` | Dados do usuário logado |

### Categorias e catálogo (público)
| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/categorias` | Lista as categorias de serviço |
| GET | `/fornecedores` | Lista ativos com serviços, com filtros `?categoria=` e `?cidade=` |
| GET | `/fornecedores/:id` | Perfil com serviços e contatos |

### Fornecedor (perfil `fornecedor`)
| Método | Rota | Descrição |
| --- | --- | --- |
| PUT | `/fornecedores/meu` | Cria ou edita o próprio perfil |
| POST | `/fornecedores/meu/servicos` | Adiciona um serviço. Corpo: `{ "categoria_id": 1, "descricao": "...", "preco_referencia": "..." }` |
| PUT | `/fornecedores/meu/servicos/:id` | Edita um serviço |
| DELETE | `/fornecedores/meu/servicos/:id` | Remove um serviço |
| PATCH | `/fornecedores/meu/ativo` | Ativa ou desativa o perfil |
| GET | `/solicitacoes/recebidas` | Pedidos recebidos, com filtro `?status=` |
| PATCH | `/solicitacoes/:id/responder` | Aceita ou recusa. Corpo: `{ "status": "ACEITA", "resposta": "..." }` |

### Cliente (perfil `cliente`)
| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/festas` | Festas do cliente logado |
| POST | `/festas` | Cria festa |
| GET | `/festas/:id` | Detalhe com a stack e o status de cada solicitação |
| PUT | `/festas/:id` | Edita festa |
| PATCH | `/festas/:id/cancelar` | Cancela festa e suas solicitações pendentes |
| POST | `/festas/:id/solicitacoes` | Solicita contato. Corpo: `{ "fornecedor_id": 3, "categoria_id": 1, "mensagem": "..." }` |
| PATCH | `/solicitacoes/:id/cancelar` | Cliente cancela a solicitação |

### Erros padronizados
```json
{ "erro": "DATA_OCUPADA", "mensagem": "Você já aceitou outra festa na data 2026-12-12." }
```

| Código HTTP | Erro | Quando |
| --- | --- | --- |
| 400 | `DADOS_INVALIDOS` | Campo obrigatório vazio, data ou horário inválido |
| 401 | `NAO_AUTENTICADO` | Token ausente ou inválido |
| 403 | `SEM_PERMISSAO` | Perfil errado ou recurso de outro usuário |
| 404 | `NAO_ENCONTRADO` | Recurso inexistente |
| 409 | `EMAIL_EM_USO` | E-mail já cadastrado |
| 409 | `SERVICO_DUPLICADO` | Fornecedor já cadastrou serviço nesta categoria |
| 409 | `SOLICITACAO_DUPLICADA` | Mesmo fornecedor e categoria já solicitados nesta festa |
| 409 | `SERVICO_NAO_OFERECIDO` | Fornecedor não entrega a categoria pedida |
| 409 | `JA_RESPONDIDA` | Tentativa de responder solicitação que não está pendente |
| 409 | `DATA_OCUPADA` | Fornecedor já aceitou outra festa na mesma data |

## 10. Fluxo principal do usuário

Consulte o guia completo de telas em [`docs/manual-do-usuario.md`](./docs/manual-do-usuario.md).

**Fornecedor**
1. Cria conta com perfil `fornecedor`.
2. Preenche nome da empresa, descrição, cidade e contatos.
3. Marca os serviços que entrega e descreve cada um.
4. Aparece no catálogo enquanto estiver ativo e com ao menos um serviço.

**Cliente**
1. Cria conta com perfil `cliente`.
2. Cadastra a festa (título, data, horário de início e fim, local, convidados, tema).
3. Monta a stack: escolhe as categorias necessárias.
4. Em cada categoria, busca fornecedores, vê descrição e contatos e clica em **Solicitar contato**.
5. Acompanha na tela da festa o status de cada solicitação: pendente, aceita, recusada ou cancelada.
6. Se um fornecedor recusar, escolhe outro para aquela categoria.

**Resposta do fornecedor**
1. Abre **Pedidos recebidos** e vê data, local, convidados e o contato do cliente.
2. Conversa com o cliente por telefone ou WhatsApp, fora da plataforma.
3. Volta e clica em **Aceitar** ou **Recusar**, com uma observação opcional.

## 11. Regras de negócio

- Cada usuário tem **um perfil**: `cliente` ou `fornecedor`.
- O fornecedor só aparece no catálogo se estiver `ativo` e tiver ao menos um serviço.
- O cliente só solicita uma categoria que o fornecedor entrega (`SERVICO_NAO_OFERECIDO`).
- Não pode haver duas solicitações iguais (mesma festa, fornecedor e categoria).
- Contato do cliente (telefone, e-mail) só é visível ao fornecedor **depois** que há uma solicitação para ele.
- Só o fornecedor destinatário responde, e só uma vez, enquanto a solicitação está `PENDENTE`.
- Um fornecedor não aceita duas festas na **mesma data** (`DATA_OCUPADA`).
- Cancelar uma festa cancela suas solicitações pendentes. Solicitações já aceitas ficam registradas.
- Nada é apagado de verdade em festas e solicitações: mudar o status mantém o histórico.
- A plataforma **não processa pagamento nem contrato**. Valores e acordos são combinados entre as partes.
- Senhas são guardadas com hash (`bcrypt`) e o `JWT_SECRET` nunca vai para o repositório.

## 12. Cronograma

Sprints de **duas semanas**. Ajustar as datas ao calendário da disciplina.

### Sprint 0 — planejamento
Meta: o time está organizado e o ambiente roda na máquina de todos.

| Papel | Entregas |
| --- | --- |
| Product Owner | Backlog inicial priorizado e critérios de aceite das primeiras histórias |
| Scrum Master | Quadro Kanban, combinados do time, data das cerimônias |
| Ops / QA | Repositório, README inicial, padrão de branches e commits, Dockerfiles, docker-compose com Postgres, `.env.example`, pipeline de CI mínimo (lint + testes) |
| Back-end / Front-end / Banco | Projetos criados e "Hello World" rodando |

### Sprint 1 — contas e catálogo
Meta: fornecedor se cadastra e aparece no catálogo.

| Papel | Entregas |
| --- | --- |
| Banco de dados | Migrations de Usuario, Categoria, Fornecedor e FornecedorServico; seeds |
| Back-end | Registro, login, perfil do fornecedor, serviços, `GET /fornecedores` |
| Front-end | Telas de cadastro e login, perfil do fornecedor, catálogo com filtro por categoria |
| Ops / QA | Contrato OpenAPI, healthchecks, rede e volume do Compose, segredos no GitHub Secrets, primeiro teste de integração |

### Sprint 2 — festa, stack e solicitações
Meta: o cliente monta a festa e solicita contato com fornecedores.

| Papel | Entregas |
| --- | --- |
| Banco de dados | Migrations de Festa e Solicitacao, índices e restrições de unicidade |
| Back-end | CRUD de festas, criação e cancelamento de solicitações, regras de duplicidade |
| Front-end | Minhas festas, stack da festa, botão "Solicitar contato", status por categoria |
| Ops / QA | Testes das regras de negócio e do fluxo do cliente |

### Sprint 3 — resposta do fornecedor e fechamento
Meta: fluxo completo funcionando, estável e pronto para apresentar.

| Papel | Entregas |
| --- | --- |
| Back-end | Pedidos recebidos, aceitar/recusar, regra `DATA_OCUPADA` |
| Front-end | Tela de pedidos recebidos, ajustes visuais, teste no celular e no computador |
| Ops / QA | Pipeline de CD (build e push das imagens, deploy), testes de ponta a ponta, README final, manual do usuário, tag `v1.0` |
| Product Owner / Scrum Master | Aceite final, roteiro da apresentação, retrospectiva final |

### Backlog inicial

| # | História | Prioridade |
| --- | --- | --- |
| 1 | Como fornecedor, quero criar conta e fazer login | Alta |
| 2 | Como fornecedor, quero cadastrar meu perfil e meus contatos | Alta |
| 3 | Como fornecedor, quero informar os serviços que entrego | Alta |
| 4 | Como cliente, quero criar conta e fazer login | Alta |
| 5 | Como cliente, quero ver fornecedores filtrando por categoria | Alta |
| 6 | Como cliente, quero cadastrar minha festa | Alta |
| 7 | Como cliente, quero montar a stack da festa e solicitar contato com fornecedores | Alta |
| 8 | Como fornecedor, quero ver os pedidos recebidos | Alta |
| 9 | Como fornecedor, quero aceitar ou recusar um pedido | Alta |
| 10 | Como cliente, quero acompanhar o status de cada solicitação | Média |
| 11 | Como cliente, quero cancelar uma solicitação ou a festa | Média |
| 12 | Como fornecedor, quero desativar meu perfil temporariamente | Baixa |

**Exemplo de critério de aceite (história 9):** ao aceitar um pedido, o status muda para `ACEITA` e o cliente vê isso na tela da festa. Se o fornecedor já aceitou outra festa na mesma data, a API devolve 409 `DATA_OCUPADA` e a tela mostra a mensagem.

## 13. Operações (Ops)

Visão geral de infraestrutura e entrega contínua descrita em mais detalhes em [`docs/PLAN.md`](./docs/PLAN.md).

### 13.1 Containerização

Três serviços, cada um com seu contêiner:

| Serviço | Imagem | Observações |
| --- | --- | --- |
| `db` | `postgres:16-alpine` | Dados em volume nomeado `pgdata` |
| `backend` | Dockerfile próprio (Node 22 Alpine) | Executa `npm run migrate` antes de subir a API |
| `frontend` | Dockerfile próprio (multi-stage: `dev` Vite + `prod` Nginx) | Em produção, Nginx (`nginx:1.27-alpine`) serve os estáticos na porta 80 e encaminha `/api` |

### 13.2 Comunicação entre os serviços

```
Produção:
Navegador ──► frontend (Nginx :80) ──/api──► backend (:3000) ──► db (Postgres :5432)

Desenvolvimento:
Navegador ──► frontend (Vite :5173) ──/api──► backend (:3000) ──► db (Postgres :5432)
```

- O Nginx (em produção) e o proxy do Vite (em desenvolvimento) encaminham `/api/*` para o back-end mantendo a mesma origem no navegador.
- O back-end só sobe depois que o banco está saudável (`depends_on` com `condition: service_healthy`).
- **Healthchecks:** `pg_isready` no banco e `GET /health` no back-end.

### 13.3 Gerenciamento de chaves e segredos

| Segredo | Onde fica |
| --- | --- |
| Desenvolvimento local | Arquivo `.env`, **ignorado pelo Git**. O repositório só tem o `.env.example` com valores de exemplo |
| CI/CD | **GitHub Secrets** (`JWT_SECRET`, `POSTGRES_PASSWORD`, chave SSH do servidor, token do registro) |
| Servidor | Arquivo `.env` com permissão `600`, fora da pasta do repositório, ou variáveis do provedor |

## 14. Fluxo de trabalho da equipe

### Cerimônias ágeis
- **Planning** (início da sprint): o PO apresenta as histórias e o time escolhe o que cabe.
- **Daily** (10 a 15 minutos, ou mensagem no grupo): o que fiz ontem, o que faço hoje, o que está me travando. O Scrum Master registra os bloqueios e chama quem precisa resolver.
- **Review** (fim da sprint): demonstração do que funciona para o PO, que aceita ou recusa.
- **Retrospectiva** (fim da sprint): o que manter, o que mudar, com uma ação concreta para a próxima sprint.

### Quadro Kanban
Colunas: **Backlog → Em andamento → Em revisão → Pronto**.

### Branches
- `main` — sempre funcionando; só recebe código por Pull Request.
- `feat/<area>-<descricao>` — ex.: `feat/front-catalogo`, `feat/back-solicitacoes`, `feat/db-migrations`.
- `fix/<descricao>` — correções.

### Commits (Conventional Commits)
```
feat(back): adiciona rota de resposta à solicitação
fix(front): corrige filtro de categoria no catálogo
docs: atualiza contrato da API
db: cria migration de solicitacao
```

### Pull Requests
- PRs pequenos, com descrição do que muda e como testar.
- Pelo menos **1 colega** revisa antes do merge.

### Ciclo de integração

```
Dev (Banco → Back → Front) → Ops/QA (CI + teste de ponta a ponta) → PO (valida critérios) → Pronto
         ▲                                                              │
         └────────────── ajustes pedidos pelo PO ◄──────────────────────┘
```

## 15. Definição de pronto

Uma história só está pronta quando:

- [ ] O código está na `main` via PR revisado.
- [ ] Os critérios de aceite foram verificados pelo Product Owner.
- [ ] Existe teste para a regra principal, quando houver regra.
- [ ] Roda com `docker compose up` na máquina de outro colega.
- [ ] A mudança está documentada (README ou OpenAPI).

## 16. Próximos passos

Os próximos passos seguem as sprints da disciplina. Cada sprint termina com uma review em que o PO aceita ou recusa as histórias (números do [backlog](#backlog-inicial)).

| Sprint | Próximos passos | Histórias | Validação com o PO |
| --- | --- | --- | --- |
| 0 | Montar o time, o quadro Kanban, o repositório e o ambiente local | — | PO apresenta e prioriza o backlog inicial |
| 1 | Contas, perfil do fornecedor e catálogo com filtro por categoria | 1, 2, 3, 4, 5 | PO valida cadastro e catálogo |
| 2 | Cadastro de festa, stack da festa e solicitação de contato | 6, 7, 10, 11 | PO valida o fluxo do cliente |
| 3 | Pedidos recebidos, aceitar/recusar, fechamento, deploy e apresentação | 8, 9, 12 | PO faz o aceite final do produto |

**Depois da disciplina** (fora do MVP):
- Calendário de disponibilidade do fornecedor.
- Chat interno entre cliente e fornecedor.
- Orçamento com valores dentro da plataforma.
- Contrato e pagamento por Pix.
- Avaliações de fornecedores após a festa.
- Notificações por e-mail ou WhatsApp.
- Lista de convidados e confirmação de presença (RSVP).
- Aplicativo mobile.

---

**Licença:** uso acadêmico — FURG / C3.
