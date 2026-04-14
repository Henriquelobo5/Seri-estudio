package com.seriestudio.backend.service;

import com.seriestudio.backend.dto.ProfileResponse;
import com.seriestudio.backend.dto.RegisterRequest;
import com.seriestudio.backend.dto.UpdateProfileRequest;
import com.seriestudio.backend.model.usuario.Administrador;
import com.seriestudio.backend.model.usuario.Cliente;
import com.seriestudio.backend.model.usuario.Usuario;
import com.seriestudio.backend.repository.UsuarioRepository;
import com.seriestudio.backend.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    @Autowired
    private AuthenticationManager authenticationManager;
    @Autowired
    private UsuarioRepository usuarioRepository;
    @Autowired
    private JwtUtil jwtUtil;
    @Autowired
    private PasswordEncoder passwordEncoder;

    public String login(String email, String senha) throws AuthenticationException {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, senha)
        );

        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario nao encontrado"));

        return jwtUtil.generateToken(usuario);
    }

    public Usuario register(RegisterRequest req) {
        if (usuarioRepository.findByEmail(req.email).isPresent()) {
            throw new RuntimeException("E-mail ja cadastrado");
        }

        Usuario usuario;
        if ("ADMIN".equalsIgnoreCase(req.tipoUsuario)) {
            Administrador admin = new Administrador();
            admin.setNome(req.nome);
            admin.setEmail(req.email);
            admin.setSenhaHash(passwordEncoder.encode(req.senha));
            admin.setTipoUsuario("ADMIN");
            admin.setNivelPermissao(req.nivelPermissao);
            admin.setNomeUsuario(req.nomeUsuario);
            usuario = admin;
        } else {
            Cliente cliente = new Cliente();
            cliente.setNome(req.nome);
            cliente.setEmail(req.email);
            cliente.setSenhaHash(passwordEncoder.encode(req.senha));
            cliente.setTipoUsuario("CLIENTE");
            cliente.setCpfCnpj(req.cpfCnpj);
            cliente.setWhatsapp(req.whatsapp);
            cliente.setEndereco(req.endereco);
            usuario = cliente;
        }

        return usuarioRepository.save(usuario);
    }

    public ProfileResponse getProfile(String email) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario nao encontrado"));

        return toProfileResponse(usuario, null);
    }

    public ProfileResponse updateProfile(String currentEmail, UpdateProfileRequest req) {
        Usuario usuario = usuarioRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new RuntimeException("Usuario nao encontrado"));

        String nome = normalizeRequired(req.nome, "Informe um nome valido com pelo menos 3 caracteres.");
        if (nome.length() < 3) {
            throw new IllegalArgumentException("Informe um nome valido com pelo menos 3 caracteres.");
        }

        String email = normalizeRequired(req.email, "Informe um e-mail valido.");
        if (!email.matches("\\S+@\\S+\\.\\S+")) {
            throw new IllegalArgumentException("Informe um e-mail valido.");
        }

        usuarioRepository.findByEmail(email)
                .filter(existing -> !existing.getIdUsuario().equals(usuario.getIdUsuario()))
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("E-mail ja cadastrado");
                });

        usuario.setNome(nome);
        usuario.setEmail(email);

        if (usuario instanceof Cliente cliente) {
            cliente.setCpfCnpj(normalizeOptional(req.cpfCnpj));
            cliente.setWhatsapp(normalizeOptional(req.whatsapp));
            cliente.setEndereco(normalizeOptional(req.endereco));
        }

        Usuario atualizado = usuarioRepository.save(usuario);
        return toProfileResponse(atualizado, jwtUtil.generateToken(atualizado));
    }

    private ProfileResponse toProfileResponse(Usuario usuario, String token) {
        String cpfCnpj = null;
        String whatsapp = null;
        String endereco = null;

        if (usuario instanceof Cliente cliente) {
            cpfCnpj = cliente.getCpfCnpj();
            whatsapp = cliente.getWhatsapp();
            endereco = cliente.getEndereco();
        }

        return new ProfileResponse(
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getTipoUsuario(),
                cpfCnpj,
                whatsapp,
                endereco,
                token
        );
    }

    private String normalizeRequired(String value, String message) {
        String normalized = normalizeOptional(value);
        if (normalized == null) {
            throw new IllegalArgumentException(message);
        }
        return normalized;
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }
}
