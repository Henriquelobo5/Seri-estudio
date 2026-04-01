package com.seriestudio.backend.controller;

import com.seriestudio.backend.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class TokenController {
    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestBody Map<String, String> body) {
        String oldToken = body.get("token");
        if (oldToken == null || !jwtUtil.isTokenValid(oldToken)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Token inválido ou expirado"));
        }
        String username = jwtUtil.extractUsername(oldToken);
        String newToken = jwtUtil.generateToken(username);
        return ResponseEntity.ok(Map.of("token", newToken));
    }
}
