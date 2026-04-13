package com.seriestudio.backend.repository;

import com.seriestudio.backend.model.Pedido;
import com.seriestudio.backend.model.usuario.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PedidoRepository extends JpaRepository<Pedido, Long> {
    List<Pedido> findByClienteOrderByDataAberturaDesc(Cliente cliente);
}
