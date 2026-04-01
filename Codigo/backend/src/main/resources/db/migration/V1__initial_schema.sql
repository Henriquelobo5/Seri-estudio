-- Criação das tabelas iniciais com papéis de usuário

CREATE TABLE usuario (
    id_usuario SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    tipo_usuario VARCHAR(20) NOT NULL, -- 'ADMIN' ou 'CLIENTE'
    nivel_permissao INTEGER
);

CREATE TABLE cliente (
    id_cli INTEGER PRIMARY KEY,
    cpf_cnpj VARCHAR(20) NOT NULL,
    whatsapp VARCHAR(20),
    endereco VARCHAR(255),
    FOREIGN KEY (id_cli) REFERENCES usuario(id_usuario)
);

CREATE TABLE administrador (
    id_admin INTEGER PRIMARY KEY,
    nome_usuario VARCHAR(100) NOT NULL,
    nivel_permissao INTEGER,
    FOREIGN KEY (id_admin) REFERENCES usuario(id_usuario)
);

CREATE TABLE ficha_tecnica (
    cod_unico SERIAL PRIMARY KEY,
    produto_tipo VARCHAR(100),
    especificacoes TEXT,
    url_arte VARCHAR(255),
    id_cli INTEGER,
    FOREIGN KEY (id_cli) REFERENCES cliente(id_cli)
);

CREATE TABLE pedido (
    id_ped SERIAL PRIMARY KEY,
    data_abertura TIMESTAMP NOT NULL,
    status_atual VARCHAR(50),
    cod_unico INTEGER,
    id_admin INTEGER,
    id_cli INTEGER,
    FOREIGN KEY (cod_unico) REFERENCES ficha_tecnica(cod_unico),
    FOREIGN KEY (id_admin) REFERENCES administrador(id_admin),
    FOREIGN KEY (id_cli) REFERENCES cliente(id_cli)
);

CREATE TABLE etapa_producao (
    id_etapa SERIAL PRIMARY KEY,
    nome_fase VARCHAR(100),
    data_inicio TIMESTAMP,
    previsao_fim TIMESTAMP,
    status_fase VARCHAR(50),
    id_ped INTEGER,
    FOREIGN KEY (id_ped) REFERENCES pedido(id_ped)
);

CREATE TABLE insumo (
    id_insumo SERIAL PRIMARY KEY,
    nome_item VARCHAR(100),
    qtd_estoque INTEGER,
    unidade_medida VARCHAR(20)
);

CREATE TABLE pedido_insumo (
    id_ped INTEGER,
    id_insumo INTEGER,
    quantidade INTEGER,
    PRIMARY KEY (id_ped, id_insumo),
    FOREIGN KEY (id_ped) REFERENCES pedido(id_ped),
    FOREIGN KEY (id_insumo) REFERENCES insumo(id_insumo)
);

CREATE TABLE financeiro (
    id_financeiro SERIAL PRIMARY KEY,
    id_ped INTEGER,
    custo_material NUMERIC(12,2),
    custo_mo NUMERIC(12,2),
    custo_manutencao NUMERIC(12,2),
    valor_venda NUMERIC(12,2),
    lucro_liquido NUMERIC(12,2),
    FOREIGN KEY (id_ped) REFERENCES pedido(id_ped)
);

CREATE TABLE portfolio (
    id_item SERIAL PRIMARY KEY,
    titulo VARCHAR(100),
    descricao_tecnica TEXT,
    url_imagem VARCHAR(255),
    categoria VARCHAR(50),
    id_admin INTEGER,
    FOREIGN KEY (id_admin) REFERENCES administrador(id_admin)
);
