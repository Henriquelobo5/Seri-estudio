package com.seriestudio.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "portfolio")
public class Portfolio {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idItem;

    private String titulo;
    private String descricaoTecnica;
    private String urlImagem;
    private String categoria;

    @ManyToOne
    @JoinColumn(name = "id_admin")
    private usuario.Administrador administrador;

    // Getters e setters
}
