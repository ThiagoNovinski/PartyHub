# Plano Técnico de Longo Prazo — PartyHub

Este documento registra a visão técnica de evolução da plataforma **PartyHub** além do escopo inicial do MVP da disciplina.

---

## 1. Arquitetura Atual (MVP)

- **Front-end:** SPA em React + Vite, com proxy de `/api` via Vite em desenvolvimento e imagem Nginx (`nginx:1.27-alpine`) em produção.
- **Back-end:** API REST monolítica modular em Node.js + Express (`routes` → `controllers` → `db`), autenticação stateless via JWT e senhas com `bcrypt`.
- **Banco de dados:** PostgreSQL 16 com migrations SQL versionadas manualmente (`database/migrations/`) executadas na inicialização do container `backend`.
- **Negociação fora da plataforma:** pagamento, contrato e troca de mensagens ocorrem por telefone/WhatsApp.

---

## 2. Roadmap de Infraestrutura e Operações

1. **Orquestração de Produção (`docker-compose.prod.yml`):**
   - Rede interna dedicada (`partyhub-net`) isolando `backend` e `db` sem exposição de portas externas.
   - Exposição pública apenas do serviço `frontend` (Nginx nas portas `80`/`443` com TLS via Let's Encrypt/reverse proxy externo).
   - Estágio de produção no `backend/Dockerfile` executando sem `devDependencies` e sob usuário não-root.
2. **CI/CD (GitHub Actions):**
   - **CI (`ci.yml`):** lint (`backend` e `frontend`), testes de integração com serviço PostgreSQL real, `vite build`, build das imagens Docker e `npm audit`.
   - **CD (`cd.yml`):** publicação de imagens versionadas no `ghcr.io` e deploy automatizado com verificação de `/health` e rollback em caso de falha.
3. **Banco de Dados e Backup:**
   - Usuário de aplicação no PostgreSQL com privilégios mínimos (sem superusuário).
   - Controle de migrations aplicadas via tabela de histórico (ex.: `schema_migrations`) para evitar reexecução de scripts antigos quando evoluções alterarem dados.
   - Rotina agendada de backup (`pg_dump`) e testes periódicos de restauração.

---

## 3. Evolução Funcional (Pós-MVP)

- **Disponibilidade do fornecedor:** calendário de datas bloqueadas/ocupadas visível no catálogo antes mesmo da solicitação.
- **Busca avançada:** paginação, ordenação, busca georreferenciada por raio/cidade e múltiplos filtros combinados no PostgreSQL.
- **Notificações:** alertas por e-mail ou webhook/WhatsApp quando o cliente envia uma solicitação ou quando o fornecedor responde.
- **Comunicação e Fechamento:** chat interno vinculado à solicitação, envio de orçamentos estruturados, geração de contrato e pagamento (ex.: Pix).
- **Reputação e Pós-festa:** avaliações de fornecedores após festas com status `CONCLUIDA`.
- **Gestão do evento pelo cliente:** lista de convidados e confirmação de presença (RSVP).

---

## 4. Qualidade, Segurança e Observabilidade

- **Documentação interativa da API:** servir `docs/openapi.yaml` via Swagger UI em `/docs`.
- **Testes E2E:** suíte automatizada (ex.: Playwright) validando o fluxo completo Cliente ↔ Fornecedor em ambiente containerizado.
- **Observabilidade:** logs estruturados em JSON com correlação por requisição e métricas básicas de latência e taxa de erro.
- **Hardening da API:** *rate limiting* em rotas de autenticação (`/auth/login`, `/auth/registrar`), validação declarativa de payloads e rotação programada de `JWT_SECRET`.
