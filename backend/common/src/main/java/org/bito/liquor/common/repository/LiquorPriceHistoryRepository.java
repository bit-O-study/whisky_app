package org.bito.liquor.common.repository;

import org.bito.liquor.common.model.LiquorPriceHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LiquorPriceHistoryRepository extends JpaRepository<LiquorPriceHistory, Long> {
    List<LiquorPriceHistory> findByLiquorIdOrderByCrawledAtAsc(Long liquorId);
}
