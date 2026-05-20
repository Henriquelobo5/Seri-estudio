package com.seriestudio.backend.dto;

import java.util.List;

public class FinanceiroDashboardResponse {

    public double receitaBruta;
    public double custoTotal;
    public double lucroLiquido;
    public double margemLiquida;
    public double ticketMedio;

    public double receitaDeltaPct;
    public double custoDeltaPct;
    public double lucroDeltaPct;
    public double margemDeltaPp;

    public List<FluxoMes> fluxoCaixa;
    public List<ClienteReceita> topClientes;
    public List<MargemTipo> margemPorTipo;
    public ProjecaoMes projecao;
    public List<AlertaFinanceiro> alertas;
    public List<CategoriaCusto> breakdownCustos;

    public static class FluxoMes {
        public String mes;
        public double receita;
        public double custo;
        public double lucro;

        public FluxoMes(String mes, double receita, double custo, double lucro) {
            this.mes = mes;
            this.receita = receita;
            this.custo = custo;
            this.lucro = lucro;
        }
    }

    public static class ClienteReceita {
        public String nome;
        public String iniciais;
        public int totalPedidos;
        public double receita;

        public ClienteReceita(String nome, String iniciais, int totalPedidos, double receita) {
            this.nome = nome;
            this.iniciais = iniciais;
            this.totalPedidos = totalPedidos;
            this.receita = receita;
        }
    }

    public static class MargemTipo {
        public String tipo;
        public double margemPct;

        public MargemTipo(String tipo, double margemPct) {
            this.tipo = tipo;
            this.margemPct = margemPct;
        }
    }

    public static class ProjecaoMes {
        public double meta;
        public double realizado;
        public double pctMeta;
        public int diasRestantes;
        public boolean alcancavel;
        public double faltaMeta;

        public ProjecaoMes(double meta, double realizado, double pctMeta,
                           int diasRestantes, boolean alcancavel, double faltaMeta) {
            this.meta = meta;
            this.realizado = realizado;
            this.pctMeta = pctMeta;
            this.diasRestantes = diasRestantes;
            this.alcancavel = alcancavel;
            this.faltaMeta = faltaMeta;
        }
    }

    public static class AlertaFinanceiro {
        public String tipo;
        public String titulo;
        public String descricao;

        public AlertaFinanceiro(String tipo, String titulo, String descricao) {
            this.tipo = tipo;
            this.titulo = titulo;
            this.descricao = descricao;
        }
    }

    public static class CategoriaCusto {
        public String categoria;
        public double valor;
        public int pct;

        public CategoriaCusto(String categoria, double valor, int pct) {
            this.categoria = categoria;
            this.valor = valor;
            this.pct = pct;
        }
    }
}
