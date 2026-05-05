package com.seriestudio.backend.model;

import com.seriestudio.backend.model.usuario.Administrador;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "movimentacao_estoque")
@Getter
@Setter
public class MovimentacaoEstoque {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idMovimentacao;

    private String tipo;
    private Integer quantidade;
    private Double quantidadeReal;

    @Column(columnDefinition = "TEXT")
    private String motivo;

    private LocalDateTime dataHora;
    private Integer qtdAposMovimentacao;

    @ManyToOne
    @JoinColumn(name = "id_insumo")
    private Insumo insumo;

    @ManyToOne
    @JoinColumn(name = "id_admin")
    private Administrador administrador;
}
