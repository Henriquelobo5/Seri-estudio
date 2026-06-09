package com.seriestudio.backend.controller;

import com.seriestudio.backend.dto.FichaTecnicaRequest;
import com.seriestudio.backend.dto.FichaTecnicaResponse;
import com.seriestudio.backend.model.FichaTecnica;
import com.seriestudio.backend.service.FichaTecnicaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/ficha-tecnica")
public class FichaTecnicaController {

    @Autowired
    private FichaTecnicaService fichaTecnicaService;

    @Value("${ficha.upload.dir:/app/uploads/fichas}")
    private String uploadDir;

    @PostMapping
    public ResponseEntity<FichaTecnicaResponse> criar(@RequestBody FichaTecnicaRequest req, Authentication auth) {
        FichaTecnica ficha = fichaTecnicaService.criar(req, auth.getName());
        return ResponseEntity.ok(toResponse(ficha));
    }

    @GetMapping("/minhas")
    public ResponseEntity<List<FichaTecnicaResponse>> minhas(Authentication auth) {
        List<FichaTecnicaResponse> fichas = fichaTecnicaService.listarPorCliente(auth.getName())
                .stream().map(this::toResponse).collect(Collectors.toList());
        return ResponseEntity.ok(fichas);
    }

    @PostMapping("/{id}/preview")
    public ResponseEntity<?> uploadPreview(@PathVariable Long id, @RequestParam("file") MultipartFile file, Authentication auth) {
        try {
            String url = fichaTecnicaService.salvarPreview(id, file);
            return ResponseEntity.ok(Map.of("url", url));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/arte")
    public ResponseEntity<?> uploadArte(@PathVariable Long id, @RequestParam("file") MultipartFile file, Authentication auth) {
        try {
            String url = fichaTecnicaService.salvarArte(id, file);
            return ResponseEntity.ok(Map.of("url", url));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/preview/{filename:.+}")
    public ResponseEntity<Resource> servirPreview(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(uploadDir).resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists()) return ResponseEntity.notFound().build();
            return ResponseEntity.ok().contentType(MediaType.IMAGE_PNG).body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    private FichaTecnicaResponse toResponse(FichaTecnica f) {
        return new FichaTecnicaResponse(
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
}
