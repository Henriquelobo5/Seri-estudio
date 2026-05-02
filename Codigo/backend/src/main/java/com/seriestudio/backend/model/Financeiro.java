package com.seriestudio.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "financeiro")
public class Financeiro {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idFinanceiro;

    private Double custoMaterial;
    private Double custoEstamparia;
    private Double custoMo;
    private Double custoManutencao;
    private Double valorVenda;
    private Double lucroLiquido;

    @OneToOne
    @JoinColumn(name = "id_ped")
    private Pedido pedido;

    public Long getIdFinanceiro() { return idFinanceiro; }
    public void setIdFinanceiro(Long idFinanceiro) { this.idFinanceiro = idFinanceiro; }

    public Double getCustoMaterial() { return custoMaterial; }
    public void setCustoMaterial(Double custoMaterial) { this.custoMaterial = custoMaterial; }

    public Double getCustoEstamparia() { return custoEstamparia; }
    public void setCustoEstamparia(Double custoEstamparia) { this.custoEstamparia = custoEstamparia; }

    public Double getCustoMo() { return custoMo; }
    public void setCustoMo(Double custoMo) { this.custoMo = custoMo; }

    public Double getCustoManutencao() { return custoManutencao; }
    public void setCustoManutencao(Double custoManutencao) { this.custoManutencao = custoManutencao; }

    public Double getValorVenda() { return valorVenda; }
    public void setValorVenda(Double valorVenda) { this.valorVenda = valorVenda; }

    public Double getLucroLiquido() { return lucroLiquido; }
    public void setLucroLiquido(Double lucroLiquido) { this.lucroLiquido = lucroLiquido; }

    public Pedido getPedido() { return pedido; }
    public void setPedido(Pedido pedido) { this.pedido = pedido; }
}
