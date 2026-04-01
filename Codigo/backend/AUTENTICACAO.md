# Autenticação e Autorização - SérieStudio (Backend + Frontend)

## Visão Geral
Este projeto utiliza autenticação baseada em JWT (JSON Web Token) e autorização por papéis (roles) para proteger as rotas da API e também as telas no frontend.

Resumo geral:
- Backend valida credenciais, gera token e protege endpoints.
- Frontend integra login/cadastro, salva token e bloqueia acesso às páginas sem autenticação.

---

## Fluxo de Autenticação

1. **Cadastro**
   - Endpoint: `POST /auth/register`
   - Envie um JSON com os dados do usuário (nome, email, senha, tipoUsuario, etc).
   - Exemplo:
     ```json
     {
       "nome": "João",
       "email": "joao@email.com",
       "senha": "123456",
       "tipoUsuario": "CLIENTE"
     }
     ```
   - Para admin, envie também `nomeUsuario` e `nivelPermissao`.

2. **Login**
   - Endpoint: `POST /auth/login`
   - Envie um JSON com email e senha:
     ```json
     {
       "email": "joao@email.com",
       "senha": "123456"
     }
     ```
   - Resposta:
     ```json
     { "token": "<JWT_TOKEN_AQUI>" }
     ```

3. **Usando o Token**
   - Para acessar qualquer rota protegida, envie o token JWT no header:
     ```
     Authorization: Bearer <JWT_TOKEN_AQUI>
     ```

4. **Refresh de Token**
   - Endpoint: `POST /auth/refresh`
   - Envie o token antigo no corpo:
     ```json
     { "token": "<JWT_TOKEN_ANTIGO>" }
     ```
   - Resposta:
     ```json
     { "token": "<NOVO_JWT_TOKEN>" }
     ```

---

## Permissões e Papéis
- Existem dois tipos de usuário: `ADMIN` e `CLIENTE`.
- Apenas usuários com papel `ADMIN` podem acessar rotas que começam com `/admin/**`.
- Exemplo de proteção:
  - `GET /admin/usuarios` → só ADMIN acessa
  - `GET /pedidos` → qualquer usuário autenticado acessa

---

## Resumo dos Endpoints
- `POST /auth/register` — Cadastro de usuário
- `POST /auth/login` — Login e obtenção do token JWT
- `POST /auth/refresh` — Renovação do token JWT
- Qualquer outra rota: **exige token JWT válido**
- Rotas `/admin/**`: **exigem token de ADMIN**

---

## Implementação no Frontend (já contemplada)

### 1) Cadastro integrado
- Tela de cadastro envia `POST /auth/register`.
- Após cadastro com sucesso, o frontend faz login automático e redireciona para a área autenticada.

### 2) Login integrado
- Tela de login envia `POST /auth/login`.
- O token JWT retornado é salvo no `localStorage`.

### 3) Redirecionamento após autenticação
- Login/cadastro com sucesso redirecionam para a tela principal autenticada (dashboard).

### 4) Header Authorization automático
- Requisições protegidas enviam automaticamente:
  `Authorization: Bearer <token>`

### 5) Guard de rota (proteção de telas)
- Se o usuário tentar acessar qualquer página protegida sem token válido:
  - a tela protegida **não renderiza**;
  - o usuário é redirecionado imediatamente para `/login`.

### 6) Token inválido/expirado
- O frontend valida o token (incluindo expiração via `exp` do JWT).
- Se token estiver inválido/expirado, remove autenticação local e trata como não logado.

### 7) Guard inverso para páginas públicas
- Se o usuário já estiver logado e tentar abrir `/login` ou `/cadastro`, ele é redirecionado para o dashboard.

### 8) Logout
- No logout, o token é removido do `localStorage`.
- Usuário é redirecionado para `/login`.

### 9) Validações no frontend
- Login: valida e-mail e senha mínima.
- Cadastro: valida nome mínimo, e-mail válido e senha mínima.

---

## Dicas
- Sempre envie o token JWT no header Authorization para acessar rotas protegidas.
- O token expira em 24h. Use o refresh para renovar.
- Se der erro 403 ou 401, provavelmente o token está ausente, inválido ou você não tem permissão.

---

## TL;DR
1. Cadastre-se em `/auth/register`.
2. Faça login em `/auth/login` e pegue o token.
3. O frontend salva o token e envia automaticamente no `Authorization`.
4. Sem login, páginas protegidas não renderizam e redirecionam para `/login`.
5. Se já estiver logado, `/login` e `/cadastro` redirecionam para dashboard.
6. Se for admin, pode acessar rotas `/admin/**`.
7. Se o token expirar, use `/auth/refresh`.

Pronto: autenticação e proteção estão ativas no backend e no frontend.
