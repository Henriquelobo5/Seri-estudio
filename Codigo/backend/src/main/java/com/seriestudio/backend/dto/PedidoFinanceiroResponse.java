package com.seriestudio.backend.dto;

import java.time.LocalDateTime;

public class PedidoFinanceiroResponse {
    public Long id;
    public String codigoDisplay;
    public String identificacao;
    public String clienteNome;
    public String quantidades;
    public String produtoTipo;
    public LocalDateTime dataAbertura;
    public FinanceiroResponse financeiro;

    public PedidoFinanceiroResponse(
            Long id,
            String codigoDisplay,
            String identificacao,
            String clienteNome,
            String quantidades,
            String produtoTipo,
            LocalDateTime dataAbertura,
            FinanceiroResponse financeiro
    ) {
        this.id = id;
        this.codigoDisplay = codigoDisplay;
        this.identificacao = identificacao;
        this.clienteNome = clienteNome;
        this.quantidades = quantidades;
        this.produtoTipo = produtoTipo;
        this.dataAbertura = dataAbertura;
        this.financeiro = financeiro;
    }
}
