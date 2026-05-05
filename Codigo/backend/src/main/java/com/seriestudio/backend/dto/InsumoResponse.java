package com.seriestudio.backend.dto;

public class InsumoResponse {
    public Long idInsumo;
    public String nomeItem;
    public String categoria;
    public Integer qtdEstoque;
    public Integer qtdMinima;
    public String unidadeMedida;
    public Double precoUnitario;
    public Double consumoPorPeca;
    public String status;

    public InsumoResponse(
            Long idInsumo,
            String nomeItem,
            String categoria,
            Integer qtdEstoque,
            Integer qtdMinima,
            String unidadeMedida,
            Double precoUnitario,
            Double consumoPorPeca,
            String status
    ) {
        this.idInsumo = idInsumo;
        this.nomeItem = nomeItem;
        this.categoria = categoria;
        this.qtdEstoque = qtdEstoque;
        this.qtdMinima = qtdMinima;
        this.unidadeMedida = unidadeMedida;
        this.precoUnitario = precoUnitario;
        this.consumoPorPeca = consumoPorPeca;
        this.status = status;
    }
}
