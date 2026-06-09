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
import java.util.ArrayList;
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
        List<String> linhas = new ArrayList<>();

        linhas.add("\uD83E\uDDFE *NOVO PEDIDO RECEBIDO*");
        linhas.add("");
        linhas.add("\uD83D\uDCCC *CÓDIGO DO PEDIDO:* " + codigoPedido(pedido));
        linhas.add("");
        linhas.add("\uD83D\uDC64 *NOME DO CLIENTE:* " + valorOuTraco(pedido.getCliente() != null ? pedido.getCliente().getNome() : null));
        linhas.add("\uD83D\uDCF2 *WHATSAPP DO CLIENTE:* " + valorOuTraco(pedido.getCliente() != null ? pedido.getCliente().getWhatsapp() : null));

        if (ficha != null && ficha.getProdutoTipo() != null && !ficha.getProdutoTipo().isBlank()) {
            linhas.add("");
            linhas.add("\uD83D\uDC55 *TIPO(S) DE PEÇA:*");
            for (String tipo : ficha.getProdutoTipo().split(",\\s*")) {
                linhas.add("• " + tipo.trim());
            }
        }

        String cor = ficha != null ? ficha.getCor() : null;
        if (cor != null && !cor.isBlank()) {
            linhas.add("");
            linhas.add("\uD83C\uDFA8 *COR POR TIPO:*");
            for (String entry : cor.split(",\\s*")) {
                linhas.add("• " + entry.trim());
            }
        }

        String qtd = pedido.getQuantidades();
        if (qtd != null && !qtd.isBlank()) {
            linhas.add("");
            linhas.add("\uD83D\uDCE6 *QUANTIDADES POR TIPO E TAMANHO:*");
            for (String entry : qtd.split(",")) {
                linhas.add("• " + entry.trim().replaceAll(":(\\d)", ": $1"));
            }
        }

        String obs = pedido.getObservacoes();
        if (obs != null && !obs.isBlank()) {
            linhas.add("");
            linhas.add("\uD83D\uDCDD *OBSERVAÇÕES DO CLIENTE:*");
            linhas.add(obs);
        }

        linhas.add("");
        linhas.add("⚠️ Acesse o painel para analisar o pedido, conferir os detalhes e dar andamento no orçamento.");

        return String.join("\n", linhas);
    }

    private String buildMensagemConfirmacaoCliente(Pedido pedido) {
        FichaTecnica ficha = pedido.getFichaTecnica();
        String nomeCliente = pedido.getCliente() != null ? pedido.getCliente().getNome() : null;
        String primeiroNome = (nomeCliente != null && !nomeCliente.isBlank()) ? nomeCliente.split("\\s+")[0] : "cliente";
        List<String> linhas = new ArrayList<>();

        linhas.add("Oi, " + primeiroNome + " \uD83D\uDC4B");
        linhas.add("");
        linhas.add("Recebemos seu pedido de orçamento com sucesso \u2705");
        linhas.add("");
        linhas.add("\uD83D\uDCCC *CÓDIGO DO PEDIDO:* " + codigoPedido(pedido));

        if (ficha != null && ficha.getProdutoTipo() != null && !ficha.getProdutoTipo().isBlank()) {
            linhas.add("");
            linhas.add("\uD83D\uDC55 *TIPO(S) DE PEÇA:*");
            for (String tipo : ficha.getProdutoTipo().split(",\\s*")) {
                linhas.add("• " + tipo.trim());
            }
        }

        String cor = ficha != null ? ficha.getCor() : null;
        if (cor != null && !cor.isBlank()) {
            linhas.add("");
            linhas.add("\uD83C\uDFA8 *COR POR TIPO:*");
            for (String entry : cor.split(",\\s*")) {
                linhas.add("• " + entry.trim());
            }
        }

        String qtd = pedido.getQuantidades();
        if (qtd != null && !qtd.isBlank()) {
            linhas.add("");
            linhas.add("\uD83D\uDCE6 *QUANTIDADES:*");
            for (String entry : qtd.split(",")) {
                linhas.add("• " + entry.trim().replaceAll(":(\\d)", ": $1"));
            }
        }

        linhas.add("");
        linhas.add("Nossa equipe vai analisar tudo certinho e entrar em contato com você em breve pelo WhatsApp \uD83D\uDCAC");

        return String.join("\n", linhas);
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
            case "EM_PRODUCAO" -> "SEU PEDIDO ENTROU EM PRODUÇÃO";
            case "PRONTO_PARA_RETIRADA" -> "SEU PEDIDO ESTÁ PRONTO";
            case "EM_TRANSITO" -> "SEU PEDIDO ESTÁ EM TRÂNSITO";
            case "ENTREGUE" -> "PEDIDO ENTREGUE";
            default -> "ATUALIZAÇÃO DO PEDIDO";
        };
        String detalhe = switch (status) {
            case "EM_PRODUCAO" -> "suas peças já começaram a ser produzidas \uD83E\uDDF5";
            case "PRONTO_PARA_RETIRADA" -> "seu pedido já está pronto para retirada \u2705";
            case "EM_TRANSITO" -> "seu pedido saiu para entrega \uD83D\uDCE6";
            case "ENTREGUE" -> "seu pedido foi entregue com sucesso\nobrigado pela preferência \uD83D\uDE4F";
            default -> "acompanhe seu pedido pelo painel da Seri.";
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
