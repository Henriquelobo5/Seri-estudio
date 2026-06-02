package com.seriestudio.backend.repository;

import com.seriestudio.backend.model.NotificacaoWhatsapp;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;

public interface NotificacaoWhatsappRepository extends JpaRepository<NotificacaoWhatsapp, Long> {
    boolean existsByPedidoIdPedAndTipoAndEtapaProducaoAndStatusIn(
            Long pedidoId,
            String tipo,
            String etapaProducao,
            Collection<String> statuses
    );
}
