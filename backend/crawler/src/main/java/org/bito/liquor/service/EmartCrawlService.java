package org.bito.liquor.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bito.liquor.common.model.Liquor;
import org.bito.liquor.common.model.LiquorInfo;
import org.bito.liquor.common.model.LiquorPrice;
import org.bito.liquor.common.repository.LiquorInfoRepository;
import org.bito.liquor.common.repository.LiquorRepository;
import org.bito.liquor.common.repository.LiquorPriceRepository;
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

    private final LiquorRepository liquorRepository;
    private final LiquorPriceRepository liquorPriceRepository;
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

//            LiquorInfo info = getOrSaveLiquorInfo(scraped);
//            scraped.setLiquorInfo(info);
            Optional<LiquorInfo> infoOpt = findLiquorInfo(scraped);

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

        log.info("이마트 크롤링 완료 - 신규: {}개, 업데이트: {}개", newCount, updateCount);

        return liquorPriceRepository.findAllOrderByUpdatedAtDesc();
    }

    private Optional<LiquorInfo> findLiquorInfo(Liquor scraped) {
        return liquorInfoRepository.findByBrandAndCategoryAndAlcoholPercentAndVolumeMlAndClazz(
                scraped.getBrand(),
                scraped.getCategory(),
                scraped.getAlcoholPercent(),
                scraped.getVolume(),
                scraped.getClazz()
        );
    }

    private LiquorInfo getOrSaveLiquorInfo(Liquor scraped) {
        return liquorInfoRepository.findByBrandAndCategoryAndAlcoholPercentAndVolumeMlAndClazz(
                scraped.getBrand(),
                scraped.getCategory(),
                scraped.getAlcoholPercent(),
                scraped.getVolume(),
                scraped.getClazz()
        ).orElseGet(() -> {
            LiquorInfo newInfo = LiquorInfo.builder()
                    .brand(scraped.getBrand())
                    .category(scraped.getCategory())
                    .alcoholPercent(scraped.getAlcoholPercent())
                    .volumeMl(scraped.getVolume())
                    .clazz(scraped.getClazz())
                    .build();
            return liquorInfoRepository.save(newInfo);
        });
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
