package com.seriestudio.backend.dto.dashboard;

import java.time.LocalDateTime;

public class AtividadeRecenteResponse {
    public String tipo;
    public String descricao;
    public LocalDateTime dataHora;

    public AtividadeRecenteResponse(String tipo, String descricao, LocalDateTime dataHora) {
        this.tipo = tipo;
        this.descricao = descricao;
        this.dataHora = dataHora;
    }
}
