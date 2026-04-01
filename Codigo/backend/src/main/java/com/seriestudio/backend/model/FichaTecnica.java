package com.seriestudio.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "ficha_tecnica")
public class FichaTecnica {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long codUnico;

    private String produtoTipo;
    private String especificacoes;
    private String urlArte;

    @ManyToOne
    @JoinColumn(name = "id_cli")
    private usuario.Cliente cliente;

    // Getters e setters
}
