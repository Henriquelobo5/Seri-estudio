package com.seriestudio.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public class AdminClienteResponse {
    public Long id;
    public String nome;
    public String email;
    public String cpfCnpj;
    public String whatsapp;
    public String endereco;
    public Integer totalPedidos;
    public Integer pedidosAtivos;
    public Integer pedidosEntregues;
    public LocalDateTime primeiroPedido;
    public LocalDateTime ultimoPedido;
    public List<AdminClientePedidoResponse> pedidos;

    public AdminClienteResponse(
            Long id,
            String nome,
            String email,
            String cpfCnpj,
            String whatsapp,
            String endereco,
            Integer totalPedidos,
            Integer pedidosAtivos,
            Integer pedidosEntregues,
            LocalDateTime primeiroPedido,
            LocalDateTime ultimoPedido,
            List<AdminClientePedidoResponse> pedidos
    ) {
        this.id = id;
        this.nome = nome;
        this.email = email;
        this.cpfCnpj = cpfCnpj;
        this.whatsapp = whatsapp;
        this.endereco = endereco;
        this.totalPedidos = totalPedidos;
        this.pedidosAtivos = pedidosAtivos;
        this.pedidosEntregues = pedidosEntregues;
        this.primeiroPedido = primeiroPedido;
        this.ultimoPedido = ultimoPedido;
        this.pedidos = pedidos;
    }
}
