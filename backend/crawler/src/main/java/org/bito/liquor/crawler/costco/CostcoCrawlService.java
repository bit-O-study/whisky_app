package org.bito.liquor.crawler.costco;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bito.liquor.common.model.Liquor;
import org.bito.liquor.common.model.LiquorInfo;
import org.bito.liquor.common.model.LiquorPrice;
import org.bito.liquor.common.model.LiquorPriceHistory;
import org.bito.liquor.common.model.LiquorUrl;
import org.bito.liquor.common.repository.LiquorInfoRepository;
import org.bito.liquor.common.repository.LiquorPriceHistoryRepository;
import org.bito.liquor.common.repository.LiquorPriceRepository;
import org.bito.liquor.common.repository.LiquorRepository;
import org.bito.liquor.common.repository.LiquorUrlRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CostcoCrawlService {

    private static final String NORMALIZED_SOURCE = "COSTCO";

    private final LiquorRepository liquorRepository;
    private final LiquorPriceRepository liquorPriceRepository;
    private final LiquorPriceHistoryRepository liquorPriceHistoryRepository;
    private final LiquorUrlRepository liquorUrlRepository;
    private final LiquorInfoRepository liquorInfoRepository;
    private final CostcoScraper costcoScraper;

    @Transactional
    public List<LiquorPrice> scrapeLiquors() {
        log.info("Costco 크롤링 시작");

        List<Liquor> scraped = costcoScraper.scrapeLiquors();
        int newCount = 0, updateCount = 0, skipCount = 0;

        for (Liquor s : scraped) {
            normalize(s);

            Optional<LiquorInfo> infoOpt = findLiquorInfo(s);
            if (infoOpt.isEmpty()) { skipCount++; continue; }

            LiquorInfo info = infoOpt.get();
            s.setLiquorInfo(info);

            String sc = s.getClazz();
            if ((sc == null || sc.isBlank() || sc.equalsIgnoreCase("none"))
                    && info.getClazz() != null && !info.getClazz().isBlank()) {
                s.setClazz(info.getClazz());
            }

            Liquor liquor = upsertLiquor(s);
            upsertLiquorUrl(liquor, s.getProductUrl(), s.getImageUrl());

            boolean existed = liquorPriceRepository.findByLiquorIdAndSource(liquor.getId(), NORMALIZED_SOURCE).isPresent();
            upsertLiquorPrice(liquor, s);
            appendHistory(liquor, s);

            if (existed) updateCount++;
            else newCount++;
        }

        log.info("Costco 크롤링 완료 - 신규: {}, 업데이트: {}, 스킵(Info없음): {}", newCount, updateCount, skipCount);
        return liquorPriceRepository.findAllOrderByUpdatedAtDesc();
    }

    private Optional<LiquorInfo> findLiquorInfo(Liquor scraped) {
        if (scraped.getBrand() == null || scraped.getCategory() == null || scraped.getVolume() == null) {
            return Optional.empty();
        }
        List<LiquorInfo> candidates = liquorInfoRepository.findByCategoryAndVolumeMl(
                scraped.getCategory(), scraped.getVolume());
        if (candidates.isEmpty()) return Optional.empty();

        String sb = scraped.getBrand().replace(" ", "").toLowerCase();
        String sc = scraped.getClazz() != null ? scraped.getClazz().replace(" ", "").toLowerCase() : "";
        String sn = scraped.getName() != null ? scraped.getName().replace(" ", "").toLowerCase() : "";

        for (LiquorInfo info : candidates) {
            if (info.getBrand() == null) continue;
            if (!info.getBrand().replace(" ", "").toLowerCase().equals(sb)) continue;
            String dc = info.getClazz() != null ? info.getClazz().replace(" ", "").toLowerCase() : "";
            if (dc.equals("none") || dc.isEmpty()) return Optional.of(info);
            if (dc.contains(sc) || sc.contains(dc)) return Optional.of(info);
            if (!dc.isEmpty() && sn.contains(dc)) return Optional.of(info);
        }
        return Optional.empty();
    }

    private void normalize(Liquor liquor) {
        liquor.setSource(NORMALIZED_SOURCE);
        liquor.setNormalizedName(buildNormalizedName(liquor));
        liquor.setClazz(normalizeClazz(liquor.getClazz()));
        if (liquor.getCurrentPrice() != null && liquor.getCurrentPrice() <= 0) liquor.setCurrentPrice(null);
        if (liquor.getOriginalPrice() != null && liquor.getOriginalPrice() <= 0) liquor.setOriginalPrice(null);
        if (liquor.getCurrentPrice() == null && liquor.getOriginalPrice() != null) liquor.setCurrentPrice(liquor.getOriginalPrice());
        if (liquor.getOriginalPrice() == null && liquor.getCurrentPrice() != null) liquor.setOriginalPrice(liquor.getCurrentPrice());
        if (liquor.getCurrentPrice() != null && liquor.getOriginalPrice() != null
                && liquor.getOriginalPrice() < liquor.getCurrentPrice()) {
            liquor.setOriginalPrice(liquor.getCurrentPrice());
        }
    }

    private Liquor upsertLiquor(Liquor scraped) {
        String clazz = normalizeClazz(scraped.getClazz());
        Integer volume = scraped.getVolume() == null ? 0 : scraped.getVolume();
        String brand = scraped.getBrand();
        Optional<Liquor> existing = liquorRepository.findByBrandAndClazzAndVolume(brand, clazz, volume);
        if (existing.isPresent()) return existing.get();

        Liquor n = new Liquor();
        n.setNormalizedName(scraped.getNormalizedName());
        n.setName(scraped.getName());
        n.setBrand(brand);
        n.setCategory(scraped.getCategory());
        n.setCountry(scraped.getCountry());
        n.setAlcoholPercent(scraped.getAlcoholPercent());
        n.setVolume(volume);
        n.setClazz(clazz);
        n.setProductCode(scraped.getProductCode());
        n.setProductName(scraped.getFullname() == null ? scraped.getName() : scraped.getFullname());
        n.setProductUrl(scraped.getProductUrl());
        n.setImageUrl(scraped.getImageUrl());
        n.setLiquorInfo(scraped.getLiquorInfo());
        return liquorRepository.save(n);
    }

    private LiquorPrice upsertLiquorPrice(Liquor liquor, Liquor scraped) {
        LiquorPrice p = liquorPriceRepository.findByLiquorIdAndSource(liquor.getId(), NORMALIZED_SOURCE)
                .orElseGet(() -> LiquorPrice.builder().liquor(liquor).source(NORMALIZED_SOURCE).build());
        p.setLiquor(liquor);
        p.setSource(NORMALIZED_SOURCE);
        p.setCurrentPrice(scraped.getCurrentPrice());
        p.setOriginalPrice(scraped.getOriginalPrice());
        return liquorPriceRepository.save(p);
    }

    private void appendHistory(Liquor liquor, Liquor scraped) {
        if (scraped.getCurrentPrice() == null && scraped.getOriginalPrice() == null) return;
        liquorPriceHistoryRepository.save(LiquorPriceHistory.builder()
                .liquor(liquor)
                .source(NORMALIZED_SOURCE)
                .currentPrice(scraped.getCurrentPrice())
                .originalPrice(scraped.getOriginalPrice())
                .build());
    }

    private void upsertLiquorUrl(Liquor liquor, String productUrl, String imageUrl) {
        if (productUrl == null || productUrl.isBlank()) return;
        LiquorUrl url = liquorUrlRepository.findByLiquorIdAndSource(liquor.getId(), NORMALIZED_SOURCE)
                .orElseGet(() -> LiquorUrl.builder().liquor(liquor).source(NORMALIZED_SOURCE).build());
        url.setProductUrl(productUrl);
        url.setImageUrl(imageUrl);
        liquorUrlRepository.save(url);
    }

    private String buildNormalizedName(Liquor l) {
        String base = l.getFullname() == null ? "" : l.getFullname().trim();
        if (base.isBlank()) base = l.getName() == null ? "" : l.getName().trim();
        return base.toLowerCase(Locale.ROOT)
                .replaceAll("\\[.*?\\]", " ")
                .replaceAll("\\d+\\s*(ml|mL|ML|l|L|리터)", " ")
                .replaceAll("[^0-9a-z가-힣]+", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private String normalizeClazz(String clazz) {
        if (clazz == null) return "";
        return clazz.trim()
                .replaceAll("\\[.*?\\]", "")
                .replace("()", "")
                .replace(" ", "")
                .trim();
    }
}
