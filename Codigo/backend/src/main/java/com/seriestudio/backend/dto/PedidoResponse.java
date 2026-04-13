package com.seriestudio.backend.dto;

import java.time.LocalDateTime;

public class PedidoResponse {
    public Long id;
    public String statusAtual;
    public LocalDateTime dataAbertura;
    public String quantidades;
    public String observacoes;
    public FichaTecnicaResponse fichaTecnica;

    public PedidoResponse(Long id, String statusAtual, LocalDateTime dataAbertura,
                           String quantidades, String observacoes,
                           FichaTecnicaResponse fichaTecnica) {
        this.id = id;
        this.statusAtual = statusAtual;
        this.dataAbertura = dataAbertura;
        this.quantidades = quantidades;
        this.observacoes = observacoes;
        this.fichaTecnica = fichaTecnica;
    }
}
