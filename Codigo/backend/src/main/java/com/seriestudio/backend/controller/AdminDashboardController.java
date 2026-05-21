package com.seriestudio.backend.controller;

import com.seriestudio.backend.dto.dashboard.AtividadeRecenteResponse;
import com.seriestudio.backend.dto.dashboard.DashboardOverviewResponse;
import com.seriestudio.backend.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/admin/dashboard")
public class AdminDashboardController {

    private static final Set<Integer> PERIODOS_VALIDOS = Set.of(7, 30, 90);

    @Autowired
    private DashboardService dashboardService;

    @GetMapping("/overview")
    public ResponseEntity<?> overview(@RequestParam(defaultValue = "30") int dias) {
        try {
            if (!PERIODOS_VALIDOS.contains(dias)) {
                return ResponseEntity.badRequest().body(Map.of(
                        "message", "Período inválido. Use 7, 30 ou 90."
                ));
            }
            DashboardOverviewResponse response = dashboardService.getOverview(dias);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/atividade-recente")
    public ResponseEntity<?> atividadeRecente(@RequestParam(defaultValue = "10") int limit) {
        try {
            int safeLimit = Math.max(1, Math.min(limit, 50));
            List<AtividadeRecenteResponse> response = dashboardService.getAtividadeRecente(safeLimit);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
