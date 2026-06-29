package com.seriestudio.backend.model;

import com.seriestudio.backend.model.usuario.Cliente;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "ficha_tecnica")
@Getter
@Setter
public class FichaTecnica {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long codUnico;

    private String identificacao;
    private String codigoDisplay;
    @Column(columnDefinition = "TEXT")
    private String produtoTipo;
    @Column(columnDefinition = "TEXT")
    private String especificacoes;
    private String urlArte;
    private String urlPreview;
    @Column(columnDefinition = "TEXT")
    private String artesPorPecaJson;
    @Column(columnDefinition = "TEXT")
    private String cor;
    private LocalDateTime dataAbertura;

    @ManyToOne
    @JoinColumn(name = "id_cli")
    private Cliente cliente;
}
