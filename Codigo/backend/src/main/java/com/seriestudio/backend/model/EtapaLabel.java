package com.seriestudio.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "etapa_label")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EtapaLabel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_interno", unique = true, nullable = false, updatable = false, length = 30)
    private String idInterno;

    @Column(name = "label_exibido", nullable = false, length = 50)
    private String labelExibido;
}
