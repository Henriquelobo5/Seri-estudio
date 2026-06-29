package com.seriestudio.backend.service;

import com.seriestudio.backend.dto.FichaTecnicaRequest;
import com.seriestudio.backend.model.FichaTecnica;
import com.seriestudio.backend.model.usuario.Cliente;
import com.seriestudio.backend.repository.ClienteRepository;
import com.seriestudio.backend.repository.FichaTecnicaRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class FichaTecnicaService {

    @Autowired
    private FichaTecnicaRepository fichaTecnicaRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Value("${ficha.upload.dir:/app/uploads/fichas}")
    private String uploadDir;

    @Value("${ficha.upload.url-prefix:http://localhost:8080/ficha-tecnica/preview}")
    private String urlPrefix;

    public FichaTecnica criar(FichaTecnicaRequest req, String email) {
        Cliente cliente = clienteRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Cliente não encontrado"));

        FichaTecnica ficha = new FichaTecnica();
        ficha.setIdentificacao(req.identificacao);
        ficha.setProdutoTipo(req.produtoTipo);
        ficha.setEspecificacoes(req.especificacoes);
        ficha.setUrlArte(req.urlArte);
        ficha.setCor(req.cor);
        ficha.setArtesPorPecaJson(req.artesPorPecaJson);
        ficha.setCliente(cliente);
        ficha.setDataAbertura(LocalDateTime.now());

        FichaTecnica salva = fichaTecnicaRepository.save(ficha);

        salva.setCodigoDisplay(gerarCodigoDisplay(salva.getCodUnico()));
        return fichaTecnicaRepository.save(salva);
    }

    public List<FichaTecnica> listarPorCliente(String email) {
        Cliente cliente = clienteRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Cliente não encontrado"));
        return fichaTecnicaRepository.findByClienteOrderByDataAberturaDesc(cliente);
    }

    public String proximoCodigo() {
        long proximo = fichaTecnicaRepository.count() + 1;
        return String.format("SERI-%d-%04d", LocalDateTime.now().getYear(), proximo);
    }

    public String salvarPreview(Long fichaId, MultipartFile file) {
        FichaTecnica ficha = fichaTecnicaRepository.findById(fichaId)
                .orElseThrow(() -> new RuntimeException("Ficha não encontrada"));

        try {
            Path dir = Paths.get(uploadDir);
            Files.createDirectories(dir);
            String filename = UUID.randomUUID() + ".png";
            Files.write(dir.resolve(filename), file.getBytes());
            String url = urlPrefix + "/" + filename;
            ficha.setUrlPreview(url);
            fichaTecnicaRepository.save(ficha);
            return url;
        } catch (IOException e) {
            throw new RuntimeException("Erro ao salvar preview: " + e.getMessage());
        }
    }

    public String salvarArte(Long fichaId, MultipartFile file) {
        FichaTecnica ficha = fichaTecnicaRepository.findById(fichaId)
                .orElseThrow(() -> new RuntimeException("Ficha não encontrada"));

        try {
            Path dir = Paths.get(uploadDir);
            Files.createDirectories(dir);
            String filename = UUID.randomUUID() + ".png";
            Files.write(dir.resolve(filename), file.getBytes());
            String url = urlPrefix + "/" + filename;
            ficha.setUrlArte(url);
            fichaTecnicaRepository.save(ficha);
            return url;
        } catch (IOException e) {
            throw new RuntimeException("Erro ao salvar arte: " + e.getMessage());
        }
    }

    public String salvarArtePeca(Long fichaId, String tipo, MultipartFile file) {
        FichaTecnica ficha = fichaTecnicaRepository.findById(fichaId)
                .orElseThrow(() -> new RuntimeException("Ficha não encontrada"));

        try {
            Path dir = Paths.get(uploadDir);
            Files.createDirectories(dir);
            String filename = UUID.randomUUID() + ".png";
            Files.write(dir.resolve(filename), file.getBytes());
            String url = urlPrefix + "/" + filename;

            // Inject urlArte into the matching tipo entry in artesPorPecaJson
            String jsonAtual = ficha.getArtesPorPecaJson();
            if (jsonAtual != null && !jsonAtual.isBlank()) {
                ficha.setArtesPorPecaJson(injetarUrlArte(jsonAtual, tipo, url));
            }

            // Keep urlArte as the first art for backward compat
            if (ficha.getUrlArte() == null || ficha.getUrlArte().isBlank()) {
                ficha.setUrlArte(url);
            }

            fichaTecnicaRepository.save(ficha);
            return url;
        } catch (IOException e) {
            throw new RuntimeException("Erro ao salvar arte da peça: " + e.getMessage());
        }
    }

    private String injetarUrlArte(String json, String tipo, String url) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            List<Map<String, Object>> artes = mapper.readValue(json, new TypeReference<>() {});
            for (Map<String, Object> arte : artes) {
                if (tipo.equalsIgnoreCase(String.valueOf(arte.get("tipo")))) {
                    arte.put("urlArte", url);
                    break;
                }
            }
            return mapper.writeValueAsString(artes);
        } catch (Exception e) {
            return json;
        }
    }

    private String gerarCodigoDisplay(Long id) {
        return String.format("SERI-%d-%04d", LocalDateTime.now().getYear(), id);
    }
}
