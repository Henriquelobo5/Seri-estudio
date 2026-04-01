# Como Rodar o Projeto - Guia Completo

Este guia ensina passo a passo como rodar o projeto Seri Studio. Não é complicado, basta seguir as instruções.

---

## Pré-requisitos

Você precisa ter instalado:

1. **Docker** - https://www.docker.com/products/docker-desktop
2. **Git** - https://git-scm.com/

É só isso! O Docker vai cuidar do resto (Node.js, Java, PostgreSQL, etc).

---

## Passo 1: Clonar o Repositório

Abra o terminal e execute:

```bash
git clone <URL_DO_REPOSITÓRIO>
cd pmg-es-2026-1-ti4-3126100-seri-estudio
```

---

## Passo 2: Navegar para a Pasta Backend

```bash
cd Codigo/backend
```

---

## Passo 3: Subir os Containers (ESTA É A PARTE IMPORTANTE)

Execute este comando:

```bash
docker-compose up -d --build
```

Isso vai:
- Baixar as imagens do Docker (primeira vez demora um pouco)
- Criar os containers do Backend e Banco de Dados
- Rodar automaticamente o seeder (cria os usuários de teste)

Aguarde até aparecer algo como:

```
Creating postgres-seriestudio ... done
Creating backend-seriestudio ... done
```

---

## Passo 4: Verificar se está Rodando

Execute:

```bash
docker ps
```

Você deve ver 2 containers rodando:
- `postgres-seriestudio` (Banco de Dados)
- `backend-seriestudio` (API Java)

Se algo tiver problema, veja os logs:

```bash
docker-compose logs -f
```

---

## Passo 5: Configurar o Frontend (Em Outra Aba do Terminal)

Em uma **nova aba** do terminal, navegue para a pasta frontend:

```bash
cd Codigo/frontend
```

Instale as dependências:

```bash
npm install
```

---

## Passo 6: Rodar o Frontend

Ainda na pasta frontend, execute:

```bash
npm run dev
```

Você verá algo como:

```
Local:   http://localhost:5173/
```

---

## Passo 7: Acessar a Aplicação

Abra seu navegador e acesse:

```
http://localhost:5173
```

Pronto! O projeto está rodando!

---

## Credenciais de Teste

Ao subir o container, dois usuários são criados automaticamente:

### Admin
- Email: `admin@seriestudio.com`
- Senha: `admin123`

### Cliente
- Email: `cliente@seriestudio.com`
- Senha: `cliente123`

Use qualquer um para fazer login.

---

## Parar de Rodar

Quando quiser parar tudo:

### Para o Backend:
```bash
# Na pasta backend
docker-compose down
```

### Para o Frontend:
Aperte `CTRL + C` no terminal onde está rodando

---

## Solução de Problemas

### "Porta 5432 já está em uso"
Alguém já está usando a porta do banco de dados.

Solução:
```bash
docker ps -a
docker rm <ID_DO_CONTAINER>
docker-compose up -d --build
```

### "Porta 8080 já está em uso"
O backend já está rodando em outro lugar.

Solução:
```bash
docker ps -a
docker rm <ID_DO_CONTAINER>
docker-compose up -d --build
```

### "npm: command not found"
Você não tem Node.js instalado.

Solução: Instale do site https://nodejs.org/

### Backend conecta mas frontend não consegue chamar a API
Certifique-se que o backend está rodando:

```bash
docker ps
```

Se não estiver, volte ao passo 3.

---

## Resumo dos Comandos Úteis

```bash
# Subir tudo
docker-compose up -d --build

# Ver containers rodando
docker ps

# Ver logs
docker-compose logs -f

# Parar tudo
docker-compose down

# Parar e remover tudo (incluindo volumes)
docker-compose down -v

# Limpar cache de imagens
docker system prune
```

---

## Arquitetura do Projeto

```
Frontend (React + Vite)
    ↓
    http://localhost:5173
    
Backend (Java Spring Boot)
    ↓
    http://localhost:8080
    
Banco de Dados (PostgreSQL)
    ↓
    localhost:5432
```

---

## E se ainda assim não funcionar?

1. Verifique se Docker está instalado: `docker --version`
2. Verifique se Docker está rodando (abra o Docker Desktop)
3. Limpe tudo e comece de novo: `docker-compose down -v && docker-compose up -d --build`
4. Pergunte para o pessoal do grupo ou abra uma issue no repositório

---

## Pronto!

Agora é só codar! Boa sorte! 🚀
