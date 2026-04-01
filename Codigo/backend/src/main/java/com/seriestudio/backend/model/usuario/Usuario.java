package com.seriestudio.backend.model.usuario;

import jakarta.persistence.*;

@Entity
@Table(name = "usuario")
@Inheritance(strategy = InheritanceType.JOINED)
public class Usuario {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idUsuario;

    private String nome;
    private String email;
    private String senhaHash;
    private String tipoUsuario; // ADMIN ou CLIENTE
    private Integer nivelPermissao;

    // Getters e setters
}
