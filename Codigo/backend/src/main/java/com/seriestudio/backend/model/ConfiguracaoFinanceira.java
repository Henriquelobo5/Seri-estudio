package com.seriestudio.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "configuracao_financeira")
public class ConfiguracaoFinanceira {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Double metaMensal;

    public Long getId() {
        return id;
    }

    public Double getMetaMensal() {
        return metaMensal;
    }

    public void setMetaMensal(Double metaMensal) {
        this.metaMensal = metaMensal;
    }
}
