package com.seriestudio.backend.config;

import com.seriestudio.backend.model.usuario.Cliente;
import com.seriestudio.backend.model.usuario.Administrador;
import com.seriestudio.backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Verificar se já existem usuários de teste
        if (usuarioRepository.findByEmail("admin@seriestudio.com").isEmpty()) {
            // Criar administrador padrão
            Administrador admin = new Administrador();
            admin.setNome("Administrador");
            admin.setEmail("admin@seriestudio.com");
            admin.setSenhaHash(passwordEncoder.encode("admin123"));
            admin.setTipoUsuario("ADMIN");
            admin.setNomeUsuario("admin");
            admin.setNivelPermissao(1);
            usuarioRepository.save(admin);
            System.out.println("✓ Administrador padrão criado: admin@seriestudio.com / admin123");
        }

        // Verificar se já existe cliente de teste
        if (usuarioRepository.findByEmail("cliente@seriestudio.com").isEmpty()) {
            // Criar cliente padrão
            Cliente cliente = new Cliente();
            cliente.setNome("Cliente Teste");
            cliente.setEmail("cliente@seriestudio.com");
            cliente.setSenhaHash(passwordEncoder.encode("cliente123"));
            cliente.setTipoUsuario("CLIENTE");
            cliente.setCpfCnpj("12345678901234");
            cliente.setWhatsapp("11987654321");
            cliente.setEndereco("Rua Teste, 123, São Paulo - SP");
            usuarioRepository.save(cliente);
            System.out.println("✓ Cliente padrão criado: cliente@seriestudio.com / cliente123");
        }
    }
}
