# Manual do Usuário — PartyHub

Guia passo a passo para utilizar a aplicação web do **PartyHub** nos perfis **Cliente** e **Fornecedor**.

---

## 1. Acesso e Catálogo Público

1. Acesse a aplicação no navegador (`http://localhost:5173` em desenvolvimento ou `http://localhost` via Nginx em produção).
2. A tela inicial exibe o **Catálogo de Fornecedores** (`/catalogo`), acessível mesmo sem login.
3. Você pode filtrar fornecedores ativos por:
   - **Categoria** (ex.: `Buffet`, `Bebidas`, `Decoração`, `Local`, `Segurança`, `Música`, `Fotografia`)
   - **Cidade / Local** (busca parcial sem distinção de maiúsculas ou acentos)
4. Clique em **Ver detalhes e contatos** para abrir a página do fornecedor (`/fornecedores/:id`) e visualizar telefone, WhatsApp, e-mail e lista completa de serviços.

---

## 2. Cadastro e Login

### Criar conta (`/cadastro`)
1. No menu superior, clique em **Cadastro**.
2. Preencha:
   - **Nome**
   - **E-mail**
   - **Telefone** (opcional)
   - **Senha** (mínimo de 6 caracteres)
   - **Perfil**: escolha **Cliente (organizo festas)** ou **Fornecedor (ofereço serviços)**
3. Clique em **Cadastre-se**. Você será autenticado automaticamente e redirecionado para a área do seu perfil.

### Entrar (`/login`)
1. No menu superior, clique em **Entrar**.
2. Informe seu **E-mail** e **Senha** e clique em **Entrar**.

---

## 3. Fluxo do Fornecedor

Após entrar com uma conta `fornecedor`, o menu superior exibe **Meu Perfil e Serviços** e **Pedidos Recebidos**.

### Configurar Perfil e Serviços (`/fornecedor/perfil`)
1. Em **Dados da empresa**, preencha **Nome da empresa** (obrigatório), **Telefone de contato** (obrigatório), WhatsApp, e-mail de contato, cidade e descrição.
2. Clique em **Criar perfil de fornecedor** (ou **Atualizar perfil**).
3. Em **Serviços que entrego**:
   - Escolha uma **Categoria**, informe o **Preço de referência** (opcional, ex.: `a partir de R$ 800`) e a **Descrição** do que entrega.
   - Clique em **Adicionar serviço**.
   - Use os botões **Editar** ou **Remover** em cada item para atualizar ou excluir serviços.
4. **Visibilidade no catálogo:** um fornecedor só aparece no catálogo público quando está com status **Ativo** e possui **ao menos 1 serviço** cadastrado. Para pausar o recebimento de novos pedidos sem perder o histórico, clique em **Desativar perfil**.

### Gerenciar Pedidos Recebidos (`/fornecedor/pedidos`)
1. Acesse **Pedidos Recebidos**.
2. Use o filtro **Filtrar por status** (`Todos`, `PENDENTE`, `ACEITA`, `RECUSADA`, `CANCELADA`).
3. Para cada solicitação, você verá os detalhes da festa (título, data, horário, local, convidados, tema) e os **contatos do cliente** (nome, telefone e e-mail).
4. Combine os detalhes diretamente com o cliente por telefone ou WhatsApp fora da plataforma.
5. De volta à tela, preencha uma **Observação/resposta** (opcional) e clique em **Aceitar** ou **Recusar**.
   - **Regra de agenda:** se você já tiver outra festa **ACEITA** na mesma data, a plataforma bloqueará o aceite informando o conflito (`DATA_OCUPADA`).

---

## 4. Fluxo do Cliente

Após entrar com uma conta `cliente`, o menu superior exibe **Minhas Festas**.

### Cadastrar e Listar Festas (`/festas`)
1. Acesse **Minhas Festas**.
2. No formulário **Cadastrar nova festa**, preencha:
   - **Título** (obrigatório)
   - **Data** (obrigatório)
   - **Hora de início** e **Hora de término** em formato **24 horas (`HH:MM`)** (obrigatórios; o término deve ser posterior ao início)
   - **Local**, **Quantidade de convidados**, **Tema** e **Observações** (opcionais)
3. Clique em **Criar festa**.
4. Na lista abaixo, você pode clicar em **Abrir stack da festa e solicitações** ou em **Cancelar festa**.

### Montar a Stack da Festa e Solicitar Contato (`/festas/:id`)
1. Na tela da festa, você pode visualizar ou clicar em **Editar festa** para alterar informações ou marcar o status como `CONCLUIDA`.
2. Na seção **Stack da Festa (Categorias de serviço)**:
   - Selecione uma categoria desejada e clique em **Adicionar e buscar fornecedores** (ou clique em **Buscar fornecedores** em uma categoria já listada).
   - Opcionalmente, filtre por **Cidade / Local** ou clique em **Usar local da festa** para encontrar prestadores daquela região.
   - Para o fornecedor escolhido, escreva uma mensagem opcional e clique em **Solicitar contato**.
   - *(Alternativa)* Você também pode solicitar contato diretamente pela página de detalhes de um fornecedor (`/fornecedores/:id`), selecionando a festa desejada.
3. Na seção **Solicitações da festa**, acompanhe o status de cada pedido (`PENDENTE`, `ACEITA`, `RECUSADA`, `CANCELADA`), os contatos do fornecedor e eventual resposta registrada por ele.
4. Enquanto uma solicitação estiver `PENDENTE`, você pode cancelá-la clicando em **Cancelar solicitação**.
5. Caso precise cancelar todo o evento, clique em **Cancelar festa** — todas as solicitações `PENDENTE` serão canceladas automaticamente, preservando o registro das que já foram `ACEITA`.
