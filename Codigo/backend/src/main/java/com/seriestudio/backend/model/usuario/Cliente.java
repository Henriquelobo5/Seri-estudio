package com.seriestudio.backend.model.usuario;

import jakarta.persistence.*;

@Entity
@Table(name = "cliente")
public class Cliente extends Usuario {
    private String cpfCnpj;
    private String whatsapp;
    private String endereco;

    // Getters e setters
}
