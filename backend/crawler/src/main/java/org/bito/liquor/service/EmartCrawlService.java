package org.bito.liquor.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bito.liquor.common.model.Liquor;
import org.bito.liquor.common.model.LiquorInfo;
import org.bito.liquor.common.model.LiquorPrice;
import org.bito.liquor.common.model.LiquorPriceHistory;
import org.bito.liquor.common.model.LiquorUrl;
import org.bito.liquor.common.repository.LiquorInfoRepository;
import org.bito.liquor.common.repository.LiquorPriceHistoryRepository;
import org.bito.liquor.common.repository.LiquorRepository;
import org.bito.liquor.common.repository.LiquorPriceRepository;
import org.bito.liquor.common.repository.LiquorUrlRepository;
import org.bito.liquor.scraper.EmartScraper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmartCrawlService {
    private static final String NORMALIZED_SOURCE = "EMART";
    private final LiquorUrlRepository liquorUrlRepository;

    private final LiquorRepository liquorRepository;
    private final LiquorPriceRepository liquorPriceRepository;
    private final LiquorPriceHistoryRepository liquorPriceHistoryRepository;
    private final EmartScraper emartScraper;
    private final LiquorInfoRepository liquorInfoRepository;

    @Transactional
    public List<LiquorPrice> scrapeLiquors() {
        log.info("이마트 양주 크롤링 시작");

        List<Liquor> scrapedLiquors = emartScraper.scrapeLiquors();

        int newCount = 0;
        int updateCount = 0;
        int skipCount = 0;

        for (Liquor scraped : scrapedLiquors) {
            normalizeLiquor(scraped, NORMALIZED_SOURCE);

            Optional<LiquorInfo> infoOpt = findLiquorInfo(scraped);

            if (infoOpt.isEmpty()) {
                skipCount++;
                continue;
            }

            // 1. 마스터 정보 매칭
            scraped.setLiquorInfo(infoOpt.get());

            // 2. Liquor 테이블 저장/조회 (upsert)
            Liquor liquor = upsertLiquor(scraped);

            // 3. ⭐️ [변경] 소스별 URL 정보 저장 (별도 테이블)
            upsertLiquorUrl(liquor, scraped.getProductUrl(), scraped.getImageUrl(), NORMALIZED_SOURCE);

            // 4. 가격 정보 저장 (latest snapshot)
            boolean existed = liquorPriceRepository.findByLiquorIdAndSource(liquor.getId(), NORMALIZED_SOURCE).isPresent();
            upsertLiquorPrice(liquor, scraped);

            // 5. 가격 이력 적재 (시계열 — 매 크롤마다 한 행)
            appendLiquorPriceHistory(liquor, scraped);

            if (existed) {
                updateCount++;
            } else {
                newCount++;
            }
        }

        log.info("이마트 크롤링 완료 - 신규: {}개, 업데이트: {}개, 스킵(Info없음): {}개", newCount, updateCount, skipCount);

        return liquorPriceRepository.findAllOrderByUpdatedAtDesc();
    }

    private Optional<LiquorInfo> findLiquorInfo(Liquor scraped) {
        if (scraped.getBrand() == null || scraped.getCategory() == null || scraped.getVolume() == null) {
            return Optional.empty();
        }

        List<LiquorInfo> candidates = liquorInfoRepository.findByCategoryAndVolumeMl(
                scraped.getCategory(),
                scraped.getVolume()
        );

        if (candidates.isEmpty()) {
            return Optional.empty();
        }

        String scrapedBrand = scraped.getBrand().replace(" ", "").toLowerCase();
        String scrapedClazz = scraped.getClazz() != null ? scraped.getClazz().replace(" ", "").toLowerCase() : "";

        for (LiquorInfo info : candidates) {
            if (info.getBrand() == null) continue;

            String dbBrand = info.getBrand().replace(" ", "").toLowerCase();

            if (!dbBrand.equals(scrapedBrand)) {
                continue;
            }

            String dbClazz = info.getClazz() != null ? info.getClazz().replace(" ", "").toLowerCase() : "";

            if (dbClazz.equals("none") || dbClazz.isEmpty()) {
                return Optional.of(info);
            }

            if (dbClazz.contains(scrapedClazz) || scrapedClazz.contains(dbClazz)) {
                return Optional.of(info);
            }
        }

        return Optional.empty();
    }

    private void normalizeLiquor(Liquor liquor, String source) {
        liquor.setSource(source);
        liquor.setNormalizedName(buildNormalizedName(liquor));
        liquor.setClazz(normalizeClazz(liquor.getClazz()));
        if (liquor.getCurrentPrice() != null && liquor.getCurrentPrice() <= 0) {
            liquor.setCurrentPrice(null);
        }
        if (liquor.getOriginalPrice() != null && liquor.getOriginalPrice() <= 0) {
            liquor.setOriginalPrice(null);
        }
        if (liquor.getCurrentPrice() == null && liquor.getOriginalPrice() != null) {
            liquor.setCurrentPrice(liquor.getOriginalPrice());
        }
        if (liquor.getOriginalPrice() == null && liquor.getCurrentPrice() != null) {
            liquor.setOriginalPrice(liquor.getCurrentPrice());
        }
        if (liquor.getCurrentPrice() != null && liquor.getOriginalPrice() != null
                && liquor.getOriginalPrice() < liquor.getCurrentPrice()) {
            liquor.setOriginalPrice(liquor.getCurrentPrice());
        }
    }

    private Liquor upsertLiquor(Liquor scraped) {
        String clazz = normalizeClazz(scraped.getClazz());
        Integer volume = scraped.getVolume() == null ? 0 : scraped.getVolume();
        String brand = scraped.getBrand();

        // 1. 브랜드, clazz, 용량이 같은 상품이 있는지 우선 검색
        Optional<Liquor> existingLiquor = liquorRepository.findByBrandAndClazzAndVolume(brand, clazz, volume);

        if (existingLiquor.isPresent()) {
            // ⭐️ 이미 존재한다면, 타겟 쇼핑몰의 데이터로 기존 마스터 데이터를 덮어쓰지 않고 그대로 반환합니다.
            return existingLiquor.get();
        }

        // 2. 존재하지 않는다면 새로운 Liquor(마스터) 생성
        Liquor newLiquor = new Liquor();
        newLiquor.setNormalizedName(scraped.getNormalizedName());
        newLiquor.setName(scraped.getName());
        newLiquor.setBrand(brand);
        newLiquor.setCategory(scraped.getCategory());
        newLiquor.setCountry(scraped.getCountry());
        newLiquor.setAlcoholPercent(scraped.getAlcoholPercent());
        newLiquor.setVolume(volume);
        newLiquor.setClazz(clazz);
        newLiquor.setProductCode(scraped.getProductCode());
        newLiquor.setProductName(scraped.getFullname() == null ? scraped.getName() : scraped.getFullname());
        newLiquor.setProductUrl(scraped.getProductUrl());
        newLiquor.setImageUrl(scraped.getImageUrl());
        newLiquor.setLiquorInfo(scraped.getLiquorInfo()); // 매칭된 Info 주입

        return liquorRepository.save(newLiquor);
    }

    private void appendLiquorPriceHistory(Liquor liquor, Liquor scraped) {
        // 가격이 둘 다 null이면 기록 skip (의미 없음)
        if (scraped.getCurrentPrice() == null && scraped.getOriginalPrice() == null) {
            return;
        }
        LiquorPriceHistory history = LiquorPriceHistory.builder()
                .liquor(liquor)
                .source(NORMALIZED_SOURCE)
                .currentPrice(scraped.getCurrentPrice())
                .originalPrice(scraped.getOriginalPrice())
                .build();
        liquorPriceHistoryRepository.save(history);
    }

    private LiquorPrice upsertLiquorPrice(Liquor liquor, Liquor scraped) {
        LiquorPrice price = liquorPriceRepository
                .findByLiquorIdAndSource(liquor.getId(), NORMALIZED_SOURCE)
                .orElseGet(() -> LiquorPrice.builder()
                        .liquor(liquor)
                        .source(NORMALIZED_SOURCE)
                        .build());

        price.setLiquor(liquor);
        price.setSource(NORMALIZED_SOURCE);
        price.setCurrentPrice(scraped.getCurrentPrice());
        price.setOriginalPrice(scraped.getOriginalPrice());
        return liquorPriceRepository.save(price);
    }

    private String buildNormalizedName(Liquor liquor) {
        String base = normalizeText(liquor.getFullname());
        if (base.isBlank()) {
            base = normalizeText(liquor.getName());
        }
        return base.toLowerCase(Locale.ROOT)
                .replaceAll("\\[.*?\\]", " ")
                .replaceAll("\\d+\\s*(ml|mL|ML|l|L|리터)", " ")
                .replaceAll("[^0-9a-z가-힣]+", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private String normalizeClazz(String clazz) {
        return normalizeText(clazz)
                .replaceAll("\\[.*?\\]", "") // ⭐️ 추가: [기획], [전용잔세트] 등 대괄호 안의 태그 완벽 제거
                .replace("()", "")
                .replace(" ", "")
                .trim();
    }

    private String normalizeText(String value) {
        return value == null ? "" : value.trim();
    }

    private void upsertLiquorUrl(Liquor liquor, String productUrl, String imageUrl, String source) {
        if (productUrl == null || productUrl.isBlank()) return;

        LiquorUrl liquorUrl = liquorUrlRepository.findByLiquorIdAndSource(liquor.getId(), source)
                .orElseGet(() -> LiquorUrl.builder()
                        .liquor(liquor)
                        .source(source)
                        .build());

        liquorUrl.setProductUrl(productUrl);
        liquorUrl.setImageUrl(imageUrl);

        liquorUrlRepository.save(liquorUrl);
    }

}