package com.seriestudio.backend.dto;

import java.time.LocalDateTime;

public class MovimentacaoResponse {
    public Long idMovimentacao;
    public String tipo;
    public Integer quantidade;
    public Double quantidadeReal;
    public String motivo;
    public LocalDateTime dataHora;
    public Integer qtdAposMovimentacao;
    public Long idInsumo;
    public String insumoNome;
    public String administradorNome;

    public MovimentacaoResponse(
            Long idMovimentacao,
            String tipo,
            Integer quantidade,
            Double quantidadeReal,
            String motivo,
            LocalDateTime dataHora,
            Integer qtdAposMovimentacao,
            Long idInsumo,
            String insumoNome,
            String administradorNome
    ) {
        this.idMovimentacao = idMovimentacao;
        this.tipo = tipo;
        this.quantidade = quantidade;
        this.quantidadeReal = quantidadeReal;
        this.motivo = motivo;
        this.dataHora = dataHora;
        this.qtdAposMovimentacao = qtdAposMovimentacao;
        this.idInsumo = idInsumo;
        this.insumoNome = insumoNome;
        this.administradorNome = administradorNome;
    }
}
