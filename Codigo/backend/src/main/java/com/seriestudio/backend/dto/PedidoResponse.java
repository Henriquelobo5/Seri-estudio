package com.seriestudio.backend.dto;

import java.time.LocalDateTime;

public class PedidoResponse {
    public Long id;
    public String statusAtual;
    public String etapaProducao;
    public LocalDateTime dataAbertura;
    public String quantidades;
    public String observacoes;
    public String clienteNome;
    public String clienteEmail;
    public FichaTecnicaResponse fichaTecnica;

    public PedidoResponse(
            Long id,
            String statusAtual,
            String etapaProducao,
            LocalDateTime dataAbertura,
            String quantidades,
            String observacoes,
            String clienteNome,
            String clienteEmail,
            FichaTecnicaResponse fichaTecnica
    ) {
        this.id = id;
        this.statusAtual = statusAtual;
        this.etapaProducao = etapaProducao;
        this.dataAbertura = dataAbertura;
        this.quantidades = quantidades;
        this.observacoes = observacoes;
        this.clienteNome = clienteNome;
        this.clienteEmail = clienteEmail;
        this.fichaTecnica = fichaTecnica;
    }
}
