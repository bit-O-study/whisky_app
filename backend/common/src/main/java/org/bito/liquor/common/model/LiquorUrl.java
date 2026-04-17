package org.bito.liquor.common.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "liquor_url")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LiquorUrl {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "liquor_id")
    private Liquor liquor;

    private String source;

    @Column(name = "product_url", columnDefinition = "TEXT")
    private String productUrl;

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;
}