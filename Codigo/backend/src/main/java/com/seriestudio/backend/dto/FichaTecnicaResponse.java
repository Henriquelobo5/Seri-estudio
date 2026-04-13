package com.seriestudio.backend.dto;

import java.time.LocalDateTime;

public class FichaTecnicaResponse {
    public Long id;
    public String codigoDisplay;
    public String identificacao;
    public String produtoTipo;
    public String especificacoes;
    public String urlArte;
    public LocalDateTime dataAbertura;

    public FichaTecnicaResponse(Long id, String codigoDisplay, String identificacao,
                                 String produtoTipo, String especificacoes,
                                 String urlArte, LocalDateTime dataAbertura) {
        this.id = id;
        this.codigoDisplay = codigoDisplay;
        this.identificacao = identificacao;
        this.produtoTipo = produtoTipo;
        this.especificacoes = especificacoes;
        this.urlArte = urlArte;
        this.dataAbertura = dataAbertura;
    }
}
