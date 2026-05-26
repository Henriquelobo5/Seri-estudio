package com.seriestudio.backend.service;

import com.seriestudio.backend.dto.PortfolioRequest;
import com.seriestudio.backend.model.Portfolio;
import com.seriestudio.backend.model.usuario.Administrador;
import com.seriestudio.backend.model.usuario.Usuario;
import com.seriestudio.backend.repository.PortfolioRepository;
import com.seriestudio.backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@Service
public class PortfolioService {

    @Autowired
    private PortfolioRepository portfolioRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Value("${portfolio.upload.dir:./uploads/portfolio}")
    private String uploadDir;

    @Value("${portfolio.upload.url-prefix:http://localhost:8080/portfolio/imagens}")
    private String urlPrefix;

    public List<Portfolio> listarTodos() {
        return portfolioRepository.findAllByOrderByIdItemDesc();
    }

    public List<Portfolio> listarPorCategoria(String categoria) {
        return portfolioRepository.findByCategoriaOrderByIdItemDesc(categoria);
    }

    public Portfolio criar(PortfolioRequest req, String adminEmail) {
        Portfolio item = new Portfolio();
        item.setTitulo(req.getTitulo());
        item.setDescricaoTecnica(req.getDescricaoTecnica());
        item.setUrlImagem(req.getUrlImagem());
        item.setCategoria(req.getCategoria());
        item.setAdministrador(buscarAdmin(adminEmail));
        return portfolioRepository.save(item);
    }

    public Portfolio atualizar(Long id, PortfolioRequest req) {
        Portfolio item = buscarPorId(id);
        item.setTitulo(req.getTitulo());
        item.setDescricaoTecnica(req.getDescricaoTecnica());
        if (req.getUrlImagem() != null && !req.getUrlImagem().isBlank()) {
            item.setUrlImagem(req.getUrlImagem());
        }
        item.setCategoria(req.getCategoria());
        return portfolioRepository.save(item);
    }

    public void excluir(Long id) {
        Portfolio item = buscarPorId(id);
        String url = item.getUrlImagem();
        if (url != null && url.contains("/portfolio/imagens/")) {
            String fileName = url.substring(url.lastIndexOf('/') + 1);
            try {
                Path filePath = Paths.get(uploadDir).resolve(fileName);
                Files.deleteIfExists(filePath);
            } catch (IOException ignored) {}
        }
        portfolioRepository.delete(item);
    }

    public String salvarImagem(MultipartFile file) throws IOException {
        String ext = getExtension(file.getOriginalFilename());
        String fileName = UUID.randomUUID() + ext;
        Path dir = Paths.get(uploadDir);
        if (!Files.exists(dir)) {
            Files.createDirectories(dir);
        }
        Files.copy(file.getInputStream(), dir.resolve(fileName));
        return urlPrefix + "/" + fileName;
    }

    public Portfolio buscarPorId(Long id) {
        return portfolioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Item de portfólio não encontrado: " + id));
    }

    private Administrador buscarAdmin(String email) {
        Usuario u = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Admin não encontrado"));
        if (u instanceof Administrador admin) {
            return admin;
        }
        throw new RuntimeException("Usuário não é administrador");
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return ".jpg";
        return filename.substring(filename.lastIndexOf('.'));
    }
}
