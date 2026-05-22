package com.seriestudio.backend.dto;

public class EtapaLabelResponse {
    public Long id;
    public String idInterno;
    public String labelExibido;

    public EtapaLabelResponse(Long id, String idInterno, String labelExibido) {
        this.id = id;
        this.idInterno = idInterno;
        this.labelExibido = labelExibido;
    }
}
