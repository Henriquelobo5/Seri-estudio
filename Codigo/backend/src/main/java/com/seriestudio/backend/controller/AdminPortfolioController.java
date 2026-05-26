package com.seriestudio.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.seriestudio.backend.dto.PortfolioRequest;
import com.seriestudio.backend.dto.PortfolioResponse;
import com.seriestudio.backend.model.Portfolio;
import com.seriestudio.backend.service.PortfolioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin/portfolio")
public class AdminPortfolioController {

    @Autowired
    private PortfolioService portfolioService;

    @GetMapping
    public ResponseEntity<?> listar() {
        try {
            List<PortfolioResponse> result = portfolioService.listarTodos()
                    .stream().map(this::toResponse).collect(Collectors.toList());
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> criarComImagem(
            @RequestPart("dados") String dadosJson,
            @RequestPart(value = "imagem", required = false) MultipartFile imagem,
            Authentication auth
    ) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            PortfolioRequest req = mapper.readValue(dadosJson, PortfolioRequest.class);

            if (imagem != null && !imagem.isEmpty()) {
                String url = portfolioService.salvarImagem(imagem);
                req.setUrlImagem(url);
            }

            Portfolio item = portfolioService.criar(req, auth.getName());
            return ResponseEntity.ok(toResponse(item));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> atualizarComImagem(
            @PathVariable Long id,
            @RequestPart("dados") String dadosJson,
            @RequestPart(value = "imagem", required = false) MultipartFile imagem
    ) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            PortfolioRequest req = mapper.readValue(dadosJson, PortfolioRequest.class);

            if (imagem != null && !imagem.isEmpty()) {
                String url = portfolioService.salvarImagem(imagem);
                req.setUrlImagem(url);
            }

            Portfolio item = portfolioService.atualizar(id, req);
            return ResponseEntity.ok(toResponse(item));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> excluir(@PathVariable Long id) {
        try {
            portfolioService.excluir(id);
            return ResponseEntity.ok(Map.of("message", "Item excluído com sucesso"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    private PortfolioResponse toResponse(Portfolio p) {
        return new PortfolioResponse(
                p.getIdItem(),
                p.getTitulo(),
                p.getDescricaoTecnica(),
                p.getUrlImagem(),
                p.getCategoria()
        );
    }
}
