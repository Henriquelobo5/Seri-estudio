package com.seriestudio.backend.dto;

public class FinanceiroResponse {
    public Long id;
    public Double custoMaterial;
    public Double custoEstamparia;
    public Double custoMo;
    public Double custoManutencao;
    public Double valorVenda;
    public Double lucroLiquido;

    public FinanceiroResponse(
            Long id,
            Double custoMaterial,
            Double custoEstamparia,
            Double custoMo,
            Double custoManutencao,
            Double valorVenda,
            Double lucroLiquido
    ) {
        this.id = id;
        this.custoMaterial = custoMaterial;
        this.custoEstamparia = custoEstamparia;
        this.custoMo = custoMo;
        this.custoManutencao = custoManutencao;
        this.valorVenda = valorVenda;
        this.lucroLiquido = lucroLiquido;
    }
}
