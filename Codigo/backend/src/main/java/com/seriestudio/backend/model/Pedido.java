package com.seriestudio.backend.model;

import com.seriestudio.backend.model.usuario.Administrador;
import com.seriestudio.backend.model.usuario.Cliente;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "pedido")
@Getter
@Setter
public class Pedido {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idPed;

    private LocalDateTime dataAbertura;
    private String statusAtual;
    private String quantidades;
    @Column(columnDefinition = "TEXT")
    private String observacoes;

    @ManyToOne
    @JoinColumn(name = "cod_unico")
    private FichaTecnica fichaTecnica;

    @ManyToOne
    @JoinColumn(name = "id_admin")
    private Administrador administrador;

    @ManyToOne
    @JoinColumn(name = "id_cli")
    private Cliente cliente;
}