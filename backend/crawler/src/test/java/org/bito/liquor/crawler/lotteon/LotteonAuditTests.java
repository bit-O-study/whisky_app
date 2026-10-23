package org.bito.liquor.crawler.lotteon;

import org.bito.liquor.common.model.*;
import org.bito.liquor.common.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.lang.reflect.Method;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

// Regression coverage for the defects found during the crawler audit.
class LotteonAuditTests {
    private final LiquorUrlRepository urls = mock(LiquorUrlRepository.class);
    private final LiquorRepository liquors = mock(LiquorRepository.class);
    private final LiquorPriceRepository prices = mock(LiquorPriceRepository.class);
    private final LiquorPriceHistoryRepository histories = mock(LiquorPriceHistoryRepository.class);
    private final LiquorInfoRepository infos = mock(LiquorInfoRepository.class);
    private final LotteonScraper scraper = mock(LotteonScraper.class);
    private final LotteonCrawlService service = new LotteonCrawlService(urls, liquors, prices, histories, infos, scraper);

    private Object invoke(Object target, String name, Class<?> argumentType, Object argument) throws Exception {
        Method method = target.getClass().getDeclaredMethod(name, argumentType);
        method.setAccessible(true);
        return method.invoke(target, argument);
    }

    private LiquorInfo info(String brand, String clazz) {
        return LiquorInfo.builder().brand(brand).clazz(clazz).category("Whisky").volumeMl(700).build();
    }

    private Liquor scraped(Integer amount) {
        return Liquor.builder().name("라가불린 16년 (700ML)").brand("라가불린")
                .clazz("16년").category("Whisky").volume(700).currentPrice(amount).originalPrice(amount).build();
    }

    private LiquorPrice configureExistingPrice(Integer amount) {
        Liquor candidate = scraped(amount);
        Liquor existing = Liquor.builder().id(870L).brand("라가불린").clazz("16년").volume(700).build();
        LiquorPrice price = LiquorPrice.builder().id(1L).liquor(existing).source("LOTTEON")
                .currentPrice(144800).originalPrice(144800).crawledAt(LocalDateTime.of(2026, 9, 3, 13, 56)).build();
        when(scraper.scrapeLiquors()).thenReturn(List.of(candidate));
        when(infos.findByCategoryAndVolumeMl("Whisky", 700)).thenReturn(List.of(info("라가불린", "16년")));
        when(liquors.findByBrandAndClazzAndVolume("라가불린", "16년", 700)).thenReturn(Optional.of(existing));
        when(prices.findByLiquorIdAndSource(870L, "LOTTEON")).thenReturn(Optional.of(price));
        when(prices.save(any())).thenAnswer(call -> call.getArgument(0));
        return price;
    }

    @Test
    void zeroCollectedProductsFailInsteadOfReturningExistingPrices() {
        when(scraper.scrapeLiquors()).thenReturn(List.of());
        when(prices.findAllOrderByUpdatedAtDesc()).thenReturn(List.of(
                LiquorPrice.builder().source("EMART").build(), LiquorPrice.builder().source("LOTTEON").build()));
        assertThrows(IllegalStateException.class, () -> service.scrapeLiquors());
        verify(prices, never()).save(any());
    }

    @Test
    void successfullyUpdatedPriceRefreshesCrawledAt() {
        LiquorPrice existing = configureExistingPrice(149800);
        LocalDateTime previous = existing.getCrawledAt();
        service.scrapeLiquors();
        assertEquals(149800, existing.getCurrentPrice());
        assertTrue(existing.getCrawledAt().isAfter(previous));
        verify(histories).save(any());
    }

    @Test
    void missingParsedPricePreservesValidExistingPrice() {
        LiquorPrice existing = configureExistingPrice(null);
        assertThrows(IllegalStateException.class, () -> service.scrapeLiquors());
        assertEquals(144800, existing.getCurrentPrice());
        assertEquals(144800, existing.getOriginalPrice());
        verify(prices, never()).save(any());
        verify(histories, never()).save(any());
    }

    @Test
    void blackAliasReusesExistingBlackLabelMaster() {
        when(prices.save(any())).thenAnswer(call -> call.getArgument(0));
        Liquor candidate = Liquor.builder().name("조니워커 블랙 (700ML)").brand("조니워커")
                .category("Whisky").volume(700).clazz("블랙").currentPrice(47800).build();
        when(scraper.scrapeLiquors()).thenReturn(List.of(candidate));
        when(infos.findByCategoryAndVolumeMl("Whisky", 700)).thenReturn(List.of(info("조니워커", "블랙 라벨 12년")));
        when(liquors.findByBrandAndClazzAndVolume("조니워커", "블랙라벨", 700))
                .thenReturn(Optional.of(Liquor.builder().id(880L).build()));
        when(liquors.save(any())).thenAnswer(call -> { Liquor row = call.getArgument(0); row.setId(999L); return row; });
        service.scrapeLiquors();
        verify(liquors).findByBrandAndClazzAndVolume("조니워커", "블랙라벨", 700);
        verify(liquors, never()).save(any());
    }

    @Test
    void scriptCandidateHasProductUrlAndDecimalLitresAreParsed() throws Exception {
        LotteonScraper actual = new LotteonScraper(infos);
        String html = "<div data-item=\"{&quot;item_name&quot;:&quot;위스키 1.75L&quot;,&quot;price&quot;:50000,&quot;item_id&quot;:&quot;LM123456&quot;}\"></div>";
        Liquor candidate = (Liquor) invoke(actual, "parseFirstFromScript", String.class, html);
        assertNotNull(candidate);
        assertEquals("https://www.lotteon.com/p/product/LM123456", candidate.getProductUrl());
        assertEquals(1750, candidate.getVolume());
    }

    @Test
    void blackLabelMatchesImplicitTwelveYearsButRejectsBlackRuby() throws Exception {
        LotteonScraper actual = new LotteonScraper(infos);
        Method accepts = LotteonScraper.class.getDeclaredMethod("isAcceptableMatch", String.class, Liquor.class);
        accepts.setAccessible(true);
        Liquor black = Liquor.builder().name("조니워커 블랙 (700ML)").currentPrice(47800).build();
        Liquor ruby = Liquor.builder().name("조니워커 블랙 루비 (700ML)").currentPrice(56800).build();
        assertEquals(true, accepts.invoke(actual, "조니워커 블랙 라벨 12년 700", black));
        assertEquals(false, accepts.invoke(actual, "조니워커 블랙 라벨 12년 700", ruby));
    }

    @Test
    @EnabledIfEnvironmentVariable(named = "LOTTEON_LIVE_CHECK", matches = "1")
    void liveSeleniumSearchesThreeProductsWithoutDatabaseWrites() throws Exception {
        when(infos.findAll()).thenReturn(List.of(info("조니워커", "블랙 라벨"), info("라가불린", "16년"), info("발렌타인", "17년")));
        List<Liquor> results = new LotteonScraper(infos).scrapeLiquors();
        Path output = Path.of("build/audit/lotteon-selenium-results.json");
        Files.createDirectories(output.getParent());
        List<Map<String, Object>> rows = results.stream().map(row -> {
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("name", row.getName()); data.put("price", row.getCurrentPrice());
            data.put("volume", row.getVolume()); data.put("clazz", row.getClazz()); data.put("url", row.getProductUrl());
            return data;
        }).toList();
        Files.writeString(output, new ObjectMapper().writerWithDefaultPrettyPrinter().writeValueAsString(rows));
        assertEquals(3, results.size(), "See build/audit/lotteon-selenium-results.json and test logs");
        for (Liquor row : results) {
            assertTrue(row.getCurrentPrice() != null && row.getCurrentPrice() > 0);
            assertEquals(700, row.getVolume());
            assertNotNull(row.getProductUrl());
        }
    }
}
