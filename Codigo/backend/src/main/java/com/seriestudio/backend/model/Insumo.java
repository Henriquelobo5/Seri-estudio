package com.seriestudio.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "insumo")
@Getter
@Setter
public class Insumo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idInsumo;

    private String nomeItem;
    private String categoria;
    private Integer qtdEstoque;
    private Integer qtdMinima;
    private String unidadeMedida;
    private Double precoUnitario;
    private Double consumoPorPeca;
}
