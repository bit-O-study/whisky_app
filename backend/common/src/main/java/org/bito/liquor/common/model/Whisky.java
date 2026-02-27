package org.bito.liquor.common.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "whisky")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Whisky {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "seed_key", nullable = false, unique = true, length = 500)
    private String seedKey;

    @Column(name = "product_code")
    private String productCode;

    @Column(name = "normalized_name")
    private String normalizedName;

    @Column(name = "product_name")
    private String productName;

    private String brand;

    private String category;

    @Column(name = "class")
    private String clazz;

    @Column(name = "alcohol_percent")
    private Double alcoholPercent;

    @Column(name = "image_url", length = 1000)
    private String imageUrl;

    @Column(name = "image_source", length = 50)
    private String imageSource;

    @Column(name = "image_generated_at")
    private LocalDateTime imageGeneratedAt;

    private Double sweet;

    private Double smoky;

    private Double fruity;

    private Double spicy;

    private Double woody;

    private Double body;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
