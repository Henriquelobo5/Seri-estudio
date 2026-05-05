package com.seriestudio.backend.repository;

import com.seriestudio.backend.model.Insumo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InsumoRepository extends JpaRepository<Insumo, Long> {
    List<Insumo> findAllByOrderByNomeItemAsc();
    List<Insumo> findByCategoriaOrderByNomeItemAsc(String categoria);
}
