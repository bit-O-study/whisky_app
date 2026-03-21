package org.bito.liquor.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bito.liquor.common.model.Liquor;
import org.bito.liquor.common.model.LiquorInfo;
import org.bito.liquor.common.model.LiquorPrice;
import org.bito.liquor.common.repository.LiquorInfoRepository;
import org.bito.liquor.common.repository.LiquorRepository;
import org.bito.liquor.common.repository.LiquorPriceRepository;
import org.bito.liquor.scraper.LotteonScraper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class LotteonCrawlService {
    private static final String NORMALIZED_SOURCE = "LOTTEON";

    private final LiquorRepository liquorRepository;
    private final LiquorPriceRepository liquorPriceRepository;
    private final LiquorInfoRepository liquorInfoRepository;
    private final LotteonScraper lotteonScraper;

    @Transactional
    public List<LiquorPrice> scrapeLiquors() {
        log.info("롯데온 양주 크롤링 시작");

        List<Liquor> scrapedLiquors = lotteonScraper.scrapeLiquors();
        System.out.println(scrapedLiquors);
        System.out.println("scrapedLiquors.size()==>"+scrapedLiquors.size());
        int newCount = 0;
        int updateCount = 0;
        int skipCount = 0;

        for (Liquor scraped : scrapedLiquors) {
            normalizeLiquor(scraped, NORMALIZED_SOURCE);
            System.out.println(scraped);
            Optional<LiquorInfo> infoOpt = findLiquorInfo(scraped);
            System.out.println(infoOpt);
            if (infoOpt.isEmpty()) {
                skipCount++;
                continue;
            }

            scraped.setLiquorInfo(infoOpt.get());

            Liquor liquor = upsertLiquor(scraped);
            boolean existed = liquorPriceRepository.findByLiquorIdAndSource(liquor.getId(), NORMALIZED_SOURCE).isPresent();
            upsertLiquorPrice(liquor, scraped);

            if (existed) {
                updateCount++;
            } else {
                newCount++;
            }
        }

        log.info("롯데온 크롤링 완료 - 신규: {}개, 업데이트: {}개, 스킵(Info없음): {}개", newCount, updateCount, skipCount);

        return liquorPriceRepository.findAllOrderByUpdatedAtDesc();
    }

    private Optional<LiquorInfo> findLiquorInfo(Liquor scraped) {
        if (scraped.getBrand() == null || scraped.getCategory() == null || scraped.getVolume() == null) {
            return Optional.empty();
        }

        // 1. 카테고리와 용량만으로 넓게 후보군을 가져옵니다. (Repository에 findByCategoryAndVolumeMl 추가 필요)
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

            // 2. 브랜드 이름이 일치하는지 확인 (띄어쓰기 무시)
            if (!dbBrand.equals(scrapedBrand)) {
                continue;
            }

            String dbClazz = info.getClazz() != null ? info.getClazz().replace(" ", "").toLowerCase() : "";

            // 3. DB의 Clazz가 "none" 이거나 비어있는 경우 (제임슨, 벨즈, 버팔로 등)
            // 브랜드는 일치했으므로 매칭 성공으로 간주
            if (dbClazz.equals("none") || dbClazz.isEmpty()) {
                // 단, 스크래핑된 결과가 완전히 다른 라인업(예: 제임슨 '블랙배럴')인지 확인하려면
                // 여기서 추가 검증을 할 수 있지만, 일단은 매칭시킵니다.
                return Optional.of(info);
            }

            // 4. 일반적인 Clazz 비교 (부분 일치 허용)
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
        String productCode = normalizeText(scraped.getProductCode());
        String normalizedName = scraped.getNormalizedName();
        String clazz = normalizeClazz(scraped.getClazz());
        Integer volume = scraped.getVolume() == null ? 0 : scraped.getVolume();

        Liquor liquor = null;
        if (!productCode.isBlank()) {
            liquor = liquorRepository.findByProductCode(productCode).orElse(null);
        }
        if (liquor == null) {
            liquor = liquorRepository
                    .findByNormalizedNameAndClazzAndVolume(normalizedName, clazz, volume)
                    .orElseGet(Liquor::new);
        }

        liquor.setNormalizedName(normalizedName);
        liquor.setName(scraped.getName());
        liquor.setBrand(scraped.getBrand());
        liquor.setCategory(scraped.getCategory());
        liquor.setCountry(scraped.getCountry());
        liquor.setAlcoholPercent(scraped.getAlcoholPercent());
        liquor.setVolume(volume);
        liquor.setClazz(clazz);
        liquor.setProductCode(scraped.getProductCode());
        liquor.setProductName(scraped.getFullname() == null ? scraped.getName() : scraped.getFullname());
        liquor.setProductUrl(scraped.getProductUrl());
        liquor.setImageUrl(scraped.getImageUrl());
        liquor.setLiquorInfo(scraped.getLiquorInfo());

        return liquorRepository.save(liquor);
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
                .replace("()", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private String normalizeText(String value) {
        return value == null ? "" : value.trim();
    }
}
