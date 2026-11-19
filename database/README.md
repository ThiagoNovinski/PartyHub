# Camada de Banco de Dados — PartyHub

> **Responsável:** Banco de Dados  
> **SGBD:** PostgreSQL 16 (`postgres:16-alpine` via Docker)  
> **Status:** Estrutura completa implementada e validada (Sprints 1 e 2 concluídas).

---

## 1. Estrutura de Arquivos (`database/`)

```text
database/
├── migrations/
│   ├── 001_initial.sql                  # Criação das tabelas base (usuarios, categorias, fornecedores, fornecedorservicos) e carga inicial das categorias
│   └── 002_festas_e_solicitacoes.sql    # Criação das tabelas de negócio (festas, solicitacoes) e índices
├── seeds/
│   ├── 001_seed_inicial.sql             # Carga de categorias extras e usuários/fornecedores de teste
│   └── 002_seed_festas_solicitacoes.sql # Carga de festa exemplo e solicitações (cenários ACEITA e PENDENTE)
├── schemas/
│   └── queries_referencia.sql           # Consultas SQL parametrizadas de referência para as rotas do Back-end
├── diagrama-er.png                      # Diagrama Entidade-Relacionamento completo do banco
└── README.md                            # Esta documentação
```

---

## 2. Modelo Relacional Implementado

O diagrama visual completo encontra-se em [`database/diagrama-er.png`](./diagrama-er.png). Abaixo está o resumo das **6 tabelas** criadas:

1. **`usuarios`**: Cadastro unificado de usuários com restrição de perfil (`cliente` ou `fornecedor`) e e-mail único.
2. **`categorias`**: Lista fixa de categorias de serviço da plataforma (`Buffet`, `Bebidas`, `Decoração`, `Local`, `Segurança`, `Música`, `Fotografia`, além de categorias adicionais no seed inicial como `DJ`, `Equipe de Garçom`, `Sonorização`, `Iluminação`, `Bolo e Doces`, `Espaço`).
3. **`fornecedores`**: Perfil comercial vinculado `1:1` a um usuário fornecedor, contendo contatos, cidade e flag `ativo`.
4. **`fornecedorservicos`**: Relação `N:N` entre fornecedores e categorias atendidas, com descrição e preço de referência.
5. **`festas`**: Eventos cadastrados por clientes (`PLANEJANDO`, `CONCLUIDA`, `CANCELADA`).
6. **`solicitacoes`**: Representa a **stack da festa** e o ciclo de vida dos pedidos enviados aos fornecedores (`PENDENTE`, `ACEITA`, `RECUSADA`, `CANCELADA`).

---

## 3. Regras de Negócio e Integridade no Banco

Além da tipagem definida no projeto, o esquema PostgreSQL impõe garantias nativas para evitar inconsistências:

* **Unicidade de Serviços (`uk_fornecedor_categoria`):** Impede que um fornecedor cadastre a mesma categoria duas vezes.
* **Unicidade de Solicitações (`uk_festa_fornecedor_categoria`):** Impede pedidos duplicados para o mesmo fornecedor e categoria dentro da mesma festa.
* **Validação de Horários (`chk_festas_horario`):** Garante que `hora_fim` seja estritamente maior que `hora_inicio` quando ambos são informados.
* **Validação de Convidados:** Garante `qtd_convidados > 0`.
* **Consistência Temporal (`chk_solicitacoes_respondido_em`):** Garante que solicitações `PENDENTE` não possuam data de resposta (`respondido_em IS NULL`).
* **Preservação de Histórico (`ON DELETE RESTRICT`):** Bloqueia a exclusão física de usuários, festas, fornecedores, categorias ou solicitações vinculadas, forçando o cancelamento lógico via atualização de `status`.
* **Índices de Performance:** Criados índices específicos em chaves estrangeiras, `cidade`, `ativo`, `data` e índices compostos `(fornecedor_id, status)` para acelerar filtros de catálogo e painéis de pedidos.

---

## 4. Como Executar / Resetar o Banco via Docker

Com o container `partyhub-db` ativo na porta `5432` (`docker compose up -d`), as migrations são executadas automaticamente na subida do `backend` (`npm run migrate`). Caso queira rodar manualmente via `psql` a partir da raiz do projeto:

### Aplicar Migrations manualmente
```bash
docker compose exec -T db psql -U partyhub -d partyhub < database/migrations/001_initial.sql
docker compose exec -T db psql -U partyhub -d partyhub < database/migrations/002_festas_e_solicitacoes.sql
```

### Aplicar Seeds (Dados de Teste)
```bash
docker compose exec backend npm run seed
```
Ou diretamente via `psql`:
```bash
docker compose exec -T db psql -U partyhub -d partyhub < database/seeds/001_seed_inicial.sql
docker compose exec -T db psql -U partyhub -d partyhub < database/seeds/002_seed_festas_solicitacoes.sql
```

### Verificar Tabelas Criadas
```bash
docker compose exec db psql -U partyhub -d partyhub -c "\dt"
```

### Resetar o Banco do Zero (Caso necessário)
```bash
docker compose down -v
docker compose up -d
```

---

## 5. Massa de Dados Disponível (`seeds`)

Após rodar os seeds, o ambiente conta com dados de exemplo para testes de API e Front-end:

| Perfil | Nome | E-mail | Detalhes |
| --- | --- | --- | --- |
| `cliente` | Ana Cliente | `cliente@partyhub.com` | Possui a festa *"Aniversário de 7 anos do Pedro"* (`2026-12-12`) |
| `fornecedor` | Carlos DJ | `dj@partyhub.com` | Empresa **Carlos Som & DJ Pro** (DJ e Sonorização) — Solicitação **ACEITA** |
| `fornecedor` | Maria Buffet | `buffet@partyhub.com` | Empresa **Sabor & Festa Buffet** (Buffet) — Solicitação **PENDENTE** |

---

## 6. Nota para o Back-end

O arquivo [`database/schemas/queries_referencia.sql`](./schemas/queries_referencia.sql) contém consultas SQL parametrizadas (`$1`, `$2`) de referência para as rotas da API, cobrindo:
1. Listagem do catálogo público com filtros opcionais de categoria e cidade (`GET /fornecedores`).
2. Validação da regra **`SERVICO_NAO_OFERECIDO`** antes de criar uma solicitação (`POST /festas/:id/solicitacoes`).
3. Validação da regra **`DATA_OCUPADA`** antes de aceitar uma festa (`PATCH /solicitacoes/:id/responder`).
4. Transação atômica para cancelamento lógico da festa e suas solicitações pendentes (`PATCH /festas/:id/cancelar`).
