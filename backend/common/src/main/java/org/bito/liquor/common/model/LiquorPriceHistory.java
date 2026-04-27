package org.bito.liquor.common.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 매 크롤마다 (liquor, source) 가격을 시계열로 적재.
 * liquor_price 테이블은 latest snapshot, 이 테이블은 full history.
 */
@Entity
@Table(name = "liquor_price_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LiquorPriceHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "liquor_id", nullable = false)
    private Liquor liquor;

    @Column(nullable = false)
    private String source;

    @Column(name = "current_price")
    private Integer currentPrice;

    @Column(name = "original_price")
    private Integer originalPrice;

    @Column(name = "crawled_at", nullable = false)
    private LocalDateTime crawledAt;

    @PrePersist
    protected void onCreate() {
        if (crawledAt == null) {
            crawledAt = LocalDateTime.now();
        }
    }
}
