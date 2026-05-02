package com.seriestudio.backend.controller;

import com.seriestudio.backend.dto.FinanceiroRequest;
import com.seriestudio.backend.dto.FinanceiroResponse;
import com.seriestudio.backend.dto.PedidoFinanceiroResponse;
import com.seriestudio.backend.model.Financeiro;
import com.seriestudio.backend.model.Pedido;
import com.seriestudio.backend.repository.FinanceiroRepository;
import com.seriestudio.backend.repository.PedidoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin/financeiro")
public class AdminFinanceiroController {

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private FinanceiroRepository financeiroRepository;

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
