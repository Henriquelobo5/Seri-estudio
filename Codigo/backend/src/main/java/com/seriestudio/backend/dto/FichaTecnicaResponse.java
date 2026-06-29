package com.seriestudio.backend.dto;

import java.time.LocalDateTime;

public class FichaTecnicaResponse {
    public Long codUnico;
    public String codigoDisplay;
    public String identificacao;
    public String produtoTipo;
    public String especificacoes;
    public String cor;
    public String urlArte;
    public String urlPreview;
    public String artesPorPecaJson;
    public LocalDateTime dataAbertura;

    public FichaTecnicaResponse(Long codUnico, String codigoDisplay, String identificacao,
                                 String produtoTipo, String especificacoes, String cor,
                                 String urlArte, String urlPreview,
                                 String artesPorPecaJson, LocalDateTime dataAbertura) {
        this.codUnico = codUnico;
        this.codigoDisplay = codigoDisplay;
        this.identificacao = identificacao;
        this.produtoTipo = produtoTipo;
        this.especificacoes = especificacoes;
        this.cor = cor;
        this.urlArte = urlArte;
        this.urlPreview = urlPreview;
        this.artesPorPecaJson = artesPorPecaJson;
        this.dataAbertura = dataAbertura;
    }
}
