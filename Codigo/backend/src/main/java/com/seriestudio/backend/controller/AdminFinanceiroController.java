package com.seriestudio.backend.controller;

import com.seriestudio.backend.dto.FinanceiroDashboardResponse;
import com.seriestudio.backend.dto.FinanceiroRequest;
import com.seriestudio.backend.dto.FinanceiroResponse;
import com.seriestudio.backend.dto.MetaMensalRequest;
import com.seriestudio.backend.dto.PedidoFinanceiroResponse;
import com.seriestudio.backend.model.ConfiguracaoFinanceira;
import com.seriestudio.backend.model.Financeiro;
import com.seriestudio.backend.model.Pedido;
import com.seriestudio.backend.repository.ConfiguracaoFinanceiraRepository;
import com.seriestudio.backend.repository.FinanceiroRepository;
import com.seriestudio.backend.repository.PedidoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin/financeiro")
public class AdminFinanceiroController {
    private static final double META_MENSAL_PADRAO = 10_000.0;

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private FinanceiroRepository financeiroRepository;

    @Autowired
    private ConfiguracaoFinanceiraRepository configuracaoFinanceiraRepository;

    @GetMapping
    public ResponseEntity<List<PedidoFinanceiroResponse>> listarPedidosComFinanceiro() {
        List<Pedido> pedidos = pedidoRepository.findAll();
        List<PedidoFinanceiroResponse> result = pedidos.stream()
                .map(this::toPedidoFinanceiroResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @PutMapping("/{pedidoId}")
    public ResponseEntity<?> salvarFinanceiro(
            @PathVariable Long pedidoId,
            @RequestBody FinanceiroRequest req
    ) {
        Optional<Pedido> pedidoOpt = pedidoRepository.findById(pedidoId);
        if (pedidoOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Pedido pedido = pedidoOpt.get();
        Financeiro fin = financeiroRepository.findByPedidoIdPed(pedidoId).orElse(new Financeiro());
        fin.setPedido(pedido);
        fin.setCustoMaterial(req.custoMaterial != null ? req.custoMaterial : 0.0);
        fin.setCustoEstamparia(req.custoEstamparia != null ? req.custoEstamparia : 0.0);
        fin.setCustoMo(req.custoMo != null ? req.custoMo : 0.0);
        fin.setCustoManutencao(req.custoManutencao != null ? req.custoManutencao : 0.0);
        fin.setValorVenda(req.valorVenda != null ? req.valorVenda : 0.0);

        double custoTotal = fin.getCustoMaterial() + fin.getCustoEstamparia()
                + fin.getCustoMo() + fin.getCustoManutencao();
        fin.setLucroLiquido(fin.getValorVenda() - custoTotal);

        try {
            Financeiro saved = financeiroRepository.save(fin);
            return ResponseEntity.ok(toFinanceiroResponse(saved));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // -------------------------------------------------------------------------
    // Dashboard endpoint
    // -------------------------------------------------------------------------

    @PutMapping("/dashboard/meta-mensal")
    public ResponseEntity<?> atualizarMetaMensal(@RequestBody MetaMensalRequest req) {
        if (req == null || req.meta == null || !Double.isFinite(req.meta) || req.meta <= 0) {
            return ResponseEntity.badRequest().body(Map.of("message", "Informe uma meta mensal maior que zero."));
        }

        ConfiguracaoFinanceira configuracao = configuracaoFinanceiraRepository
                .findTopByOrderByIdAsc()
                .orElseGet(ConfiguracaoFinanceira::new);
        configuracao.setMetaMensal(req.meta);
        ConfiguracaoFinanceira saved = configuracaoFinanceiraRepository.save(configuracao);

        return ResponseEntity.ok(Map.of("meta", saved.getMetaMensal()));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<FinanceiroDashboardResponse> getDashboard(
            @RequestParam(defaultValue = "30d") String periodo) {

        LocalDateTime now = LocalDateTime.now();
        List<Pedido> todosPedidos = pedidoRepository.findAll();
        Map<Long, Financeiro> finMap = financeiroRepository.findAll()
                .stream()
                .collect(Collectors.toMap(f -> f.getPedido().getIdPed(), f -> f));

        // --- Date ranges ---
        LocalDateTime startDate = periodStart(now, periodo);
        LocalDateTime prevStart = periodStart(startDate, periodo);

        List<Pedido> atuais = filterByDate(todosPedidos, startDate, now);
        List<Pedido> anteriores = filterByDate(todosPedidos, prevStart, startDate);

        // --- KPIs período atual ---
        double receitaBruta = sumReceita(atuais, finMap);
        double custoTotal = sumCusto(atuais, finMap);
        double lucroLiquido = receitaBruta - custoTotal;
        double margemLiquida = receitaBruta > 0 ? lucroLiquido / receitaBruta * 100 : 0;
        long pedidosComVenda = atuais.stream().filter(p -> getValorVenda(p, finMap) > 0).count();
        double ticketMedio = pedidosComVenda > 0 ? receitaBruta / pedidosComVenda : 0;

        // --- KPIs período anterior (para deltas) ---
        double recAnt = sumReceita(anteriores, finMap);
        double cstAnt = sumCusto(anteriores, finMap);
        double lucAnt = recAnt - cstAnt;
        double marAnt = recAnt > 0 ? lucAnt / recAnt * 100 : 0;

        double recDelta = recAnt > 0 ? (receitaBruta - recAnt) / recAnt * 100 : 0;
        double cstDelta = cstAnt > 0 ? (custoTotal - cstAnt) / cstAnt * 100 : 0;
        double lucDelta = lucAnt > 0 ? (lucroLiquido - lucAnt) / lucAnt * 100 : 0;
        double marDelta = margemLiquida - marAnt;

        // --- Fluxo de caixa — últimos 8 meses ---
        List<FinanceiroDashboardResponse.FluxoMes> fluxoCaixa = last8Months(now).stream()
                .map(ym -> {
                    List<Pedido> mes = pedidosMes(todosPedidos, ym[0], ym[1]);
                    double r = sumReceita(mes, finMap);
                    double c = sumCusto(mes, finMap);
                    return new FinanceiroDashboardResponse.FluxoMes(nomeMes(ym[1]), r, c, r - c);
                })
                .collect(Collectors.toList());

        // --- Top 5 clientes por receita (período atual) ---
        Map<String, double[]> clienteAcc = new LinkedHashMap<>();
        for (Pedido p : atuais) {
            if (p.getCliente() == null) continue;
            double venda = getValorVenda(p, finMap);
            String nome = p.getCliente().getNome();
            clienteAcc.computeIfAbsent(nome, k -> new double[]{0, 0});
            clienteAcc.get(nome)[0] += venda;
            clienteAcc.get(nome)[1]++;
        }
        List<FinanceiroDashboardResponse.ClienteReceita> topClientes = clienteAcc.entrySet().stream()
                .filter(e -> e.getValue()[0] > 0)
                .sorted((a, b) -> Double.compare(b.getValue()[0], a.getValue()[0]))
                .limit(5)
                .map(e -> new FinanceiroDashboardResponse.ClienteReceita(
                        e.getKey(),
                        initials(e.getKey()),
                        (int) e.getValue()[1],
                        e.getValue()[0]))
                .collect(Collectors.toList());

        // --- Margem por tipo de peça (período atual) ---
        Map<String, List<Double>> tipoMargemAcc = new HashMap<>();
        for (Pedido p : atuais) {
            if (p.getFichaTecnica() == null) continue;
            String tipo = p.getFichaTecnica().getProdutoTipo();
            if (tipo == null || tipo.isBlank()) continue;
            double venda = getValorVenda(p, finMap);
            if (venda <= 0) continue;
            double custo = getCustoTotal(p, finMap);
            double margem = (venda - custo) / venda * 100;
            tipoMargemAcc.computeIfAbsent(tipo, k -> new ArrayList<>()).add(margem);
        }
        List<FinanceiroDashboardResponse.MargemTipo> margemPorTipo = tipoMargemAcc.entrySet().stream()
                .map(e -> new FinanceiroDashboardResponse.MargemTipo(
                        e.getKey(),
                        e.getValue().stream().mapToDouble(Double::doubleValue).average().orElse(0)))
                .sorted((a, b) -> Double.compare(b.margemPct, a.margemPct))
                .limit(6)
                .collect(Collectors.toList());

        // --- Projeção do mês atual ---
        int anoAtual = now.getYear();
        int mesAtual = now.getMonthValue();
        List<Pedido> pedidosMesAtual = pedidosMes(todosPedidos, anoAtual, mesAtual);
        double realizadoMes = sumReceita(pedidosMesAtual, finMap);
        double metaMes = getMetaMensal();
        double pctMeta = Math.min(realizadoMes / metaMes * 100, 100);
        int diaAtual = now.getDayOfMonth();
        int diasNoMes = now.toLocalDate().lengthOfMonth();
        int diasRestantes = diasNoMes - diaAtual;
        double ritmoProjetado = diaAtual > 0 ? (realizadoMes / diaAtual) * diasNoMes : 0;
        boolean alcancavel = ritmoProjetado >= metaMes * 0.9;
        double faltaMeta = Math.max(0, metaMes - realizadoMes);

        FinanceiroDashboardResponse.ProjecaoMes projecao = new FinanceiroDashboardResponse.ProjecaoMes(
                metaMes, realizadoMes, pctMeta, diasRestantes, alcancavel, faltaMeta);

        // --- Alertas financeiros ---
        List<FinanceiroDashboardResponse.AlertaFinanceiro> alertas = new ArrayList<>();

        if (margemLiquida >= 25) {
            alertas.add(new FinanceiroDashboardResponse.AlertaFinanceiro("ok",
                    "Margem acima da meta",
                    String.format("%.1f%% vs meta de 25%% — excelente resultado.", margemLiquida)
                            .replace(',', '.')));
        } else if (margemLiquida > 0) {
            alertas.add(new FinanceiroDashboardResponse.AlertaFinanceiro("warn",
                    "Margem abaixo da meta",
                    String.format("%.1f%% vs meta de 25%% — revisar precificação.", margemLiquida)
                            .replace(',', '.')));
        }

        double matAtual = sumCategoria(atuais, finMap, "material");
        double matAnt = sumCategoria(anteriores, finMap, "material");
        if (matAnt > 0 && matAtual / matAnt > 1.05) {
            double pctAumento = (matAtual - matAnt) / matAnt * 100;
            alertas.add(new FinanceiroDashboardResponse.AlertaFinanceiro("warn",
                    "Custo de insumos subindo",
                    String.format("Custo de material +%.0f%% vs período anterior. Revisar precificação.", pctAumento)));
        }

        long semCusto = todosPedidos.stream()
                .filter(p -> !finMap.containsKey(p.getIdPed()))
                .count();
        if (semCusto > 0) {
            String plural = semCusto == 1 ? "pedido sem custo registrado" : "pedidos sem custo registrados";
            alertas.add(new FinanceiroDashboardResponse.AlertaFinanceiro("warn",
                    semCusto + " " + plural,
                    "Finalize o registro de custos em Custos e Lucro para análise completa."));
        }

        double ticketGlobal = calcTicketGlobal(todosPedidos, finMap);
        if (ticketGlobal > 0 && ticketMedio > 0) {
            double pctTm = (ticketMedio - ticketGlobal) / ticketGlobal * 100;
            if (pctTm >= 0) {
                alertas.add(new FinanceiroDashboardResponse.AlertaFinanceiro("ok",
                        "Ticket médio em alta",
                        String.format("R$ %.0f este período — +%.0f%% vs média histórica.", ticketMedio, pctTm)));
            }
        }

        // --- Breakdown de custos (período atual) ---
        double sumMat = sumCategoria(atuais, finMap, "material");
        double sumEst = sumCategoria(atuais, finMap, "estamparia");
        double sumMo = sumCategoria(atuais, finMap, "mo");
        double sumOut = sumCategoria(atuais, finMap, "outros");
        double sumTotalCusto = sumMat + sumEst + sumMo + sumOut;

        List<FinanceiroDashboardResponse.CategoriaCusto> breakdownCustos = new ArrayList<>();
        if (sumTotalCusto > 0) {
            breakdownCustos.add(new FinanceiroDashboardResponse.CategoriaCusto(
                    "Tecido/Peça", sumMat, (int) Math.round(sumMat / sumTotalCusto * 100)));
            breakdownCustos.add(new FinanceiroDashboardResponse.CategoriaCusto(
                    "Estamparia", sumEst, (int) Math.round(sumEst / sumTotalCusto * 100)));
            breakdownCustos.add(new FinanceiroDashboardResponse.CategoriaCusto(
                    "Mão de obra", sumMo, (int) Math.round(sumMo / sumTotalCusto * 100)));
            breakdownCustos.add(new FinanceiroDashboardResponse.CategoriaCusto(
                    "Outros", sumOut, (int) Math.round(sumOut / sumTotalCusto * 100)));
        }

        // --- Montar resposta ---
        FinanceiroDashboardResponse resp = new FinanceiroDashboardResponse();
        resp.receitaBruta = receitaBruta;
        resp.custoTotal = custoTotal;
        resp.lucroLiquido = lucroLiquido;
        resp.margemLiquida = margemLiquida;
        resp.ticketMedio = ticketMedio;
        resp.receitaDeltaPct = recDelta;
        resp.custoDeltaPct = cstDelta;
        resp.lucroDeltaPct = lucDelta;
        resp.margemDeltaPp = marDelta;
        resp.fluxoCaixa = fluxoCaixa;
        resp.topClientes = topClientes;
        resp.margemPorTipo = margemPorTipo;
        resp.projecao = projecao;
        resp.alertas = alertas;
        resp.breakdownCustos = breakdownCustos;

        return ResponseEntity.ok(resp);
    }

    // -------------------------------------------------------------------------
    // Métodos auxiliares
    // -------------------------------------------------------------------------

    private double getMetaMensal() {
        return configuracaoFinanceiraRepository
                .findTopByOrderByIdAsc()
                .map(ConfiguracaoFinanceira::getMetaMensal)
                .filter(meta -> Double.isFinite(meta) && meta > 0)
                .orElse(META_MENSAL_PADRAO);
    }

    private LocalDateTime periodStart(LocalDateTime base, String periodo) {
        return switch (periodo) {
            case "7d" -> base.minusDays(7);
            case "90d" -> base.minusDays(90);
            case "12m" -> base.minusMonths(12);
            default -> base.minusDays(30);
        };
    }

    private List<Pedido> filterByDate(List<Pedido> all, LocalDateTime from, LocalDateTime to) {
        return all.stream()
                .filter(p -> p.getDataAbertura() != null
                        && !p.getDataAbertura().isBefore(from)
                        && p.getDataAbertura().isBefore(to))
                .collect(Collectors.toList());
    }

    private double sumReceita(List<Pedido> pedidos, Map<Long, Financeiro> finMap) {
        return pedidos.stream().mapToDouble(p -> getValorVenda(p, finMap)).sum();
    }

    private double sumCusto(List<Pedido> pedidos, Map<Long, Financeiro> finMap) {
        return pedidos.stream().mapToDouble(p -> getCustoTotal(p, finMap)).sum();
    }

    private double getValorVenda(Pedido p, Map<Long, Financeiro> finMap) {
        Financeiro f = finMap.get(p.getIdPed());
        return f != null && f.getValorVenda() != null ? f.getValorVenda() : 0;
    }

    private double getCustoTotal(Pedido p, Map<Long, Financeiro> finMap) {
        Financeiro f = finMap.get(p.getIdPed());
        if (f == null) return 0;
        return nn(f.getCustoMaterial()) + nn(f.getCustoEstamparia())
                + nn(f.getCustoMo()) + nn(f.getCustoManutencao());
    }

    private double sumCategoria(List<Pedido> pedidos, Map<Long, Financeiro> finMap, String cat) {
        return pedidos.stream().mapToDouble(p -> {
            Financeiro f = finMap.get(p.getIdPed());
            if (f == null) return 0;
            return switch (cat) {
                case "material" -> nn(f.getCustoMaterial());
                case "estamparia" -> nn(f.getCustoEstamparia());
                case "mo" -> nn(f.getCustoMo());
                default -> nn(f.getCustoManutencao());
            };
        }).sum();
    }

    private double nn(Double v) {
        return v != null ? v : 0;
    }

    private List<int[]> last8Months(LocalDateTime now) {
        List<int[]> months = new ArrayList<>();
        for (int i = 7; i >= 0; i--) {
            LocalDateTime m = now.minusMonths(i);
            months.add(new int[]{m.getYear(), m.getMonthValue()});
        }
        return months;
    }

    private List<Pedido> pedidosMes(List<Pedido> all, int year, int month) {
        return all.stream()
                .filter(p -> p.getDataAbertura() != null
                        && p.getDataAbertura().getYear() == year
                        && p.getDataAbertura().getMonthValue() == month)
                .collect(Collectors.toList());
    }

    private String nomeMes(int month) {
        String[] nomes = {"Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"};
        return nomes[month - 1];
    }

    private String initials(String nome) {
        if (nome == null || nome.isBlank()) return "?";
        String[] parts = nome.trim().split("\\s+");
        if (parts.length >= 2) {
            return ("" + parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
        }
        return nome.substring(0, Math.min(2, nome.length())).toUpperCase();
    }

    private double calcTicketGlobal(List<Pedido> all, Map<Long, Financeiro> finMap) {
        double total = all.stream().mapToDouble(p -> getValorVenda(p, finMap)).sum();
        long count = all.stream().filter(p -> getValorVenda(p, finMap) > 0).count();
        return count > 0 ? total / count : 0;
    }

    // -------------------------------------------------------------------------
    // Mappers existentes
    // -------------------------------------------------------------------------

    private PedidoFinanceiroResponse toPedidoFinanceiroResponse(Pedido pedido) {
        Optional<Financeiro> finOpt = financeiroRepository.findByPedidoIdPed(pedido.getIdPed());
        FinanceiroResponse finResp = finOpt.map(this::toFinanceiroResponse).orElse(null);

        String codigoDisplay = pedido.getFichaTecnica() != null
                ? pedido.getFichaTecnica().getCodigoDisplay()
                : "SERI-" + pedido.getIdPed();
        String identificacao = pedido.getFichaTecnica() != null
                ? pedido.getFichaTecnica().getIdentificacao()
                : null;
        String produtoTipo = pedido.getFichaTecnica() != null
                ? pedido.getFichaTecnica().getProdutoTipo()
                : null;
        String clienteNome = pedido.getCliente() != null
                ? pedido.getCliente().getNome()
                : null;

        return new PedidoFinanceiroResponse(
                pedido.getIdPed(),
                codigoDisplay,
                identificacao,
                clienteNome,
                pedido.getQuantidades(),
                produtoTipo,
                pedido.getDataAbertura(),
                finResp
        );
    }

    private FinanceiroResponse toFinanceiroResponse(Financeiro fin) {
        return new FinanceiroResponse(
                fin.getIdFinanceiro(),
                fin.getCustoMaterial(),
                fin.getCustoEstamparia(),
                fin.getCustoMo(),
                fin.getCustoManutencao(),
                fin.getValorVenda(),
                fin.getLucroLiquido()
        );
    }
}
