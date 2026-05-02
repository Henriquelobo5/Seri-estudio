package com.seriestudio.backend.repository;

import com.seriestudio.backend.model.Financeiro;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FinanceiroRepository extends JpaRepository<Financeiro, Long> {
    Optional<Financeiro> findByPedidoIdPed(Long pedidoId);
}
