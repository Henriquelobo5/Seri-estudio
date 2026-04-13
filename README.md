<p align="center">
  <img src="Codigo/frontend/src/assets/images/logo.png" width="180" alt="Logo Seri.estudio" />
</p>

# Seri.Estudio

Seri.estudio e uma plataforma web desenvolvida para digitalizar o fluxo de pedidos de um estudio de serigrafia sob encomenda. O sistema permite que o cliente monte sua ficha tecnica, envie a arte, acompanhe o pedido e centralize a comunicacao que antes acontecia de forma manual.

## Equipe

- Arthur Goncalves Vieira
- Henrique Lobo Leite Neves
- Matheus Guilherme Viana Pereira
- Thiago Costa Soares
- Vinicius Oliveira Ramos

## Professores responsaveis

- Lucila Ishitani
- Soraia Lucia da Silva

## Estrutura do repositorio

- `Artefatos/`: diagramas, requisitos e wireframes
- `Codigo/backend/`: API em Spring Boot
- `Codigo/frontend/`: interface web em React + Vite
- `Documentacao/`: documentos do projeto e registros formais
- `Divulgacao/`: apresentacao e materiais de divulgacao

## Artefatos da segunda entrega

### Planejamento da sprint

- O planejamento da sprint deve ser registrado em ferramenta externa do grupo, como Trello, GitHub Projects ou equivalente. Este repositorio nao possui esse link versionado ate o momento.

### Diagramas e requisitos

- Caso de uso: `Artefatos/DiagramaDeCasosDeUso (1).png`
- Diagrama ER: `Artefatos/Diagrama de Entidades e Relacionamentos.png`
- Requisitos: `Artefatos/Requisitos-seri-estudio.pdf`

### Prototipos de tela

- Wireframes gerais: `Artefatos/Wireframes/`
- Telas disponiveis: Home, Login, Cadastro, Portfolio, Construtor Ficha Tecnica, Detalhes do Produto, Detalhes do Pedido, Meus Pedidos, Minha Conta e telas administrativas.

### Atas e documentos com o cliente

- Documento principal do projeto: `Documentacao/SeriEstudio.pdf`
- Ata de acordo inicial com cliente: `Documentacao/AtaAcordoInicial-ComClienteExterno-Manha_assinado_assinado_assinado_29_assinado_assinado_assinado.pdf`
- Termo de sigilo: `Documentacao/Termo_de_Sigilo_e_Confidencialidade_29_assinado_assinado.pdf`
- Procuracao NIT PUC Minas: `Documentacao/PROCURACAO_NIT_PUC_MINAS__assinado.pdf`
- Pasta de atas: `Documentacao/Ata/`

### Apresentacao

- Apresentacao da entrega: `Divulgacao/Apresentacao/TI4 - Seri Estudio (1).pdf`

## Implementacao atual

### Frontend

- React 18
- TypeScript
- Vite
- React Router

### Backend

- Java 21
- Spring Boot 3
- Spring Security
- Spring Data JPA
- PostgreSQL

## Funcionalidades implementadas

- Home publica com apresentacao do estudio
- Portfolio de produtos
- Cadastro e login de usuario
- Construtor de ficha tecnica
- Fluxo de detalhes do produto e detalhes do pedido
- Area de meus pedidos
- API para autenticacao, ficha tecnica e pedidos

## Como rodar o projeto

### Pre-requisitos

- Docker Desktop
- Node.js 18 ou superior
- npm
- Java 21

### Opcao recomendada: banco em Docker e backend local

1. Abra um terminal na raiz do projeto.
2. Suba o banco de dados:

```powershell
cd Codigo/backend
docker compose up -d db
```

3. No mesmo terminal, configure as variaveis de ambiente do backend:

```powershell
$env:SPRING_DATASOURCE_URL="jdbc:postgresql://localhost:5432/seriestudio"
$env:SPRING_DATASOURCE_USERNAME="seriestudio"
$env:SPRING_DATASOURCE_PASSWORD="seriestudio"
```

4. Rode o backend:

```powershell
.\mvnw.cmd spring-boot:run
```

5. Em outro terminal, rode o frontend:

```powershell
cd Codigo/frontend
npm install
npm run dev
```

### Opcao alternativa: backend e banco em containers

Se preferir subir o backend inteiro pelo Docker:

```powershell
cd Codigo/backend
docker compose up -d --build
```

Depois, em outro terminal:

```powershell
cd Codigo/frontend
npm install
npm run dev
```

## URLs de execucao

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`
- PostgreSQL: `localhost:5432`

## Endpoints uteis para teste

- API online: `http://localhost:8080/`
- Teste rapido do backend: `http://localhost:8080/pedido/teste`
- Geracao de codigo de pedido: `http://localhost:8080/pedido/codigo`

## Autenticacao

- Nao ha credenciais padrao documentadas no repositorio.
- Para testar a area autenticada, crie uma conta pela tela de cadastro do frontend.
- Endpoints principais:
  - `POST /auth/register`
  - `POST /auth/login`
  - `POST /auth/refresh`

## Observacoes importantes

- O arquivo `application.properties` do backend usa variaveis de ambiente para conexao com o banco. Nao e necessario editar esse arquivo para rodar localmente.
- O projeto esta configurado com `spring.jpa.hibernate.ddl-auto=create`, entao a estrutura do banco pode ser recriada ao reiniciar o backend.
- Se o Docker Desktop nao iniciar no Windows por causa do WSL, atualize com:

```powershell
wsl --update
wsl --shutdown
```

## Organizacao do codigo

### Frontend

- `Codigo/frontend/src/pages/`: paginas da aplicacao
- `Codigo/frontend/src/components/`: componentes reutilizaveis
- `Codigo/frontend/src/context/`: contexto de autenticacao
- `Codigo/frontend/src/routes/`: definicao de rotas

### Backend

- `Codigo/backend/src/main/java/com/seriestudio/backend/controller/`: controllers REST
- `Codigo/backend/src/main/java/com/seriestudio/backend/service/`: regras de negocio
- `Codigo/backend/src/main/java/com/seriestudio/backend/repository/`: acesso a dados
- `Codigo/backend/src/main/java/com/seriestudio/backend/model/`: entidades
- `Codigo/backend/src/main/java/com/seriestudio/backend/dto/`: objetos de transferencia

## Organizacao para avaliacao

- Implementacao da sprint: `Codigo/frontend/` e `Codigo/backend/`
- Diagramas e prototipos: `Artefatos/`
- Documentacao atualizada: `Documentacao/`
- Apresentacao: `Divulgacao/Apresentacao/`

