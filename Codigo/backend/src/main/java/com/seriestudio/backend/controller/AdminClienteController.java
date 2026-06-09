package com.seriestudio.backend.controller;

import com.seriestudio.backend.dto.AdminClienteResponse;
import com.seriestudio.backend.dto.AdminClientePedidoResponse;
import com.seriestudio.backend.dto.FichaTecnicaResponse;
import com.seriestudio.backend.dto.FinanceiroResponse;
import com.seriestudio.backend.model.Financeiro;
import com.seriestudio.backend.model.Pedido;
import com.seriestudio.backend.model.usuario.Cliente;
import com.seriestudio.backend.repository.ClienteRepository;
import com.seriestudio.backend.repository.FinanceiroRepository;
import com.seriestudio.backend.repository.PedidoRepository;
import com.seriestudio.backend.service.PedidoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/admin/clientes")
public class AdminClienteController {
    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private FinanceiroRepository financeiroRepository;

    @Autowired
    private PedidoService pedidoService;

    @GetMapping
    public ResponseEntity<List<AdminClienteResponse>> listarTodos() {
        List<AdminClienteResponse> clientes = clienteRepository.findAll()
                .stream()
                .map(this::toResponse)
                .sorted(Comparator.comparing(response -> response.nome == null ? "" : response.nome))
                .toList();

        return ResponseEntity.ok(clientes);
    }

    private AdminClienteResponse toResponse(Cliente cliente) {
        List<AdminClientePedidoResponse> pedidos = pedidoRepository.findByClienteOrderByDataAberturaDesc(cliente)
                .stream()
                .map(this::toClientePedidoResponse)
                .toList();
        int pedidosAtivos = (int) pedidos.stream()
                .filter((pedido) -> !"ENTREGUE".equals(pedido.statusAtual) && !"CANCELADO".equals(pedido.statusAtual))
                .count();
        int pedidosEntregues = (int) pedidos.stream()
                .filter((pedido) -> "ENTREGUE".equals(pedido.statusAtual))
                .count();
        LocalDateTime primeiroPedido = pedidos.stream()
                .map((pedido) -> pedido.dataAbertura)
                .filter((dataAbertura) -> dataAbertura != null)
                .min(LocalDateTime::compareTo)
                .orElse(null);
        LocalDateTime ultimoPedido = pedidos.stream()
                .map((pedido) -> pedido.dataAbertura)
                .filter((dataAbertura) -> dataAbertura != null)
                .max(LocalDateTime::compareTo)
                .orElse(null);

        return new AdminClienteResponse(
                cliente.getIdUsuario(),
                cliente.getNome(),
                cliente.getEmail(),
                cliente.getCpfCnpj(),
                cliente.getWhatsapp(),
                cliente.getEndereco(),
                pedidos.size(),
                pedidosAtivos,
                pedidosEntregues,
                primeiroPedido,
                ultimoPedido,
                pedidos
        );
    }

    private AdminClientePedidoResponse toClientePedidoResponse(Pedido pedido) {
        FichaTecnicaResponse fichaResp = null;
        if (pedido.getFichaTecnica() != null) {
            var ficha = pedido.getFichaTecnica();
            fichaResp = new FichaTecnicaResponse(
                    ficha.getCodUnico(),
                    ficha.getCodigoDisplay(),
                    ficha.getIdentificacao(),
                    ficha.getProdutoTipo(),
                    ficha.getEspecificacoes(),
                    ficha.getUrlArte(),
                    ficha.getUrlPreview(),
                    ficha.getDataAbertura()
            );
        }

        Pedido pedidoComEtapa = pedidoService.garantirEtapaProducao(pedido);
        FinanceiroResponse financeiroResp = financeiroRepository.findByPedidoIdPed(pedido.getIdPed())
                .map(this::toFinanceiroResponse)
                .orElse(null);

        return new AdminClientePedidoResponse(
                pedidoComEtapa.getIdPed(),
                pedidoComEtapa.getStatusAtual(),
                pedidoComEtapa.getEtapaProducao(),
                pedidoComEtapa.getDataAbertura(),
                pedidoComEtapa.getQuantidades(),
                pedidoComEtapa.getObservacoes(),
                pedidoComEtapa.getCliente() != null ? pedidoComEtapa.getCliente().getNome() : null,
                pedidoComEtapa.getCliente() != null ? pedidoComEtapa.getCliente().getEmail() : null,
                fichaResp,
                financeiroResp
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
