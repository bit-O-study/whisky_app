package org.bito.liquor.common.repository;

import org.bito.liquor.common.model.Liquor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LiquorRepository extends JpaRepository<Liquor, Long> {

    Optional<Liquor> findByProductCode(String productCode);

    Optional<Liquor> findByNormalizedNameAndClazzAndVolume(String normalizedName, String clazz, Integer volume);

    Optional<Liquor> findByBrandAndCategoryAndAlcoholPercentAndVolumeAndClazz(
            String brand, String category, Double alcoholPercent, Integer volume, String clazz
    );
}
