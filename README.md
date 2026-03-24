<p align="center">
  <img src="Codigo/frontend/src/assets/images/logo.png" width="200"/>
</p>

# Seri.estudio

A Seri. é uma plataforma web de pedidos e gestão desenvolvida para um estúdio de serigrafia sob encomenda, com o objetivo de digitalizar e organizar todo o fluxo operacional do negócio desde o primeiro contato do cliente até a expedição do pedido. O sistema permite que o cliente monte sua própria ficha técnica, selecione produtos por categoria, faça upload de arquivos de arte e receba um código único de identificação, eliminando a dependência do WhatsApp como canal principal de pedidos.

Do lado do gestor, a plataforma oferece controle financeiro completo por encomenda, com registro de custos, cálculo automático de margem de lucro, controle de estoque e acompanhamento da produção em um fluxo Kanban com etapas de Corte, Estamparia, Costura, Revisão e Expedição. Com isso, o projeto transforma uma operação totalmente manual em um processo estruturado, profissional e escalável.

## Alunos integrantes da equipe

* Arthur Gonçalves Vieira
* Henrique Lobo Leite Neves
* Matheus Guilherme Viana Pereira
* Thiago Costa Soares
* Vinicius Oliveira Ramos

## Professores responsáveis

* Lucila Ishitani
* Soraia Lúcia da Silva

## Instruções de utilização

### Pré-requisitos

* Node.js instalado
* Java JDK 17 instalado
* VS Code (ou outra IDE)

### Frontend

1. Acesse a pasta do frontend:

```
cd Codigo/frontend
```

2. Instale as dependências:

```
npm install
```

3. Execute o projeto:

```
npm run dev
```

4. Acesse no navegador:

```
http://localhost:5173
```

### Backend

1. Acesse a pasta do backend:

```
cd Codigo/backend
```

2. Execute a aplicação:

```
.\mvnw.cmd spring-boot:run
```

3. A API estará disponível em:

```
http://localhost:8080
```

### Teste da API

Para testar o backend, acesse:

```
http://localhost:8080/pedido/teste
```

ou

```
http://localhost:8080/pedido/codigo
```

## Arquitetura do Sistema

O sistema foi estruturado seguindo uma arquitetura cliente-servidor, dividida em frontend e backend.

### Frontend

Desenvolvido com React, Vite e Tailwind CSS, responsável pela interface do usuário. A aplicação foi organizada em páginas, componentes reutilizáveis, serviços de comunicação com a API, gerenciamento de estado e utilitários, garantindo organização e escalabilidade.

### Backend

Desenvolvido com Spring Boot, seguindo arquitetura em camadas:

* Controller: responsável por receber requisições HTTP
* Service: responsável pelas regras de negócio
* Model: representação das entidades do sistema
* Repository: responsável pelo acesso a dados
* DTO: responsável pela transferência de dados entre camadas

Foram implementados endpoints iniciais para demonstrar o funcionamento da API, como a geração de código de pedido.

### Banco de Dados

O sistema utilizará PostgreSQL para persistência de dados.

### Comunicação

A comunicação entre frontend e backend é realizada por meio de APIs REST.
