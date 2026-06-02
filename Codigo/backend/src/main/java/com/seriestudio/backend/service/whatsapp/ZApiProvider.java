package com.seriestudio.backend.service.whatsapp;

import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class ZApiProvider implements WhatsappProvider {
    private final ZApiProperties properties;
    private final RestClient restClient;

    public ZApiProvider(ZApiProperties properties) {
        this.properties = properties;
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(properties.getConnectTimeoutSeconds()));
        requestFactory.setReadTimeout(Duration.ofSeconds(properties.getReadTimeoutSeconds()));
        this.restClient = RestClient.builder()
                .requestFactory(requestFactory)
                .build();
    }

    @Override
    public WhatsappSendResult enviarTexto(String destinatario, String mensagem) {
        if (!properties.isEnabled()) {
            throw new IllegalStateException("Z-API desativada em zapi.enabled");
        }

        if (isBlank(resolveEndpointUrl())) {
            throw new IllegalStateException("Configure zapi.instance-id e zapi.instance-token");
        }

        Map<String, String> payload = new LinkedHashMap<>();
        payload.put(properties.getPhoneField(), destinatario);
        payload.put(properties.getMessageField(), mensagem);

        RestClient.RequestBodySpec request = restClient.post()
                .uri(resolveEndpointUrl())
                .contentType(MediaType.APPLICATION_JSON);

        if (!isBlank(properties.getClientToken())) {
            request = request.header(properties.getAuthHeader(), properties.getClientToken());
        }

        Map<?, ?> response = request
                .body(payload)
                .retrieve()
                .body(Map.class);

        String messageId = null;
        if (response != null && response.containsKey(properties.getResponseIdField())) {
            Object value = response.get(properties.getResponseIdField());
            messageId = value != null ? String.valueOf(value) : null;
        }

        return new WhatsappSendResult(messageId);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String resolveEndpointUrl() {
        if (!isBlank(properties.getEndpointUrl())) {
            return properties.getEndpointUrl();
        }

        if (isBlank(properties.getBaseUrl()) || isBlank(properties.getInstanceId()) || isBlank(properties.getInstanceToken())) {
            return "";
        }

        String baseUrl = properties.getBaseUrl().replaceAll("/+$", "");
        return baseUrl + "/instances/" + properties.getInstanceId() + "/token/" + properties.getInstanceToken() + "/send-text";
    }
}
