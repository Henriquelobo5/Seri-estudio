package com.seriestudio.backend.controller;

import com.seriestudio.backend.dto.FichaTecnicaResponse;
import com.seriestudio.backend.dto.PedidoRequest;
import com.seriestudio.backend.dto.PedidoResponse;
import com.seriestudio.backend.model.Pedido;
import com.seriestudio.backend.service.FichaTecnicaService;
import com.seriestudio.backend.service.PedidoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/pedido")
public class PedidoController {

    @Autowired
    private PedidoService pedidoService;

    @Autowired
    private FichaTecnicaService fichaTecnicaService;

    @GetMapping("/codigo")
    public ResponseEntity<Map<String, String>> gerarCodigo() {
        return ResponseEntity.ok(Map.of("codigo", fichaTecnicaService.proximoCodigo()));
    }

    @PostMapping
    public ResponseEntity<PedidoResponse> criar(@RequestBody PedidoRequest req, Authentication auth) {
        Pedido pedido = pedidoService.criar(req, auth.getName());
        return ResponseEntity.ok(toResponse(pedido));
    }

    @GetMapping("/meus")
    public ResponseEntity<List<PedidoResponse>> meusPedidos(Authentication auth) {
        List<PedidoResponse> pedidos = pedidoService.listarPorCliente(auth.getName())
                .stream().map(this::toResponse).collect(Collectors.toList());
        return ResponseEntity.ok(pedidos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PedidoResponse> buscarPorId(@PathVariable Long id, Authentication auth) {
        Pedido pedido = pedidoService.buscarPorId(id, auth.getName());
        return ResponseEntity.ok(toResponse(pedido));
    }

    @PatchMapping("/{id}/cancelar")
    public ResponseEntity<?> cancelar(@PathVariable Long id, Authentication auth) {
        try {
            Pedido pedido = pedidoService.cancelar(id, auth.getName());
            return ResponseEntity.ok(toResponse(pedido));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/teste")
    public String teste() {
        return "Backend funcionando";
    }

    private PedidoResponse toResponse(Pedido p) {
        FichaTecnicaResponse fichaResp = null;
        if (p.getFichaTecnica() != null) {
            var f = p.getFichaTecnica();
            fichaResp = new FichaTecnicaResponse(
                    f.getCodUnico(),
                    f.getCodigoDisplay(),
                    f.getIdentificacao(),
                    f.getProdutoTipo(),
                    f.getEspecificacoes(),
                    f.getUrlArte(),
                    f.getUrlPreview(),
                    f.getDataAbertura()
            );
        }
        return new PedidoResponse(
                p.getIdPed(),
                p.getStatusAtual(),
                pedidoService.garantirEtapaProducao(p).getEtapaProducao(),
                p.getDataAbertura(),
                p.getQuantidades(),
                p.getObservacoes(),
                p.getCliente() != null ? p.getCliente().getNome() : null,
                p.getCliente() != null ? p.getCliente().getEmail() : null,
                fichaResp
        );
    }
}
