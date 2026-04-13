package com.seriestudio.backend.repository;

import com.seriestudio.backend.model.FichaTecnica;
import com.seriestudio.backend.model.usuario.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FichaTecnicaRepository extends JpaRepository<FichaTecnica, Long> {
    List<FichaTecnica> findByClienteOrderByDataAberturaDesc(Cliente cliente);
}
