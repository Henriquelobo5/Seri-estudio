package com.seriestudio.backend.service;

import com.seriestudio.backend.dto.InsumoRequest;
import com.seriestudio.backend.dto.MovimentacaoRequest;
import com.seriestudio.backend.dto.SimularAbateRequest;
import com.seriestudio.backend.model.Insumo;
import com.seriestudio.backend.model.MovimentacaoEstoque;
import com.seriestudio.backend.model.usuario.Administrador;
import com.seriestudio.backend.model.usuario.Usuario;
import com.seriestudio.backend.repository.InsumoRepository;
import com.seriestudio.backend.repository.MovimentacaoEstoqueRepository;
import com.seriestudio.backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class EstoqueService {

    private static final Set<String> CATEGORIAS_VALIDAS = Set.of(
            "TINTA", "TELA", "EMULSAO", "TECIDO", "OUTROS"
    );

    private static final Set<String> TIPOS_VALIDOS = Set.of(
            "ENTRADA", "SAIDA", "AJUSTE"
    );

    @Autowired
    private InsumoRepository insumoRepository;

    @Autowired
    private MovimentacaoEstoqueRepository movimentacaoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    public List<Insumo> listarTodos() {
        return insumoRepository.findAllByOrderByNomeItemAsc();
    }

    public List<Insumo> listarPorCategoria(String categoria) {
        validarCategoria(categoria);
        return insumoRepository.findByCategoriaOrderByNomeItemAsc(categoria);
    }

    public Insumo buscarPorId(Long id) {
        return insumoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Insumo não encontrado"));
    }

    @Transactional
    public Insumo criar(InsumoRequest req) {
        validarCamposInsumo(req);

        Insumo insumo = new Insumo();
        aplicarCampos(insumo, req);
        return insumoRepository.save(insumo);
    }

    @Transactional
    public Insumo atualizar(Long id, InsumoRequest req) {
        validarCamposInsumo(req);
        Insumo insumo = buscarPorId(id);
        aplicarCampos(insumo, req);
        return insumoRepository.save(insumo);
    }

    @Transactional
    public void excluir(Long id) {
        Insumo insumo = buscarPorId(id);
        long movimentacoes = movimentacaoRepository.countByInsumoIdInsumo(id);
        if (movimentacoes > 0) {
            throw new RuntimeException("Não é possível excluir um insumo com movimentações registradas");
        }
        insumoRepository.delete(insumo);
    }

    @Transactional
    public MovimentacaoEstoque registrarMovimentacao(Long idInsumo, MovimentacaoRequest req, String emailAdmin) {
        if (req.tipo == null || !TIPOS_VALIDOS.contains(req.tipo)) {
            throw new RuntimeException("Tipo de movimentação inválido. Use ENTRADA, SAIDA ou AJUSTE");
        }
        if (req.quantidade == null || req.quantidade <= 0) {
            throw new RuntimeException("Quantidade deve ser maior que zero");
        }

        Insumo insumo = buscarPorId(idInsumo);
        int saldoAtual = insumo.getQtdEstoque() != null ? insumo.getQtdEstoque() : 0;
        int novoSaldo;

        switch (req.tipo) {
            case "ENTRADA":
                novoSaldo = saldoAtual + req.quantidade;
                break;
            case "SAIDA":
                if (req.quantidade > saldoAtual) {
                    throw new RuntimeException("Estoque insuficiente. Disponível: " + saldoAtual);
                }
                novoSaldo = saldoAtual - req.quantidade;
                break;
            case "AJUSTE":
                novoSaldo = req.quantidade;
                break;
            default:
                throw new RuntimeException("Tipo de movimentação inválido");
        }

        insumo.setQtdEstoque(novoSaldo);
        insumoRepository.save(insumo);

        MovimentacaoEstoque mov = new MovimentacaoEstoque();
        mov.setTipo(req.tipo);
        mov.setQuantidade(req.quantidade);
        mov.setQuantidadeReal(req.quantidade.doubleValue());
        mov.setMotivo(req.motivo);
        mov.setDataHora(LocalDateTime.now());
        mov.setQtdAposMovimentacao(novoSaldo);
        mov.setInsumo(insumo);
        mov.setAdministrador(buscarAdministrador(emailAdmin));

        return movimentacaoRepository.save(mov);
    }

    @Transactional
    public MovimentacaoEstoque simularAbate(Long idInsumo, SimularAbateRequest req, String emailAdmin) {
        Insumo insumo = buscarPorId(idInsumo);

        if (insumo.getConsumoPorPeca() == null || insumo.getConsumoPorPeca() <= 0) {
            throw new RuntimeException(
                    "Insumo sem consumo por peça definido. Edite o insumo e configure este valor antes de simular abate."
            );
        }
        if (req.quantidadePecas == null || req.quantidadePecas <= 0) {
            throw new RuntimeException("Quantidade de peças deve ser maior que zero");
        }

        double consumoReal = req.quantidadePecas * insumo.getConsumoPorPeca();
        int consumoArredondado = (int) Math.ceil(consumoReal);
        int saldoAtual = insumo.getQtdEstoque() != null ? insumo.getQtdEstoque() : 0;

        if (consumoArredondado > saldoAtual) {
            throw new RuntimeException(
                    "Estoque insuficiente. Disponível: " + saldoAtual + ", necessário: " + consumoArredondado
            );
        }

        int novoSaldo = saldoAtual - consumoArredondado;
        insumo.setQtdEstoque(novoSaldo);
        insumoRepository.save(insumo);

        String observacao = req.observacao != null ? req.observacao : "";
        String motivo = "Abate — " + observacao + " — "
                + req.quantidadePecas + " peças × "
                + insumo.getConsumoPorPeca() + " "
                + (insumo.getUnidadeMedida() != null ? insumo.getUnidadeMedida() : "")
                + "/peça";

        MovimentacaoEstoque mov = new MovimentacaoEstoque();
        mov.setTipo("SAIDA");
        mov.setQuantidade(consumoArredondado);
        mov.setQuantidadeReal(consumoReal);
        mov.setMotivo(motivo);
        mov.setDataHora(LocalDateTime.now());
        mov.setQtdAposMovimentacao(novoSaldo);
        mov.setInsumo(insumo);
        mov.setAdministrador(buscarAdministrador(emailAdmin));

        return movimentacaoRepository.save(mov);
    }

    public List<MovimentacaoEstoque> listarMovimentacoes() {
        return movimentacaoRepository.findTop20ByOrderByDataHoraDesc();
    }

    public List<MovimentacaoEstoque> listarTodasMovimentacoes() {
        return movimentacaoRepository.findAllByOrderByDataHoraDesc();
    }

    public List<MovimentacaoEstoque> listarMovimentacoesPorInsumo(Long idInsumo) {
        return movimentacaoRepository.findByInsumoIdInsumoOrderByDataHoraDesc(idInsumo);
    }

    public String calcularStatus(Insumo insumo) {
        Integer qtd = insumo.getQtdEstoque();
        Integer min = insumo.getQtdMinima();
        if (qtd == null || qtd == 0) {
            return "SEM_ESTOQUE";
        }
        if (min != null && min > 0 && qtd < min * 0.5) {
            return "CRITICO";
        }
        if (min != null && min > 0 && qtd <= min) {
            return "BAIXO";
        }
        return "OK";
    }

    private void validarCategoria(String categoria) {
        if (categoria == null || !CATEGORIAS_VALIDAS.contains(categoria)) {
            throw new RuntimeException("Categoria inválida. Use TINTA, TELA, EMULSAO, TECIDO ou OUTROS");
        }
    }

    private void validarCamposInsumo(InsumoRequest req) {
        if (req.nomeItem == null || req.nomeItem.isBlank()) {
            throw new RuntimeException("Nome do item é obrigatório");
        }
        validarCategoria(req.categoria);
        if (req.qtdEstoque == null || req.qtdEstoque < 0) {
            throw new RuntimeException("Quantidade em estoque deve ser maior ou igual a zero");
        }
        if (req.qtdMinima == null || req.qtdMinima < 0) {
            throw new RuntimeException("Quantidade mínima deve ser maior ou igual a zero");
        }
        if (req.unidadeMedida == null || req.unidadeMedida.isBlank()) {
            throw new RuntimeException("Unidade de medida é obrigatória");
        }
        if (req.precoUnitario != null && req.precoUnitario < 0) {
            throw new RuntimeException("Preço unitário não pode ser negativo");
        }
        if (req.consumoPorPeca != null && req.consumoPorPeca < 0) {
            throw new RuntimeException("Consumo por peça não pode ser negativo");
        }
    }

    private void aplicarCampos(Insumo insumo, InsumoRequest req) {
        insumo.setNomeItem(req.nomeItem.trim());
        insumo.setCategoria(req.categoria);
        insumo.setQtdEstoque(req.qtdEstoque);
        insumo.setQtdMinima(req.qtdMinima);
        insumo.setUnidadeMedida(req.unidadeMedida.trim());
        insumo.setPrecoUnitario(req.precoUnitario);
        insumo.setConsumoPorPeca(req.consumoPorPeca);
    }

    private Administrador buscarAdministrador(String email) {
        if (email == null) return null;
        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);
        if (usuarioOpt.isPresent() && usuarioOpt.get() instanceof Administrador admin) {
            return admin;
        }
        return null;
    }
}
