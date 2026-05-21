package com.seriestudio.backend.dto.dashboard;

import java.time.LocalDate;

public class PedidosPorDiaItem {
    public String label;
    public LocalDate data;
    public int quantidade;

    public PedidosPorDiaItem(String label, LocalDate data, int quantidade) {
        this.label = label;
        this.data = data;
        this.quantidade = quantidade;
    }
}
