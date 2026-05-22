package com.seriestudio.backend.repository;

import com.seriestudio.backend.model.EtapaLabel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EtapaLabelRepository extends JpaRepository<EtapaLabel, Long> {

    Optional<EtapaLabel> findByIdInterno(String idInterno);

    List<EtapaLabel> findAllByOrderByIdAsc();
}
