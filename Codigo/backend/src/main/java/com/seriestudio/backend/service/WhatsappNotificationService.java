package com.seriestudio.backend.service;

import com.seriestudio.backend.model.NotificacaoWhatsapp;
import com.seriestudio.backend.model.Pedido;
import com.seriestudio.backend.model.FichaTecnica;
import com.seriestudio.backend.repository.NotificacaoWhatsappRepository;
import com.seriestudio.backend.service.whatsapp.WhatsappProvider;
import com.seriestudio.backend.service.whatsapp.WhatsappSendResult;
import com.seriestudio.backend.service.whatsapp.ZApiProperties;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class WhatsappNotificationService {
    private static final String STATUS_ENVIADA = "ENVIADA";
    private static final String STATUS_FALHOU = "FALHOU";
    private static final String TIPO_ORCAMENTO_EMPRESA = "ORCAMENTO_RECEBIDO_EMPRESA";
    private static final String TIPO_ETAPA_CLIENTE = "PEDIDO_ENTROU_ETAPA";

    private final NotificacaoWhatsappRepository repository;
    private final WhatsappProvider whatsappProvider;
    private final ZApiProperties properties;

    public WhatsappNotificationService(
            NotificacaoWhatsappRepository repository,
            WhatsappProvider whatsappProvider,
            ZApiProperties properties
    ) {
        this.repository = repository;
        this.whatsappProvider = whatsappProvider;
        this.properties = properties;
    }

    public void notificarNovoOrcamentoParaEmpresa(Pedido pedido) {
        String destinatario = normalizarTelefone(properties.getEmpresaWhatsapp());
        if (destinatario.isBlank()) {
            salvarFalha(pedido, "", TIPO_ORCAMENTO_EMPRESA, null, buildMensagemOrcamentoEmpresa(pedido),
                    "Configure zapi.empresa-whatsapp");
            return;
        }

        enviar(pedido, destinatario, TIPO_ORCAMENTO_EMPRESA, null, buildMensagemOrcamentoEmpresa(pedido));
    }

    public void notificarEtapaClienteSePermitido(Pedido pedido, String etapaAnterior, String etapaNova, boolean notificarCliente) {
        if (!notificarCliente || etapaAnterior == null || etapaAnterior.equals(etapaNova)) {
            return;
        }

        if (!isAvancoEtapa(etapaAnterior, etapaNova)) {
            return;
        }

        boolean jaEnviou = repository.existsByPedidoIdPedAndTipoAndEtapaProducaoAndStatusIn(
                pedido.getIdPed(),
                TIPO_ETAPA_CLIENTE,
                etapaNova,
                List.of(STATUS_ENVIADA)
        );
        if (jaEnviou) {
            return;
        }

        String destinatario = pedido.getCliente() != null ? normalizarTelefone(pedido.getCliente().getWhatsapp()) : "";
        if (destinatario.isBlank()) {
            salvarFalha(pedido, "", TIPO_ETAPA_CLIENTE, etapaNova, buildMensagemEtapaCliente(pedido, etapaNova),
                    "Cliente sem WhatsApp cadastrado");
            return;
        }

        enviar(pedido, destinatario, TIPO_ETAPA_CLIENTE, etapaNova, buildMensagemEtapaCliente(pedido, etapaNova));
    }

    private void enviar(Pedido pedido, String destinatario, String tipo, String etapaProducao, String mensagem) {
        NotificacaoWhatsapp notificacao = criarNotificacao(pedido, destinatario, tipo, etapaProducao, mensagem);
        notificacao.setTentativas(1);

        try {
            WhatsappSendResult result = whatsappProvider.enviarTexto(destinatario, mensagem);
            notificacao.setStatus(STATUS_ENVIADA);
            notificacao.setProviderMessageId(result.providerMessageId());
            notificacao.setEnviadoEm(LocalDateTime.now());
        } catch (RuntimeException e) {
            notificacao.setStatus(STATUS_FALHOU);
            notificacao.setErro(e.getMessage());
        }

        repository.save(notificacao);
    }

    private void salvarFalha(Pedido pedido, String destinatario, String tipo, String etapaProducao, String mensagem, String erro) {
        NotificacaoWhatsapp notificacao = criarNotificacao(pedido, destinatario, tipo, etapaProducao, mensagem);
        notificacao.setStatus(STATUS_FALHOU);
        notificacao.setTentativas(0);
        notificacao.setErro(erro);
        repository.save(notificacao);
    }

    private NotificacaoWhatsapp criarNotificacao(Pedido pedido, String destinatario, String tipo, String etapaProducao, String mensagem) {
        NotificacaoWhatsapp notificacao = new NotificacaoWhatsapp();
        notificacao.setPedido(pedido);
        notificacao.setDestinatario(destinatario);
        notificacao.setTipo(tipo);
        notificacao.setMensagem(mensagem);
        notificacao.setStatus("PENDENTE");
        notificacao.setEtapaProducao(etapaProducao);
        notificacao.setTentativas(0);
        notificacao.setCriadoEm(LocalDateTime.now());
        return notificacao;
    }

    private String buildMensagemOrcamentoEmpresa(Pedido pedido) {
        FichaTecnica ficha = pedido.getFichaTecnica();
        return String.join("\n",
                "🧵 *Novo orçamento recebido!*",
                "━━━━━━━━━━━━━━━━━━━━",
                "📋 *Código:* " + codigoPedido(pedido),
                "👤 *Cliente:* " + valorOuTraco(pedido.getCliente() != null ? pedido.getCliente().getNome() : null),
                "📱 *WhatsApp:* " + valorOuTraco(pedido.getCliente() != null ? pedido.getCliente().getWhatsapp() : null),
                "👕 *Produto:* " + valorOuTraco(ficha != null ? ficha.getProdutoTipo() : null),
                "📦 *Qtd:* " + valorOuTraco(pedido.getQuantidades()),
                "✏️ *Obs:* " + valorOuTraco(pedido.getObservacoes()),
                "━━━━━━━━━━━━━━━━━━━━",
                "Acesse o painel para analisar o pedido."
        );
    }

    private String buildMensagemEtapaCliente(Pedido pedido, String etapaNova) {
        return String.join("\n",
                "🔄 *Atualização do seu pedido!*",
                "━━━━━━━━━━━━━━━━━━━━",
                "📋 *Pedido:* " + codigoPedido(pedido),
                "🏭 *Etapa atual:* " + formatarEtapa(etapaNova),
                "━━━━━━━━━━━━━━━━━━━━",
                "Acompanhe pelo painel da Seri. 👇"
        );
    }

    private String codigoPedido(Pedido pedido) {
        if (pedido.getFichaTecnica() != null && pedido.getFichaTecnica().getCodigoDisplay() != null) {
            return pedido.getFichaTecnica().getCodigoDisplay();
        }

        return "SERI-" + pedido.getIdPed();
    }

    private String normalizarTelefone(String value) {
        if (value == null) {
            return "";
        }

        return value.replaceAll("[^0-9]", "");
    }

    private String valorOuTraco(String value) {
        return value == null || value.isBlank() ? "-" : value;
    }

    private boolean isAvancoEtapa(String anterior, String nova) {
        return ordemEtapa(nova) > ordemEtapa(anterior);
    }

    private int ordemEtapa(String etapa) {
        return switch (etapa) {
            case "CORTE" -> 1;
            case "ESTAMPARIA" -> 2;
            case "COSTURA" -> 3;
            case "REVISAO" -> 4;
            case "EXPEDICAO" -> 5;
            default -> 0;
        };
    }

    private String formatarEtapa(String etapa) {
        return switch (etapa) {
            case "CORTE" -> "Corte";
            case "ESTAMPARIA" -> "Estamparia";
            case "COSTURA" -> "Costura";
            case "REVISAO" -> "Revisao";
            case "EXPEDICAO" -> "Expedicao";
            default -> etapa;
        };
    }
}
