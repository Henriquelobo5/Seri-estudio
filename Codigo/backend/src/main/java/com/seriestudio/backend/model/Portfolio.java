package com.seriestudio.backend.model;

import com.seriestudio.backend.model.usuario.Administrador;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "portfolio")
@Getter
@Setter
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
    private Administrador administrador;
}
