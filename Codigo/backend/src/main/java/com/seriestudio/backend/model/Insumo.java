package com.seriestudio.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "insumo")
public class Insumo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idInsumo;

    private String nomeItem;
    private Integer qtdEstoque;
    private String unidadeMedida;

    // Getters e setters
}
