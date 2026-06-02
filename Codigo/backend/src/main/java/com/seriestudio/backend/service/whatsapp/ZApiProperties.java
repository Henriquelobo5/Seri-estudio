package com.seriestudio.backend.service.whatsapp;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "zapi")
public class ZApiProperties {
    private String baseUrl = "https://api.z-api.io";
    private String endpointUrl;
    private String instanceId;
    private String instanceToken;
    private String clientToken;
    private String empresaWhatsapp;
    private String phoneField = "phone";
    private String messageField = "message";
    private String responseIdField = "id";
    private String authHeader = "Client-Token";
    private int connectTimeoutSeconds = 5;
    private int readTimeoutSeconds = 15;
    private boolean enabled = true;

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public String getEndpointUrl() {
        return endpointUrl;
    }

    public void setEndpointUrl(String endpointUrl) {
        this.endpointUrl = endpointUrl;
    }

    public String getInstanceId() {
        return instanceId;
    }

    public void setInstanceId(String instanceId) {
        this.instanceId = instanceId;
    }

    public String getInstanceToken() {
        return instanceToken;
    }

    public void setInstanceToken(String instanceToken) {
        this.instanceToken = instanceToken;
    }

    public String getClientToken() {
        return clientToken;
    }

    public void setClientToken(String clientToken) {
        this.clientToken = clientToken;
    }

    public String getEmpresaWhatsapp() {
        return empresaWhatsapp;
    }

    public void setEmpresaWhatsapp(String empresaWhatsapp) {
        this.empresaWhatsapp = empresaWhatsapp;
    }

    public String getPhoneField() {
        return phoneField;
    }

    public void setPhoneField(String phoneField) {
        this.phoneField = phoneField;
    }

    public String getMessageField() {
        return messageField;
    }

    public void setMessageField(String messageField) {
        this.messageField = messageField;
    }

    public String getResponseIdField() {
        return responseIdField;
    }

    public void setResponseIdField(String responseIdField) {
        this.responseIdField = responseIdField;
    }

    public String getAuthHeader() {
        return authHeader;
    }

    public void setAuthHeader(String authHeader) {
        this.authHeader = authHeader;
    }

    public int getConnectTimeoutSeconds() {
        return connectTimeoutSeconds;
    }

    public void setConnectTimeoutSeconds(int connectTimeoutSeconds) {
        this.connectTimeoutSeconds = connectTimeoutSeconds;
    }

    public int getReadTimeoutSeconds() {
        return readTimeoutSeconds;
    }

    public void setReadTimeoutSeconds(int readTimeoutSeconds) {
        this.readTimeoutSeconds = readTimeoutSeconds;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }
}
