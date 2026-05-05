package com.seriestudio.backend.config;

import com.seriestudio.backend.model.Insumo;
import com.seriestudio.backend.model.usuario.Cliente;
import com.seriestudio.backend.model.usuario.Administrador;
import com.seriestudio.backend.repository.InsumoRepository;
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
    private InsumoRepository insumoRepository;

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

        // Seed de insumos iniciais
        if (insumoRepository.count() == 0) {
            salvarInsumo("Tinta Plastisol Branca", "TINTA", 50, 10, "kg", 45.00, 0.05);
            salvarInsumo("Tinta Plastisol Preta", "TINTA", 30, 10, "kg", 42.00, 0.05);
            salvarInsumo("Tinta Base Água Vermelha", "TINTA", 8, 10, "L", 38.00, 0.08);
            salvarInsumo("Tela 120 fios 50x60cm", "TELA", 12, 5, "un", 85.00, null);
            salvarInsumo("Tela 90 fios 50x60cm", "TELA", 4, 5, "un", 75.00, null);
            salvarInsumo("Emulsão Fotográfica Diazo", "EMULSAO", 6, 3, "kg", 120.00, 0.02);
            salvarInsumo("Algodão branco 30/1", "TECIDO", 200, 50, "m", 18.00, 0.5);
            salvarInsumo("Poliéster mescla", "TECIDO", 150, 50, "m", 22.00, 0.5);
            System.out.println("✓ Seed de 8 insumos criado");
        }
    }

    private void salvarInsumo(
            String nomeItem,
            String categoria,
            Integer qtdEstoque,
            Integer qtdMinima,
            String unidadeMedida,
            Double precoUnitario,
            Double consumoPorPeca
    ) {
        Insumo insumo = new Insumo();
        insumo.setNomeItem(nomeItem);
        insumo.setCategoria(categoria);
        insumo.setQtdEstoque(qtdEstoque);
        insumo.setQtdMinima(qtdMinima);
        insumo.setUnidadeMedida(unidadeMedida);
        insumo.setPrecoUnitario(precoUnitario);
        insumo.setConsumoPorPeca(consumoPorPeca);
        insumoRepository.save(insumo);
    }
}
