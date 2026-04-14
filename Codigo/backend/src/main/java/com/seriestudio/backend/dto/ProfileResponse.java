package com.seriestudio.backend.dto;

public record ProfileResponse(
        String nome,
        String email,
        String tipoUsuario,
        String cpfCnpj,
        String whatsapp,
        String endereco,
        String token
) {
}
