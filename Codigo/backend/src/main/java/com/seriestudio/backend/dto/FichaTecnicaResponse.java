package com.seriestudio.backend.dto;

import java.time.LocalDateTime;

public class FichaTecnicaResponse {
    public Long codUnico;
    public String codigoDisplay;
    public String identificacao;
    public String produtoTipo;
    public String especificacoes;
    public String urlArte;
    public String urlPreview;
    public LocalDateTime dataAbertura;

    public FichaTecnicaResponse(Long codUnico, String codigoDisplay, String identificacao,
                                 String produtoTipo, String especificacoes,
                                 String urlArte, String urlPreview, LocalDateTime dataAbertura) {
        this.codUnico = codUnico;
        this.codigoDisplay = codigoDisplay;
        this.identificacao = identificacao;
        this.produtoTipo = produtoTipo;
        this.especificacoes = especificacoes;
        this.urlArte = urlArte;
        this.urlPreview = urlPreview;
        this.dataAbertura = dataAbertura;
    }
}
