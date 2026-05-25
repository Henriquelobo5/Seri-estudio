package com.seriestudio.backend.repository;

import com.seriestudio.backend.model.ConfiguracaoFinanceira;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ConfiguracaoFinanceiraRepository extends JpaRepository<ConfiguracaoFinanceira, Long> {
    Optional<ConfiguracaoFinanceira> findTopByOrderByIdAsc();
}
