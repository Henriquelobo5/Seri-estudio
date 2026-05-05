package com.seriestudio.backend.repository;

import com.seriestudio.backend.model.MovimentacaoEstoque;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MovimentacaoEstoqueRepository extends JpaRepository<MovimentacaoEstoque, Long> {
    List<MovimentacaoEstoque> findAllByOrderByDataHoraDesc();
    List<MovimentacaoEstoque> findTop20ByOrderByDataHoraDesc();
    List<MovimentacaoEstoque> findByInsumoIdInsumoOrderByDataHoraDesc(Long idInsumo);
    long countByInsumoIdInsumo(Long idInsumo);
}
