package com.seriestudio.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "notificacao_whatsapp")
@Getter
@Setter
public class NotificacaoWhatsapp {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idNotificacao;

    @ManyToOne
    @JoinColumn(name = "id_ped", nullable = false)
    private Pedido pedido;

    private String destinatario;
    private String tipo;

    @Column(columnDefinition = "TEXT")
    private String mensagem;

    private String status;
    private String etapaProducao;
    private Integer tentativas;
    private String providerMessageId;

    @Column(columnDefinition = "TEXT")
    private String erro;

    private LocalDateTime criadoEm;
    private LocalDateTime enviadoEm;
}
