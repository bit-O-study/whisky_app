package org.bito.liquor.common.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "liquor")
@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Liquor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "normalized_name", nullable = false)
    private String normalizedName;

    @Transient
    private String name;

    private String brand;

    private String category;

    @Column(name = "volume_ml")
    private Integer volume;

    private Double alcoholPercent;

    private String country;

    @Column(name = "class")
    private String clazz;

    @Column(name = "product_code")
    private String productCode;

    @Column(name = "product_name")
    private String productName;

    @Column(name = "product_url", length = 1000)
    private String productUrl;

    @Column(name = "image_url", length = 1000)
    private String imageUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "liquor_info_id")
    private LiquorInfo liquorInfo;

    @OneToMany(mappedBy = "liquor", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<LiquorUrl> urls = new ArrayList<>();

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

    @Transient
    private Integer currentPrice;

    @Transient
    private Integer originalPrice;

    @Transient
    private String source;

    @Transient
    private String fullname;

    @PrePersist
    protected void onCreate() {
        if (normalizedName == null) {
            String baseName = name != null ? name : productName;
            if (baseName != null) {
                normalizedName = baseName.trim().toLowerCase();
            }
        }
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Integer getDiscountPercent() {
        if (originalPrice != null && originalPrice > 0 && currentPrice != null) {
            return (int) ((1 - (double) currentPrice / originalPrice) * 100);
        }
        return 0;
    }

    public String getName() {
        return name != null ? name : productName;
    }
}
