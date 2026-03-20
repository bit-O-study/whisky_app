package org.bito.liquor.common.repository;

import org.bito.liquor.common.model.LiquorInfo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LiquorInfoRepository extends JpaRepository<LiquorInfo, Long> {
    Optional<LiquorInfo> findByBrandAndCategoryAndAlcoholPercentAndVolumeMlAndClazz(
            String brand, String category, Double alcoholPercent, Integer volumeMl, String clazz
    );

    List<LiquorInfo> findByBrandAndCategoryAndVolumeMl(
            String brand, String category, Integer volumeMl
    );

    List<LiquorInfo> findByCategoryAndVolumeMl(String category, Integer volumeMl);
}