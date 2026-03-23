package com.seriestudio.backend.controller;

import org.springframework.web.bind.annotation.*;
import com.seriestudio.backend.service.PedidoService;

@RestController
@RequestMapping("/pedido")
public class PedidoController {

    private final PedidoService service;

    public PedidoController(PedidoService service) {
        this.service = service;
    }

    @GetMapping("/codigo")
    public String gerarCodigo() {
        return service.gerarCodigo();
    }

        @GetMapping("/teste")
    public String teste() {
        return "Backend funcionando";
    }
}