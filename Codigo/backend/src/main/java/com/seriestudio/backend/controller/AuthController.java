package com.seriestudio.backend.controller;

import com.seriestudio.backend.dto.ProfileResponse;
import com.seriestudio.backend.dto.RegisterRequest;
import com.seriestudio.backend.dto.UpdateProfileRequest;
import com.seriestudio.backend.model.usuario.Usuario;
import com.seriestudio.backend.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {
    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        try {
            String email = body.get("email");
            String senha = body.get("senha");
            String token = authService.login(email, senha);
            return ResponseEntity.ok(Map.of("token", token));
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Email ou senha invalidos"));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<Usuario> register(@RequestBody RegisterRequest req) {
        Usuario usuario = authService.register(req);
        return ResponseEntity.ok(usuario);
    }

    @GetMapping("/me")
    public ResponseEntity<?> profile(Authentication auth) {
        try {
            ProfileResponse profile = authService.getProfile(auth.getName());
            return ResponseEntity.ok(profile);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateProfile(@RequestBody UpdateProfileRequest req, Authentication auth) {
        try {
            ProfileResponse profile = authService.updateProfile(auth.getName(), req);
            return ResponseEntity.ok(profile);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", e.getMessage()));
        }
    }
}
