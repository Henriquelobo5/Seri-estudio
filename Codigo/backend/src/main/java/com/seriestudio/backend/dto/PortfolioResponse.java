package com.seriestudio.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class PortfolioResponse {
    private Long idItem;
    private String titulo;
    private String descricaoTecnica;
    private String urlImagem;
    private String categoria;
}
