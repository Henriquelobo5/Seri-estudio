package com.seriestudio.backend.model;

import com.seriestudio.backend.model.usuario.Cliente;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "ficha_tecnica")
@Getter
@Setter
public class FichaTecnica {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long codUnico;

    private String produtoTipo;
    private String especificacoes;
    private String urlArte;

    @ManyToOne
    @JoinColumn(name = "id_cli")
    private Cliente cliente;
}
