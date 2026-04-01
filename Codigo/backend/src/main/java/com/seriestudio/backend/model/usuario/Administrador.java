package com.seriestudio.backend.model.usuario;

import jakarta.persistence.*;

@Entity
@Table(name = "administrador")
public class Administrador extends Usuario {
    private String nomeUsuario;
    private Integer nivelPermissao;

    // Getters e setters
}
