package com.seriestudio.backend.model.usuario;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "administrador")
@Getter
@Setter
public class Administrador extends Usuario {
    private String nomeUsuario;
    private Integer nivelPermissao;
}
