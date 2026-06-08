package com.seriestudio.backend.service;

import com.seriestudio.backend.dto.dashboard.AtividadeRecenteResponse;
import com.seriestudio.backend.dto.dashboard.DashboardOverviewResponse;
import com.seriestudio.backend.dto.dashboard.DistribuicaoItem;
import com.seriestudio.backend.dto.dashboard.PedidosPorDiaItem;
import com.seriestudio.backend.model.FichaTecnica;
import com.seriestudio.backend.model.Insumo;
import com.seriestudio.backend.model.MovimentacaoEstoque;
import com.seriestudio.backend.model.Pedido;
import com.seriestudio.backend.model.usuario.Cliente;
import com.seriestudio.backend.repository.FichaTecnicaRepository;
import com.seriestudio.backend.repository.InsumoRepository;
import com.seriestudio.backend.repository.MovimentacaoEstoqueRepository;
import com.seriestudio.backend.repository.PedidoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@Transactional(readOnly = true)
public class DashboardService {

    private static final DateTimeFormatter LABEL_DIA = DateTimeFormatter.ofPattern("dd/MM");

    private static final Set<String> STATUS_ALERTA = Set.of("CRITICO", "SEM_ESTOQUE");

    private static final Map<String, String> STATUS_PEDIDO_LABEL = Map.of(
            "AGUARDANDO_ANALISE", "Aguardando análise",
            "ORCAMENTO_ENVIADO", "Orçamento enviado",
            "EM_PRODUCAO", "Em produção",
            "PRONTO_PARA_RETIRADA", "Pronto para retirada",
            "EM_TRANSITO", "Em trânsito",
            "ENTREGUE", "Entregue",
            "CANCELADO", "Cancelado"
    );

    private static final Map<String, String> TIPO_MOV_LABEL = Map.of(
            "ENTRADA", "Entrada",
            "SAIDA", "Saída",
            "AJUSTE", "Ajuste"
    );

    private static final Map<String, String> CATEGORIA_INSUMO_LABEL = Map.of(
            "TINTA", "Tinta",
            "TELA", "Tela",
            "TECIDO", "Tecido",
            "EMULSAO", "Emulsão",
            "OUTROS", "Outros"
    );

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private FichaTecnicaRepository fichaTecnicaRepository;

    @Autowired
    private MovimentacaoEstoqueRepository movimentacaoEstoqueRepository;

    @Autowired
    private InsumoRepository insumoRepository;

    @Autowired
    private EstoqueService estoqueService;

    public DashboardOverviewResponse getOverview(int dias) {
        LocalDate hoje = LocalDate.now();
        LocalDate inicioPeriodo = hoje.minusDays(dias - 1L);
        LocalDateTime inicioPeriodoDt = inicioPeriodo.atStartOfDay();
        LocalDateTime inicioMesDt = hoje.withDayOfMonth(1).atStartOfDay();

        List<Pedido> todosPedidos = pedidoRepository.findAll();
        List<Insumo> todosInsumos = insumoRepository.findAll();
        List<MovimentacaoEstoque> todasMovs = movimentacaoEstoqueRepository.findAll();

        int pedidosDoPeriodo = (int) todosPedidos.stream()
                .filter(p -> p.getDataAbertura() != null && !p.getDataAbertura().isBefore(inicioPeriodoDt))
                .count();

        int pedidosEmProducao = (int) todosPedidos.stream()
                .filter(p -> {
                    String status = p.getStatusAtual();
                    return "EM_PRODUCAO".equals(status)
                            || "PRONTO_PARA_RETIRADA".equals(status)
                            || "EM_TRANSITO".equals(status);
                })
                .count();

        int insumosEmAlerta = (int) todosInsumos.stream()
                .map(estoqueService::calcularStatus)
                .filter(STATUS_ALERTA::contains)
                .count();

        int movimentacoesDoMes = (int) todasMovs.stream()
                .filter(m -> m.getDataHora() != null && !m.getDataHora().isBefore(inicioMesDt))
                .count();

        List<PedidosPorDiaItem> pedidosPorDia = montarPedidosPorDia(todosPedidos, inicioPeriodo, dias);
        List<DistribuicaoItem> pedidosPorStatus = montarDistribuicao(
                todosPedidos.stream().map(Pedido::getStatusAtual).toList(),
                STATUS_PEDIDO_LABEL
        );
        List<DistribuicaoItem> movimentacoesPorTipo = montarDistribuicao(
                todasMovs.stream().map(MovimentacaoEstoque::getTipo).toList(),
                TIPO_MOV_LABEL
        );
        List<DistribuicaoItem> insumosPorCategoria = montarDistribuicao(
                todosInsumos.stream().map(Insumo::getCategoria).toList(),
                CATEGORIA_INSUMO_LABEL
        );

        return new DashboardOverviewResponse(
                pedidosDoPeriodo,
                pedidosEmProducao,
                insumosEmAlerta,
                movimentacoesDoMes,
                pedidosPorDia,
                pedidosPorStatus,
                movimentacoesPorTipo,
                insumosPorCategoria
        );
    }

    public List<AtividadeRecenteResponse> getAtividadeRecente(int limit) {
        LocalDateTime corte = LocalDateTime.now().minusHours(72);
        List<AtividadeRecenteResponse> eventos = new ArrayList<>();

        for (Pedido p : pedidoRepository.findAll()) {
            if (p.getDataAbertura() == null || p.getDataAbertura().isBefore(corte)) continue;
            String nomeCliente = nomeCliente(p.getCliente());
            String descricao = nomeCliente + " criou pedido #" + p.getIdPed();
            eventos.add(new AtividadeRecenteResponse("PEDIDO_CRIADO", descricao, p.getDataAbertura()));
        }

        for (FichaTecnica f : fichaTecnicaRepository.findAll()) {
            if (f.getDataAbertura() == null || f.getDataAbertura().isBefore(corte)) continue;
            String nomeCliente = nomeCliente(f.getCliente());
            String codigo = f.getCodigoDisplay() != null && !f.getCodigoDisplay().isBlank()
                    ? f.getCodigoDisplay()
                    : String.valueOf(f.getCodUnico());
            String descricao = nomeCliente + " abriu ficha #" + codigo;
            eventos.add(new AtividadeRecenteResponse("FICHA_CRIADA", descricao, f.getDataAbertura()));
        }

        for (MovimentacaoEstoque m : movimentacaoEstoqueRepository.findTop20ByOrderByDataHoraDesc()) {
            if (m.getDataHora() == null || m.getDataHora().isBefore(corte)) continue;
            String tipoMov = m.getTipo();
            String nomeInsumo = m.getInsumo() != null && m.getInsumo().getNomeItem() != null
                    ? m.getInsumo().getNomeItem()
                    : "Insumo";
            String unidade = m.getInsumo() != null && m.getInsumo().getUnidadeMedida() != null
                    ? m.getInsumo().getUnidadeMedida()
                    : "";
            int qtd = m.getQuantidade() != null ? m.getQuantidade() : 0;
            String tipoEvento;
            String descricao;
            switch (tipoMov != null ? tipoMov : "") {
                case "ENTRADA":
                    tipoEvento = "MOV_ENTRADA";
                    descricao = "Insumo \"" + nomeInsumo + "\" abastecido (+" + qtd + " " + unidade + ")";
                    break;
                case "SAIDA":
                    tipoEvento = "MOV_SAIDA";
                    descricao = "Saída de \"" + nomeInsumo + "\" (-" + qtd + " " + unidade + ")";
                    break;
                case "AJUSTE":
                    tipoEvento = "MOV_AJUSTE";
                    descricao = "Inventário ajustado em \"" + nomeInsumo + "\" para " + qtd + " " + unidade;
                    break;
                default:
                    continue;
            }
            eventos.add(new AtividadeRecenteResponse(tipoEvento, descricao.trim(), m.getDataHora()));
        }

        eventos.sort(Comparator.comparing((AtividadeRecenteResponse a) -> a.dataHora).reversed());
        int max = Math.max(0, limit);
        if (eventos.size() > max) {
            return new ArrayList<>(eventos.subList(0, max));
        }
        return eventos;
    }

    private List<PedidosPorDiaItem> montarPedidosPorDia(List<Pedido> todos, LocalDate inicio, int dias) {
        Map<LocalDate, Integer> contagem = new LinkedHashMap<>();
        for (int i = 0; i < dias; i++) {
            contagem.put(inicio.plusDays(i), 0);
        }
        for (Pedido p : todos) {
            if (p.getDataAbertura() == null) continue;
            LocalDate dia = p.getDataAbertura().toLocalDate();
            if (contagem.containsKey(dia)) {
                contagem.merge(dia, 1, Integer::sum);
            }
        }
        List<PedidosPorDiaItem> resultado = new ArrayList<>(contagem.size());
        for (Map.Entry<LocalDate, Integer> e : contagem.entrySet()) {
            resultado.add(new PedidosPorDiaItem(e.getKey().format(LABEL_DIA), e.getKey(), e.getValue()));
        }
        return resultado;
    }

    private List<DistribuicaoItem> montarDistribuicao(List<String> valores, Map<String, String> labelMap) {
        Map<String, Integer> agg = new LinkedHashMap<>();
        for (String v : valores) {
            if (v == null || v.isBlank()) continue;
            agg.merge(v, 1, Integer::sum);
        }
        List<DistribuicaoItem> lista = new ArrayList<>(agg.size());
        for (Map.Entry<String, Integer> e : agg.entrySet()) {
            String label = labelMap.getOrDefault(e.getKey(), e.getKey());
            lista.add(new DistribuicaoItem(label, e.getValue()));
        }
        lista.sort(Comparator.comparingInt((DistribuicaoItem d) -> d.quantidade).reversed());
        return lista;
    }

    private String nomeCliente(Cliente cliente) {
        if (cliente == null) return "Cliente";
        String nome = cliente.getNome();
        return (nome != null && !nome.isBlank()) ? nome : "Cliente";
    }
}
