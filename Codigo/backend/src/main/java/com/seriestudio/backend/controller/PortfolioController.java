package com.seriestudio.backend.controller;

import com.seriestudio.backend.dto.PortfolioResponse;
import com.seriestudio.backend.service.PortfolioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/portfolio")
public class PortfolioController {

    @Autowired
    private PortfolioService portfolioService;

    @Value("${portfolio.upload.dir:./uploads/portfolio}")
    private String uploadDir;

    @GetMapping
    public ResponseEntity<?> listar(@RequestParam(required = false) String categoria) {
        try {
            var items = (categoria != null && !categoria.isBlank())
                    ? portfolioService.listarPorCategoria(categoria)
                    : portfolioService.listarTodos();

            List<PortfolioResponse> result = items.stream()
                    .map(p -> new PortfolioResponse(
                            p.getIdItem(),
                            p.getTitulo(),
                            p.getDescricaoTecnica(),
                            p.getUrlImagem(),
                            p.getCategoria()))
                    .collect(Collectors.toList());
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/imagens/{filename:.+}")
    public ResponseEntity<Resource> servirImagem(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(uploadDir).resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists()) {
                return ResponseEntity.notFound().build();
            }
            String contentType = detectContentType(filename);
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    private String detectContentType(String filename) {
        String lower = filename.toLowerCase();
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".gif")) return "image/gif";
        if (lower.endsWith(".webp")) return "image/webp";
        return "image/jpeg";
    }
}
