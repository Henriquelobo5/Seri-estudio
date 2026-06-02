CREATE TABLE notificacao_whatsapp (
    id_notificacao SERIAL PRIMARY KEY,
    id_ped INTEGER NOT NULL,
    destinatario VARCHAR(30) NOT NULL,
    tipo VARCHAR(60) NOT NULL,
    mensagem TEXT NOT NULL,
    status VARCHAR(30) NOT NULL,
    etapa_producao VARCHAR(50),
    tentativas INTEGER NOT NULL DEFAULT 0,
    provider_message_id VARCHAR(120),
    erro TEXT,
    criado_em TIMESTAMP NOT NULL,
    enviado_em TIMESTAMP,
    FOREIGN KEY (id_ped) REFERENCES pedido(id_ped)
);

CREATE INDEX idx_notificacao_whatsapp_pedido ON notificacao_whatsapp(id_ped);
CREATE INDEX idx_notificacao_whatsapp_tipo_etapa ON notificacao_whatsapp(id_ped, tipo, etapa_producao);
