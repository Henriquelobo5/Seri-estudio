package com.seriestudio.backend.dto.dashboard;

import java.util.List;

public class DashboardOverviewResponse {
    public int pedidosDoPeriodo;
    public int pedidosEmProducao;
    public int insumosEmAlerta;
    public int movimentacoesDoMes;

    public List<PedidosPorDiaItem> pedidosPorDia;
    public List<DistribuicaoItem> pedidosPorStatus;
    public List<DistribuicaoItem> movimentacoesPorTipo;
    public List<DistribuicaoItem> insumosPorCategoria;

    public DashboardOverviewResponse(
            int pedidosDoPeriodo,
            int pedidosEmProducao,
            int insumosEmAlerta,
            int movimentacoesDoMes,
            List<PedidosPorDiaItem> pedidosPorDia,
            List<DistribuicaoItem> pedidosPorStatus,
            List<DistribuicaoItem> movimentacoesPorTipo,
            List<DistribuicaoItem> insumosPorCategoria
    ) {
        this.pedidosDoPeriodo = pedidosDoPeriodo;
        this.pedidosEmProducao = pedidosEmProducao;
        this.insumosEmAlerta = insumosEmAlerta;
        this.movimentacoesDoMes = movimentacoesDoMes;
        this.pedidosPorDia = pedidosPorDia;
        this.pedidosPorStatus = pedidosPorStatus;
        this.movimentacoesPorTipo = movimentacoesPorTipo;
        this.insumosPorCategoria = insumosPorCategoria;
    }
}
