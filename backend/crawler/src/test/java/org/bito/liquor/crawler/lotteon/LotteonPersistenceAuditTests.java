package org.bito.liquor.crawler.lotteon;

import org.bito.liquor.common.model.*;
import org.bito.liquor.common.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import java.time.LocalDateTime;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

// Real entity/repository persistence against a disposable, rollback-only H2 DB.
// Regression tests verify stored values after flush/clear, not just method calls.
@DataJpaTest(properties = { "spring.jpa.hibernate.ddl-auto=create-drop", "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect" })
@Import(LotteonCrawlService.class)
class LotteonPersistenceAuditTests {
    @Autowired TestEntityManager em;
    @Autowired LiquorRepository liquors;
    @Autowired LiquorPriceRepository prices;
    @Autowired LiquorPriceHistoryRepository histories;
    @Autowired LotteonCrawlService service;
    @MockitoBean LotteonScraper scraper;
    private Long liquorId;
    private final LocalDateTime oldTime = LocalDateTime.of(2026, 9, 3, 13, 56);

    @BeforeEach
    void seed() {
        LiquorInfo info = em.persist(LiquorInfo.builder().brand("라가불린").clazz("16년")
                .category("Whisky").volumeMl(700).alcoholPercent(43.0).build());
        Liquor row = em.persist(Liquor.builder().brand("라가불린").clazz("16년").category("Whisky")
                .volume(700).productName("라가불린 16년 (700ML)").liquorInfo(info).build());
        liquorId = row.getId();
        em.persist(LiquorPrice.builder().liquor(row).source("LOTTEON").currentPrice(144800)
                .originalPrice(144800).crawledAt(oldTime).build());
        em.flush();
        em.clear();
    }

    private Liquor candidate(Integer price) {
        return Liquor.builder().name("라가불린 16년 (700ML)").brand("라가불린").clazz("16년 ()")
                .volume(700).category("Whisky").currentPrice(price).originalPrice(price)
                .productUrl("https://www.lotteon.com/p/product/LM5000281005409").build();
    }

    @Test
    void persistedUpdatedPriceAndHistoryShareNewTimestamp() {
        when(scraper.scrapeLiquors()).thenReturn(List.of(candidate(149800)));
        service.scrapeLiquors(); em.flush(); em.clear();
        LiquorPrice persisted = prices.findByLiquorIdAndSource(liquorId, "LOTTEON").orElseThrow();
        assertEquals(149800, persisted.getCurrentPrice());
        assertTrue(persisted.getCrawledAt().isAfter(oldTime));
        assertEquals(1, histories.count());
        assertTrue(histories.findAll().get(0).getCrawledAt().isAfter(oldTime));
        assertEquals(persisted.getCrawledAt(), histories.findAll().get(0).getCrawledAt());
    }

    @Test
    void nullPricePreservesTheStoredPrice() {
        when(scraper.scrapeLiquors()).thenReturn(List.of(candidate(null)));
        assertThrows(IllegalStateException.class, () -> service.scrapeLiquors()); em.flush(); em.clear();
        assertEquals(144800, prices.findByLiquorIdAndSource(liquorId, "LOTTEON").orElseThrow().getCurrentPrice());
        assertEquals(0, histories.count());
    }

    @Test
    void emptyCollectionFailsAndControllerReturnsZeroWithErrorStatus() {
        when(scraper.scrapeLiquors()).thenReturn(List.of());
        var error = assertThrows(IllegalStateException.class, () -> service.scrapeLiquors());
        var response = new LotteonCrawlController(service).crawlFailed(error);
        assertEquals(500, response.getStatusCode().value());
        assertEquals(0, response.getBody().get("count"));
    }

    @Test
    void scrapedBlackReusesBlackLabelMaster() {
        LiquorInfo info = em.persist(LiquorInfo.builder().brand("조니워커").clazz("블랙 라벨 12년")
                .category("Whisky").volumeMl(700).build());
        em.persist(Liquor.builder().brand("조니워커").clazz("블랙라벨").category("Whisky")
                .volume(700).productName("조니워커 블랙 라벨 700ml").liquorInfo(info).build());
        when(scraper.scrapeLiquors()).thenReturn(List.of(Liquor.builder().brand("조니워커")
                .name("조니워커 블랙 (700ML)").clazz("블랙 ()").category("Whisky").volume(700)
                .currentPrice(47800).originalPrice(47800).build()));
        service.scrapeLiquors(); em.flush(); em.clear();
        assertTrue(liquors.findByBrandAndClazzAndVolume("조니워커", "블랙라벨", 700).isPresent());
        assertTrue(liquors.findByBrandAndClazzAndVolume("조니워커", "블랙", 700).isEmpty());
        assertEquals(2, liquors.count());
    }
}
