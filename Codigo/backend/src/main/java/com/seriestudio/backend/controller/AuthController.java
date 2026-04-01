package com.seriestudio.backend.controller;

import com.seriestudio.backend.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

import com.seriestudio.backend.dto.RegisterRequest;
import com.seriestudio.backend.model.usuario.Usuario;

@RestController
@RequestMapping("/auth")
public class AuthController {
    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String senha = body.get("senha");
        String token = authService.login(email, senha);
        return ResponseEntity.ok(Map.of("token", token));
    }

    @PostMapping("/register")
    public ResponseEntity<Usuario> register(@RequestBody RegisterRequest req) {
        Usuario usuario = authService.register(req);
        return ResponseEntity.ok(usuario);
    }
}
