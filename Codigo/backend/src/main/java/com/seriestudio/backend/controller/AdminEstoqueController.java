package com.seriestudio.backend.controller;

import com.seriestudio.backend.dto.InsumoRequest;
import com.seriestudio.backend.dto.InsumoResponse;
import com.seriestudio.backend.dto.MovimentacaoRequest;
import com.seriestudio.backend.dto.MovimentacaoResponse;
import com.seriestudio.backend.dto.SimularAbateRequest;
import com.seriestudio.backend.model.Insumo;
import com.seriestudio.backend.model.MovimentacaoEstoque;
import com.seriestudio.backend.service.EstoqueService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin/estoque")
public class AdminEstoqueController {

    @Autowired
    private EstoqueService estoqueService;

    @GetMapping
    public ResponseEntity<?> listar(@RequestParam(required = false) String categoria) {
        try {
            List<Insumo> insumos = (categoria != null && !categoria.isBlank())
                    ? estoqueService.listarPorCategoria(categoria)
                    : estoqueService.listarTodos();
            List<InsumoResponse> result = insumos.stream()
                    .map(this::toInsumoResponse)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> buscar(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(toInsumoResponse(estoqueService.buscarPorId(id)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> criar(@RequestBody InsumoRequest req) {
        try {
            return ResponseEntity.ok(toInsumoResponse(estoqueService.criar(req)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(@PathVariable Long id, @RequestBody InsumoRequest req) {
        try {
            return ResponseEntity.ok(toInsumoResponse(estoqueService.atualizar(id, req)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> excluir(@PathVariable Long id) {
        try {
            estoqueService.excluir(id);
            return ResponseEntity.ok(Map.of("message", "Insumo excluído com sucesso"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/movimentar")
    public ResponseEntity<?> movimentar(
            @PathVariable Long id,
            @RequestBody MovimentacaoRequest req,
            Authentication auth
    ) {
        try {
            MovimentacaoEstoque mov = estoqueService.registrarMovimentacao(id, req, auth.getName());
            return ResponseEntity.ok(toMovimentacaoResponse(mov));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/simular-abate")
    public ResponseEntity<?> simularAbate(
            @PathVariable Long id,
            @RequestBody SimularAbateRequest req,
            Authentication auth
    ) {
        try {
            MovimentacaoEstoque mov = estoqueService.simularAbate(id, req, auth.getName());
            return ResponseEntity.ok(toMovimentacaoResponse(mov));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/movimentacoes")
    public ResponseEntity<?> listarMovimentacoes() {
        try {
            List<MovimentacaoResponse> result = estoqueService.listarMovimentacoes().stream()
                    .map(this::toMovimentacaoResponse)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{id}/movimentacoes")
    public ResponseEntity<?> listarMovimentacoesPorInsumo(@PathVariable Long id) {
        try {
            List<MovimentacaoResponse> result = estoqueService.listarMovimentacoesPorInsumo(id).stream()
                    .map(this::toMovimentacaoResponse)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    private InsumoResponse toInsumoResponse(Insumo insumo) {
        return new InsumoResponse(
                insumo.getIdInsumo(),
                insumo.getNomeItem(),
                insumo.getCategoria(),
                insumo.getQtdEstoque(),
                insumo.getQtdMinima(),
                insumo.getUnidadeMedida(),
                insumo.getPrecoUnitario(),
                insumo.getConsumoPorPeca(),
                estoqueService.calcularStatus(insumo)
        );
    }

    private MovimentacaoResponse toMovimentacaoResponse(MovimentacaoEstoque mov) {
        Insumo insumo = mov.getInsumo();
        return new MovimentacaoResponse(
                mov.getIdMovimentacao(),
                mov.getTipo(),
                mov.getQuantidade(),
                mov.getQuantidadeReal(),
                mov.getMotivo(),
                mov.getDataHora(),
                mov.getQtdAposMovimentacao(),
                insumo != null ? insumo.getIdInsumo() : null,
                insumo != null ? insumo.getNomeItem() : null,
                mov.getAdministrador() != null ? mov.getAdministrador().getNome() : null
        );
    }
}
