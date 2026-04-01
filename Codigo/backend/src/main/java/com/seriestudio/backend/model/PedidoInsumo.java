package com.seriestudio.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "pedido_insumo")
@IdClass(PedidoInsumoId.class)
public class PedidoInsumo {
    @Id
    private Long idPed;
    @Id
    private Long idInsumo;
    private Integer quantidade;

    // Getters e setters
}
