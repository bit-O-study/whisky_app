package org.bito.liquor.common.repository;

import org.bito.liquor.common.model.Whisky;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WhiskyRepository extends JpaRepository<Whisky, Long> {
    Optional<Whisky> findBySeedKey(String seedKey);

    Optional<Whisky> findByProductCode(String productCode);

    Page<Whisky> findAllByOrderByUpdatedAtDesc(Pageable pageable);

    @Query("""
            SELECT w
            FROM Whisky w
            WHERE LOWER(COALESCE(w.productName, w.normalizedName, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(COALESCE(w.brand, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
            ORDER BY w.updatedAt DESC
            """)
    Page<Whisky> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);
}
