package org.bito.liquor.common.repository;

import org.bito.liquor.common.model.LiquorUrl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LiquorUrlRepository extends JpaRepository<LiquorUrl, Long> {

    Optional<LiquorUrl> findByLiquorIdAndSource(Long liquorId, String source);

    // 특정 상품에 연결된 모든 소스별 URL 리스트를 가져올 때 사용
    List<LiquorUrl> findByLiquorId(Long liquorId);
}