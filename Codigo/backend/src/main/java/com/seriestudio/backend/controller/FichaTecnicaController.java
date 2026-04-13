package com.seriestudio.backend.controller;

import com.seriestudio.backend.dto.FichaTecnicaRequest;
import com.seriestudio.backend.dto.FichaTecnicaResponse;
import com.seriestudio.backend.model.FichaTecnica;
import com.seriestudio.backend.service.FichaTecnicaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/ficha-tecnica")
public class FichaTecnicaController {

    @Autowired
    private FichaTecnicaService fichaTecnicaService;

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

    private FichaTecnicaResponse toResponse(FichaTecnica f) {
        return new FichaTecnicaResponse(
                f.getCodUnico(),
                f.getCodigoDisplay(),
                f.getIdentificacao(),
                f.getProdutoTipo(),
                f.getEspecificacoes(),
                f.getUrlArte(),
                f.getDataAbertura()
        );
    }
}
