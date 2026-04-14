package com.seriestudio.backend.service;

import com.seriestudio.backend.dto.PedidoRequest;
import com.seriestudio.backend.model.FichaTecnica;
import com.seriestudio.backend.model.Pedido;
import com.seriestudio.backend.model.usuario.Cliente;
import com.seriestudio.backend.repository.ClienteRepository;
import com.seriestudio.backend.repository.FichaTecnicaRepository;
import com.seriestudio.backend.repository.PedidoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PedidoService {

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private FichaTecnicaRepository fichaTecnicaRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    public Pedido criar(PedidoRequest req, String email) {
        Cliente cliente = clienteRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Cliente não encontrado"));

        FichaTecnica ficha = fichaTecnicaRepository.findById(req.fichaId)
                .orElseThrow(() -> new RuntimeException("Ficha técnica não encontrada"));

        Pedido pedido = new Pedido();
        pedido.setCliente(cliente);
        pedido.setFichaTecnica(ficha);
        pedido.setDataAbertura(LocalDateTime.now());
        pedido.setStatusAtual("AGUARDANDO_ORCAMENTO");
        pedido.setQuantidades(req.quantidades);
        pedido.setObservacoes(req.observacoes);

        return pedidoRepository.save(pedido);
    }

    public List<Pedido> listarPorCliente(String email) {
        Cliente cliente = clienteRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Cliente não encontrado"));
        return pedidoRepository.findByClienteOrderByDataAberturaDesc(cliente);
    }

    public Pedido buscarPorId(Long id, String email) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pedido não encontrado"));
        if (!pedido.getCliente().getEmail().equals(email)) {
            throw new RuntimeException("Acesso negado");
        }
        return pedido;
    }

    public Pedido cancelar(Long id, String email) {
        Pedido pedido = buscarPorId(id, email);
        if (!"AGUARDANDO_ORCAMENTO".equals(pedido.getStatusAtual())) {
            throw new RuntimeException("Só é possível cancelar pedidos aguardando orçamento");
        }
        pedido.setStatusAtual("CANCELADO");
        return pedidoRepository.save(pedido);
    }
}
