package org.bito.liquor.common.repository;

import org.bito.liquor.common.model.Liquor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LiquorRepository extends JpaRepository<Liquor, Long> {

    Optional<Liquor> findByProductCode(String productCode);

    Optional<Liquor> findByNormalizedNameAndClazzAndVolume(String normalizedName, String clazz, Integer volume);

    Optional<Liquor> findByBrandAndCategoryAndAlcoholPercentAndVolumeAndClazz(
            String brand, String category, Double alcoholPercent, Integer volume, String clazz
    );

    Page<Liquor> findAllByOrderByUpdatedAtDesc(Pageable pageable);

    @Query("""
            SELECT l
            FROM Liquor l
            WHERE LOWER(COALESCE(l.productName, l.normalizedName, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(COALESCE(l.brand, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
            ORDER BY l.updatedAt DESC
            """)
    Page<Liquor> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);
}
