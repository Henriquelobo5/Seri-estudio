package com.seriestudio.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PortfolioRequest {
    private String titulo;
    private String descricaoTecnica;
    private String urlImagem;
    private String categoria;
}
