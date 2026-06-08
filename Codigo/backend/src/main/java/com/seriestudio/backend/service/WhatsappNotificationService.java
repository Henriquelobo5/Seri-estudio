package com.seriestudio.backend.service;

import com.seriestudio.backend.model.FichaTecnica;
import com.seriestudio.backend.model.NotificacaoWhatsapp;
import com.seriestudio.backend.model.Pedido;
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
    private static final String TIPO_CONFIRMACAO_CLIENTE = "ORCAMENTO_CONFIRMADO_CLIENTE";
    private static final String TIPO_STATUS_CLIENTE = "PEDIDO_STATUS_CLIENTE";

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
            salvarFalha(
                    pedido,
                    "",
                    TIPO_ORCAMENTO_EMPRESA,
                    null,
                    buildMensagemOrcamentoEmpresa(pedido),
                    "Configure zapi.empresa-whatsapp"
            );
            return;
        }

        enviar(pedido, destinatario, TIPO_ORCAMENTO_EMPRESA, null, buildMensagemOrcamentoEmpresa(pedido));
    }

    public void notificarConfirmacaoPedidoCliente(Pedido pedido) {
        String destinatario = telefoneCliente(pedido);
        if (destinatario.isBlank()) {
            salvarFalha(
                    pedido,
                    "",
                    TIPO_CONFIRMACAO_CLIENTE,
                    null,
                    buildMensagemConfirmacaoCliente(pedido),
                    "Cliente sem WhatsApp cadastrado"
            );
            return;
        }

        enviar(pedido, destinatario, TIPO_CONFIRMACAO_CLIENTE, null, buildMensagemConfirmacaoCliente(pedido));
    }

    public void notificarStatusCliente(Pedido pedido, String statusNovo) {
        if (!isStatusComMensagemCliente(statusNovo)) {
            return;
        }

        boolean jaEnviou = repository.existsByPedidoIdPedAndTipoAndEtapaProducaoAndStatusIn(
                pedido.getIdPed(),
                TIPO_STATUS_CLIENTE,
                statusNovo,
                List.of(STATUS_ENVIADA)
        );
        if (jaEnviou) {
            return;
        }

        String destinatario = telefoneCliente(pedido);
        if (destinatario.isBlank()) {
            salvarFalha(
                    pedido,
                    "",
                    TIPO_STATUS_CLIENTE,
                    statusNovo,
                    buildMensagemStatusCliente(pedido, statusNovo),
                    "Cliente sem WhatsApp cadastrado"
            );
            return;
        }

        enviar(pedido, destinatario, TIPO_STATUS_CLIENTE, statusNovo, buildMensagemStatusCliente(pedido, statusNovo));
    }

    private void enviar(Pedido pedido, String destinatario, String tipo, String contexto, String mensagem) {
        NotificacaoWhatsapp notificacao = criarNotificacao(pedido, destinatario, tipo, contexto, mensagem);
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

    private void salvarFalha(Pedido pedido, String destinatario, String tipo, String contexto, String mensagem, String erro) {
        NotificacaoWhatsapp notificacao = criarNotificacao(pedido, destinatario, tipo, contexto, mensagem);
        notificacao.setStatus(STATUS_FALHOU);
        notificacao.setTentativas(0);
        notificacao.setErro(erro);
        repository.save(notificacao);
    }

    private NotificacaoWhatsapp criarNotificacao(Pedido pedido, String destinatario, String tipo, String contexto, String mensagem) {
        NotificacaoWhatsapp notificacao = new NotificacaoWhatsapp();
        notificacao.setPedido(pedido);
        notificacao.setDestinatario(destinatario);
        notificacao.setTipo(tipo);
        notificacao.setMensagem(mensagem);
        notificacao.setStatus("PENDENTE");
        notificacao.setEtapaProducao(contexto);
        notificacao.setTentativas(0);
        notificacao.setCriadoEm(LocalDateTime.now());
        return notificacao;
    }

    private String buildMensagemOrcamentoEmpresa(Pedido pedido) {
        FichaTecnica ficha = pedido.getFichaTecnica();
        return String.join("\n",
                "\uD83E\uDDF5 *Novo orçamento recebido!*",
                "",
                "\uD83D\uDCCB *Código:* " + codigoPedido(pedido),
                "\uD83D\uDC64 *Cliente:* " + valorOuTraco(pedido.getCliente() != null ? pedido.getCliente().getNome() : null),
                "\uD83D\uDCF1 *WhatsApp:* " + valorOuTraco(pedido.getCliente() != null ? pedido.getCliente().getWhatsapp() : null),
                "\uD83D\uDC55 *Produto:* " + valorOuTraco(ficha != null ? ficha.getProdutoTipo() : null),
                "\uD83D\uDCE6 *Qtd:* " + valorOuTraco(pedido.getQuantidades()),
                "\u270F\uFE0F *Obs:* " + valorOuTraco(pedido.getObservacoes()),
                "",
                "Acesse o painel para analisar o pedido."
        );
    }

    private String buildMensagemConfirmacaoCliente(Pedido pedido) {
        FichaTecnica ficha = pedido.getFichaTecnica();
        return String.join("\n",
                "\u2705 *Orçamento recebido!*",
                "",
                "\uD83D\uDCCB *Pedido:* " + codigoPedido(pedido),
                "\uD83D\uDC55 *Produto:* " + valorOuTraco(ficha != null ? ficha.getProdutoTipo() : null),
                "\uD83D\uDCE6 *Qtd:* " + valorOuTraco(pedido.getQuantidades()),
                "",
                "Em breve nossa equipe entrará em contato. \uD83E\uDDF5"
        );
    }

    private String buildMensagemStatusCliente(Pedido pedido, String status) {
        String emoji = switch (status) {
            case "EM_PRODUCAO" -> "\uD83C\uDFED";
            case "PRONTO_PARA_RETIRADA" -> "\uD83C\uDF89";
            case "EM_TRANSITO" -> "\uD83D\uDE9A";
            case "ENTREGUE" -> "\uD83D\uDCE6";
            default -> "\uD83D\uDCEB";
        };
        String titulo = switch (status) {
            case "EM_PRODUCAO" -> "Seu pedido entrou em produção!";
            case "PRONTO_PARA_RETIRADA" -> "Seu pedido está pronto!";
            case "EM_TRANSITO" -> "Seu pedido está em trânsito!";
            case "ENTREGUE" -> "Pedido entregue!";
            default -> "Atualização do pedido";
        };
        String detalhe = switch (status) {
            case "EM_PRODUCAO" -> "Nossa equipe já está trabalhando nas suas peças. \uD83E\uDDF5";
            case "PRONTO_PARA_RETIRADA" -> "Seu pedido está pronto para retirada. Entre em contato para combinar a entrega.";
            case "EM_TRANSITO" -> "Seu pedido saiu para entrega. Em breve ele chega até você.";
            case "ENTREGUE" -> "Seu pedido foi entregue. Obrigado pela preferência! \uD83D\uDE4F";
            default -> "Acompanhe seu pedido pelo painel da Seri.";
        };

        return String.join("\n",
                emoji + " *" + titulo + "*",
                "",
                "\uD83D\uDCCB *Pedido:* " + codigoPedido(pedido),
                "",
                detalhe
        );
    }

    private String codigoPedido(Pedido pedido) {
        if (pedido.getFichaTecnica() != null && pedido.getFichaTecnica().getCodigoDisplay() != null) {
            return pedido.getFichaTecnica().getCodigoDisplay();
        }

        return "SERI-" + pedido.getIdPed();
    }

    private String telefoneCliente(Pedido pedido) {
        return pedido.getCliente() != null ? normalizarTelefone(pedido.getCliente().getWhatsapp()) : "";
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

    private boolean isStatusComMensagemCliente(String status) {
        return "EM_PRODUCAO".equals(status)
                || "PRONTO_PARA_RETIRADA".equals(status)
                || "EM_TRANSITO".equals(status)
                || "ENTREGUE".equals(status);
    }
}
