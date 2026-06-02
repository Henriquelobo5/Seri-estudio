package com.seriestudio.backend.service.whatsapp;

public interface WhatsappProvider {
    WhatsappSendResult enviarTexto(String destinatario, String mensagem);
}
