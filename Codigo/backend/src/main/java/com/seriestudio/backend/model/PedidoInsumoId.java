package com.seriestudio.backend.model;

import java.io.Serializable;
import java.util.Objects;

public class PedidoInsumoId implements Serializable {
    private Long idPed;
    private Long idInsumo;

    // equals e hashCode
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        PedidoInsumoId that = (PedidoInsumoId) o;
        return Objects.equals(idPed, that.idPed) && Objects.equals(idInsumo, that.idInsumo);
    }
    @Override
    public int hashCode() {
        return Objects.hash(idPed, idInsumo);
    }
}
