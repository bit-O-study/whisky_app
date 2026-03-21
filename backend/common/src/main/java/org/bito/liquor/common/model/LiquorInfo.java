package org.bito.liquor.common.model;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "liquor_info")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class LiquorInfo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String brand;
    private String category;
    private Double alcoholPercent;

    @Column(name = "volume_ml")
    private Integer volumeMl;

    private String clazz;
}