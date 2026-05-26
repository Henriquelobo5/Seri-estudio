package com.seriestudio.backend.repository;

import com.seriestudio.backend.model.Portfolio;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PortfolioRepository extends JpaRepository<Portfolio, Long> {
    List<Portfolio> findAllByOrderByIdItemDesc();
    List<Portfolio> findByCategoriaOrderByIdItemDesc(String categoria);
}
