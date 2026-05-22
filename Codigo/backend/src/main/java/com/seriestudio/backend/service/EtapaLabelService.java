package com.seriestudio.backend.service;

import com.seriestudio.backend.model.EtapaLabel;
import com.seriestudio.backend.repository.EtapaLabelRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class EtapaLabelService {

    private static final int MAX_LABEL_LENGTH = 50;

    private static final Map<String, String> LABELS_PADRAO = Map.of(
            "CORTE", "Corte",
            "ESTAMPARIA", "Estamparia",
            "COSTURA", "Costura",
            "REVISAO", "Revisão",
            "EXPEDICAO", "Expedição"
    );

    @Autowired
    private EtapaLabelRepository etapaLabelRepository;

    public List<EtapaLabel> listarTodos() {
        return etapaLabelRepository.findAllByOrderByIdAsc();
    }

    @Transactional
    public EtapaLabel atualizarLabel(Long id, String novoLabel) {
        if (novoLabel == null || novoLabel.trim().isEmpty()) {
            throw new RuntimeException("O nome exibido não pode ser vazio");
        }
        String tratado = novoLabel.trim();
        if (tratado.length() > MAX_LABEL_LENGTH) {
            throw new RuntimeException("O nome exibido deve ter no máximo " + MAX_LABEL_LENGTH + " caracteres");
        }

        EtapaLabel etapa = etapaLabelRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Etapa não encontrada"));

        etapa.setLabelExibido(tratado);
        return etapaLabelRepository.save(etapa);
    }

    @Transactional
    public EtapaLabel restaurarPadrao(Long id) {
        EtapaLabel etapa = etapaLabelRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Etapa não encontrada"));

        String padrao = LABELS_PADRAO.get(etapa.getIdInterno());
        if (padrao == null) {
            throw new RuntimeException("Não há label padrão definido para " + etapa.getIdInterno());
        }

        etapa.setLabelExibido(padrao);
        return etapaLabelRepository.save(etapa);
    }
}
