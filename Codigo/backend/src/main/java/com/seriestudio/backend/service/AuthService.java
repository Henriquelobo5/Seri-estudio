package com.seriestudio.backend.service;

import com.seriestudio.backend.model.usuario.Usuario;
import com.seriestudio.backend.repository.UsuarioRepository;
import com.seriestudio.backend.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.seriestudio.backend.dto.RegisterRequest;
import com.seriestudio.backend.model.usuario.Cliente;
import com.seriestudio.backend.model.usuario.Administrador;

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
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, senha)
        );
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        return jwtUtil.generateToken(usuario.getEmail());
    }

    public Usuario register(RegisterRequest req) {
        if (usuarioRepository.findByEmail(req.email).isPresent()) {
            throw new RuntimeException("E-mail já cadastrado");
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
}
