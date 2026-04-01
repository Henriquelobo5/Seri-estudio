package com.seriestudio.backend.model.usuario;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "cliente")
@Getter
@Setter
public class Cliente extends Usuario {
    private String cpfCnpj;
    private String whatsapp;
    private String endereco;
}
