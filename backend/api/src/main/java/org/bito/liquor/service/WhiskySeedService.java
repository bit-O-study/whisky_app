package org.bito.liquor.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bito.liquor.common.model.Whisky;
import org.bito.liquor.common.repository.WhiskyRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class WhiskySeedService {

    private final WhiskyRepository whiskyRepository;

    @Value("${app.whisky.seed.enabled:true}")
    private boolean seedEnabled;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seedFamousWhiskies() {
        if (!seedEnabled) {
            log.info("유명 위스키 시드 비활성화(app.whisky.seed.enabled=false)");
            return;
        }

        int insertedOrUpdated = 0;
        for (WhiskySeed seed : defaultSeeds()) {
            upsert(seed);
            insertedOrUpdated++;
        }

        log.info("유명 위스키 시드 반영 완료: {}건", insertedOrUpdated);
    }

    private void upsert(WhiskySeed seed) {
        Whisky whisky = whiskyRepository.findBySeedKey(seed.seedKey()).orElseGet(Whisky::new);

        whisky.setSeedKey(seed.seedKey());
        whisky.setProductCode(seed.productCode());
        whisky.setNormalizedName(seed.normalizedName());
        whisky.setProductName(seed.productName());
        whisky.setBrand(seed.brand());
        whisky.setCategory("Whisky");
        whisky.setClazz(seed.clazz());
        whisky.setAlcoholPercent(seed.alcoholPercent());
        whisky.setSweet(seed.sweet());
        whisky.setSmoky(seed.smoky());
        whisky.setFruity(seed.fruity());
        whisky.setSpicy(seed.spicy());
        whisky.setWoody(seed.woody());
        whisky.setBody(seed.body());

        whiskyRepository.save(whisky);
    }

    private List<WhiskySeed> defaultSeeds() {
        return List.of(
                seed("seed_johnnie_walker_black_12", "조니워커 블랙 라벨 12년", "조니워커 블랙 라벨", "JOHNNIE WALKER", "블렌디드 스카치", 40.0, 35, 45, 25, 35, 30, 55),
                seed("seed_johnnie_walker_gold", "조니워커 골드 라벨", "조니워커 골드 라벨", "JOHNNIE WALKER", "블렌디드 스카치", 40.0, 45, 25, 35, 20, 35, 55),
                seed("seed_johnnie_walker_blonde", "조니워커 블론드", "조니워커 블론드", "JOHNNIE WALKER", "블렌디드 스카치", 40.0, 50, 10, 35, 20, 20, 35),
                seed("seed_macallan_12_double_cask", "맥캘란 12 더블 캐스크", "맥캘란 12 더블 캐스크", "THE MACALLAN", "스페이사이드 싱글몰트", 40.0, 65, 10, 45, 30, 55, 60),
                seed("seed_macallan_15_double_cask", "맥캘란 15 더블 캐스크", "맥캘란 15 더블 캐스크", "THE MACALLAN", "스페이사이드 싱글몰트", 43.0, 60, 15, 45, 35, 60, 65),
                seed("seed_balvenie_12_doublewood", "발베니 12 더블우드", "발베니 12 더블우드", "THE BALVENIE", "스페이사이드 싱글몰트", 40.0, 55, 10, 35, 35, 55, 60),
                seed("seed_glenfiddich_12", "글렌피딕 12년", "글렌피딕 12년", "GLENFIDDICH", "스페이사이드 싱글몰트", 40.0, 45, 10, 55, 25, 35, 40),
                seed("seed_glenlivet_12", "글렌리벳 12년", "글렌리벳 12년", "THE GLENLIVET", "스페이사이드 싱글몰트", 40.0, 45, 10, 60, 20, 30, 40),
                seed("seed_glen_dronach_12", "글렌드로낙 12년", "글렌드로낙 12년", "GLENDRONACH", "하이랜드 싱글몰트", 43.0, 65, 15, 55, 35, 60, 60),
                seed("seed_ardbeg_10", "아드벡 10년", "아드벡 10년", "ARDBEG", "아일라 싱글몰트", 46.0, 20, 90, 20, 45, 55, 65),
                seed("seed_lagavulin_16", "라가불린 16년", "라가불린 16년", "LAGAVULIN", "아일라 싱글몰트", 43.0, 25, 85, 25, 45, 60, 70),
                seed("seed_suntory_kakubin", "산토리 가쿠빈", "산토리 가쿠빈", "SUNTORY", "재패니즈 블렌디드", 40.0, 45, 10, 30, 25, 35, 45),
                seed("seed_grants_triple_wood", "그란츠 트리플 우드", "그란츠 트리플 우드", "GRANT'S", "블렌디드 스카치", 40.0, 45, 15, 30, 25, 35, 45),
                seed("seed_chivas_regal_12", "시바스 리갈 12년", "시바스 리갈 12년", "CHIVAS REGAL", "블렌디드 스카치", 40.0, 55, 15, 40, 25, 35, 50),
                seed("seed_royal_salute_21", "로얄 살루트 21년", "로얄 살루트 21년", "ROYAL SALUTE", "블렌디드 스카치", 40.0, 60, 15, 45, 30, 45, 65),
                seed("seed_wild_turkey_101", "와일드 터키 101", "와일드 터키 101", "WILD TURKEY", "버번", 50.5, 35, 15, 25, 65, 55, 80),
                seed("seed_jim_beam_white", "짐 빔 화이트 라벨", "짐 빔 화이트 라벨", "JIM BEAM", "버번", 40.0, 45, 10, 25, 55, 40, 55),
                seed("seed_buffalo_trace", "버팔로 트레이스", "버팔로 트레이스", "BUFFALO TRACE", "버번", 45.0, 50, 10, 30, 50, 45, 60),
                seed("seed_jameson", "제임슨", "제임슨", "JAMESON", "아이리시 블렌디드", 40.0, 50, 10, 35, 25, 30, 45),
                seed("seed_bells", "벨즈", "벨즈", "BELL'S", "블렌디드 스카치", 40.0, 45, 20, 25, 25, 30, 45)
        );
    }

    private WhiskySeed seed(
            String seedKey,
            String normalizedName,
            String productName,
            String brand,
            String clazz,
            Double alcoholPercent,
            double sweet,
            double smoky,
            double fruity,
            double spicy,
            double woody,
            double body
    ) {
        return new WhiskySeed(
                seedKey,
                null,
                normalizedName,
                productName,
                brand,
                clazz,
                alcoholPercent,
                sweet,
                smoky,
                fruity,
                spicy,
                woody,
                body
        );
    }

    private record WhiskySeed(
            String seedKey,
            String productCode,
            String normalizedName,
            String productName,
            String brand,
            String clazz,
            Double alcoholPercent,
            Double sweet,
            Double smoky,
            Double fruity,
            Double spicy,
            Double woody,
            Double body
    ) {
    }
}
