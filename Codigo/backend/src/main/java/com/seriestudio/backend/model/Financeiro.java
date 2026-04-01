package com.seriestudio.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "financeiro")
public class Financeiro {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idFinanceiro;

    private Double custoMaterial;
    private Double custoMo;
    private Double custoManutencao;
    private Double valorVenda;
    private Double lucroLiquido;

    @OneToOne
    @JoinColumn(name = "id_ped")
    private Pedido pedido;

    // Getters e setters
}
