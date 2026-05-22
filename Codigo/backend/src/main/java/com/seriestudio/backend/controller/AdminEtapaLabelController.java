package com.seriestudio.backend.controller;

import com.seriestudio.backend.dto.EtapaLabelResponse;
import com.seriestudio.backend.dto.EtapaLabelUpdateRequest;
import com.seriestudio.backend.model.EtapaLabel;
import com.seriestudio.backend.service.EtapaLabelService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin/etapa-labels")
public class AdminEtapaLabelController {

    @Autowired
    private EtapaLabelService etapaLabelService;

    @GetMapping
    public ResponseEntity<?> listar() {
        try {
            List<EtapaLabelResponse> result = etapaLabelService.listarTodos().stream()
                    .map(this::toResponse)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(@PathVariable Long id, @RequestBody EtapaLabelUpdateRequest req) {
        try {
            EtapaLabel atualizado = etapaLabelService.atualizarLabel(id, req.labelExibido);
            return ResponseEntity.ok(toResponse(atualizado));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/restaurar")
    public ResponseEntity<?> restaurar(@PathVariable Long id) {
        try {
            EtapaLabel restaurado = etapaLabelService.restaurarPadrao(id);
            return ResponseEntity.ok(toResponse(restaurado));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    private EtapaLabelResponse toResponse(EtapaLabel etapa) {
        return new EtapaLabelResponse(etapa.getId(), etapa.getIdInterno(), etapa.getLabelExibido());
    }
}
