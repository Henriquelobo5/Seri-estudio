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
import java.util.Set;

@Service
public class PedidoService {
    private static final String ETAPA_CORTE = "CORTE";
    private static final String ETAPA_EXPEDICAO = "EXPEDICAO";
    private static final String STATUS_AGUARDANDO_ANALISE = "AGUARDANDO_ANALISE";
    private static final String STATUS_ORCAMENTO_ENVIADO = "ORCAMENTO_ENVIADO";
    private static final String STATUS_EM_PRODUCAO = "EM_PRODUCAO";
    private static final String STATUS_PRONTO_PARA_RETIRADA = "PRONTO_PARA_RETIRADA";
    private static final String STATUS_ENTREGUE = "ENTREGUE";
    private static final String STATUS_CANCELADO = "CANCELADO";
    private static final Set<String> ETAPAS_VALIDAS = Set.of(
            ETAPA_CORTE,
            "ESTAMPARIA",
            "COSTURA",
            "REVISAO",
            "EXPEDICAO"
    );
    private static final Set<String> STATUS_VALIDOS = Set.of(
            STATUS_AGUARDANDO_ANALISE,
            STATUS_ORCAMENTO_ENVIADO,
            STATUS_EM_PRODUCAO,
            STATUS_PRONTO_PARA_RETIRADA,
            STATUS_ENTREGUE,
            STATUS_CANCELADO
    );

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private FichaTecnicaRepository fichaTecnicaRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private WhatsappNotificationService whatsappNotificationService;

    public Pedido criar(PedidoRequest req, String email) {
        Cliente cliente = clienteRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Cliente nao encontrado"));

        FichaTecnica ficha = fichaTecnicaRepository.findById(req.fichaId)
                .orElseThrow(() -> new RuntimeException("Ficha tecnica nao encontrada"));

        Pedido pedido = new Pedido();
        pedido.setCliente(cliente);
        pedido.setFichaTecnica(ficha);
        pedido.setDataAbertura(LocalDateTime.now());
        pedido.setStatusAtual(STATUS_AGUARDANDO_ANALISE);
        pedido.setEtapaProducao(ETAPA_CORTE);
        pedido.setQuantidades(req.quantidades);
        pedido.setObservacoes(req.observacoes);

        Pedido salvo = pedidoRepository.save(pedido);
        whatsappNotificationService.notificarNovoOrcamentoParaEmpresa(salvo);
        return salvo;
    }

    public List<Pedido> listarTodosParaAdmin() {
        return pedidoRepository.findAllByOrderByDataAberturaDesc();
    }

    public List<Pedido> listarPorCliente(String email) {
        Cliente cliente = clienteRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Cliente nao encontrado"));
        return pedidoRepository.findByClienteOrderByDataAberturaDesc(cliente);
    }

    public Pedido buscarPorId(Long id, String email) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pedido nao encontrado"));
        if (!pedido.getCliente().getEmail().equals(email)) {
            throw new RuntimeException("Acesso negado");
        }
        return garantirEtapaProducao(pedido);
    }

    public Pedido cancelar(Long id, String email) {
        Pedido pedido = buscarPorId(id, email);
        if (!isStatusInicial(pedido.getStatusAtual())) {
            throw new RuntimeException("So e possivel cancelar pedidos aguardando analise");
        }
        pedido.setStatusAtual(STATUS_CANCELADO);
        return pedidoRepository.save(pedido);
    }

    public Pedido atualizarEtapaProducao(Long id, String etapaProducao) {
        return atualizarEtapaProducao(id, etapaProducao, false);
    }

    public Pedido atualizarEtapaProducao(Long id, String etapaProducao, boolean notificarCliente) {
        String etapaNormalizada = normalizarEtapa(etapaProducao);
        if (!ETAPAS_VALIDAS.contains(etapaNormalizada)) {
            throw new RuntimeException("Etapa de producao invalida");
        }

        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pedido nao encontrado"));

        String etapaAnterior = garantirEtapaProducao(pedido).getEtapaProducao();
        pedido.setEtapaProducao(etapaNormalizada);
        Pedido salvo = pedidoRepository.save(pedido);
        whatsappNotificationService.notificarEtapaClienteSePermitido(salvo, etapaAnterior, etapaNormalizada, notificarCliente);
        return salvo;
    }

    public Pedido atualizarStatusAtual(Long id, String statusAtual) {
        String statusNormalizado = normalizarStatusAtual(statusAtual);
        if (!STATUS_VALIDOS.contains(statusNormalizado)) {
            throw new RuntimeException("Status do pedido invalido");
        }

        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pedido nao encontrado"));

        pedido.setStatusAtual(statusNormalizado);
        garantirEtapaCompativel(pedido, statusNormalizado);
        return pedidoRepository.save(pedido);
    }

    public Pedido garantirEtapaProducao(Pedido pedido) {
        if (pedido.getEtapaProducao() == null || pedido.getEtapaProducao().isBlank()) {
            pedido.setEtapaProducao(ETAPA_CORTE);
        }
        return pedido;
    }

    private String normalizarEtapa(String etapaProducao) {
        if (etapaProducao == null) {
            return "";
        }

        return etapaProducao.trim().toUpperCase();
    }

    private String normalizarStatusAtual(String statusAtual) {
        if (statusAtual == null) {
            return "";
        }

        String normalizado = statusAtual.trim().toUpperCase().replace(' ', '_').replace('/', '_');
        while (normalizado.contains("__")) {
            normalizado = normalizado.replace("__", "_");
        }

        if ("AGUARDANDO_ORCAMENTO".equals(normalizado)) {
            return STATUS_AGUARDANDO_ANALISE;
        }

        if ("PRONTO_P_RETIRADA".equals(normalizado)) {
            return STATUS_PRONTO_PARA_RETIRADA;
        }

        return normalizado;
    }

    private boolean isStatusInicial(String statusAtual) {
        String statusNormalizado = normalizarStatusAtual(statusAtual);
        return STATUS_AGUARDANDO_ANALISE.equals(statusNormalizado);
    }

    private void garantirEtapaCompativel(Pedido pedido, String statusAtual) {
        if (STATUS_EM_PRODUCAO.equals(statusAtual) && (pedido.getEtapaProducao() == null || pedido.getEtapaProducao().isBlank())) {
            pedido.setEtapaProducao(ETAPA_CORTE);
            return;
        }

        if (STATUS_PRONTO_PARA_RETIRADA.equals(statusAtual) || STATUS_ENTREGUE.equals(statusAtual)) {
            pedido.setEtapaProducao(ETAPA_EXPEDICAO);
        }
    }
}
