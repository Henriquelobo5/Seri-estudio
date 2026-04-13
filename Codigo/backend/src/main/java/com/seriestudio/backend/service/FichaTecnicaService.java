package com.seriestudio.backend.service;

import com.seriestudio.backend.dto.FichaTecnicaRequest;
import com.seriestudio.backend.model.FichaTecnica;
import com.seriestudio.backend.model.usuario.Cliente;
import com.seriestudio.backend.repository.ClienteRepository;
import com.seriestudio.backend.repository.FichaTecnicaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class FichaTecnicaService {

    @Autowired
    private FichaTecnicaRepository fichaTecnicaRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    public FichaTecnica criar(FichaTecnicaRequest req, String email) {
        Cliente cliente = clienteRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Cliente não encontrado"));

        FichaTecnica ficha = new FichaTecnica();
        ficha.setIdentificacao(req.identificacao);
        ficha.setProdutoTipo(req.produtoTipo);
        ficha.setEspecificacoes(req.especificacoes);
        ficha.setUrlArte(req.urlArte);
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

    private String gerarCodigoDisplay(Long id) {
        return String.format("SERI-%d-%04d", LocalDateTime.now().getYear(), id);
    }
}
