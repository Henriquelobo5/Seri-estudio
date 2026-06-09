package com.seriestudio.backend.controller;

import com.seriestudio.backend.dto.FichaTecnicaResponse;
import com.seriestudio.backend.dto.PedidoResponse;
import com.seriestudio.backend.dto.UpdatePedidoEtapaRequest;
import com.seriestudio.backend.dto.UpdatePedidoStatusRequest;
import com.seriestudio.backend.model.Pedido;
import com.seriestudio.backend.service.PedidoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin/pedidos")
public class AdminPedidoController {
    @Autowired
    private PedidoService pedidoService;

    @GetMapping
    public ResponseEntity<List<PedidoResponse>> listarTodos() {
        List<PedidoResponse> pedidos = pedidoService.listarTodosParaAdmin()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(pedidos);
    }

    @PatchMapping("/{id}/etapa")
    public ResponseEntity<?> atualizarEtapa(@PathVariable Long id, @RequestBody UpdatePedidoEtapaRequest req) {
        try {
            Pedido pedido = pedidoService.atualizarEtapaProducao(id, req.etapaProducao);
            return ResponseEntity.ok(toResponse(pedido));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> atualizarStatus(@PathVariable Long id, @RequestBody UpdatePedidoStatusRequest req) {
        try {
            Pedido pedido = pedidoService.atualizarStatusAtual(id, req.statusAtual);
            return ResponseEntity.ok(toResponse(pedido));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    private PedidoResponse toResponse(Pedido pedido) {
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
        return new PedidoResponse(
                pedidoComEtapa.getIdPed(),
                pedidoComEtapa.getStatusAtual(),
                pedidoComEtapa.getEtapaProducao(),
                pedidoComEtapa.getDataAbertura(),
                pedidoComEtapa.getQuantidades(),
                pedidoComEtapa.getObservacoes(),
                pedidoComEtapa.getCliente() != null ? pedidoComEtapa.getCliente().getNome() : null,
                pedidoComEtapa.getCliente() != null ? pedidoComEtapa.getCliente().getEmail() : null,
                fichaResp
        );
    }
}
