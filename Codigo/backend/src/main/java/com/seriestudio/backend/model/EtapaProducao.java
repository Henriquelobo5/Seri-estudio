package com.seriestudio.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "etapa_producao")
public class EtapaProducao {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idEtapa;

    private String nomeFase;
    private LocalDateTime dataInicio;
    private LocalDateTime previsaoFim;
    private String statusFase;

    @ManyToOne
    @JoinColumn(name = "id_ped")
    private Pedido pedido;

    // Getters e setters
}
