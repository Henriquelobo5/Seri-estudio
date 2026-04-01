package com.seriestudio.backend.dto;

public class RegisterRequest {
    public String nome;
    public String email;
    public String senha;
    public String tipoUsuario; // "ADMIN" ou "CLIENTE"
    public Integer nivelPermissao; // opcional para admin
    public String cpfCnpj; // opcional para cliente
    public String whatsapp; // opcional para cliente
    public String endereco; // opcional para cliente
    public String nomeUsuario; // opcional para admin
}
