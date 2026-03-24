package com.seriestudio.backend.controller;

import org.springframework.web.bind.annotation.*;

@RestController
public class HomeController {

    @GetMapping("/")
    public String home() {
        return "API Seri Estudio funcionando";
    }
}