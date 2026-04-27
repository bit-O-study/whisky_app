package org.bito.liquor.crawler.costco;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bito.liquor.common.model.Liquor;
import org.bito.liquor.common.repository.LiquorInfoRepository;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.springframework.stereotype.Component;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Costco Korea 검색 페이지를 Selenium 기반으로 스크랩.
 *
 * <p>Costco Korea는 SAP Commerce(Hybris) 기반 SPA로, 가격/상품 데이터가
 * 페이지 로드 후 XHR(JSON)로 비동기 채워진다. curl로는 데이터 없는 shell만
 * 받기 때문에 Selenium 필수.
 *
 * <p>주의: 일부 회원 전용 가격은 비로그인 상태에서는 노출되지 않을 수 있음.
 * 이 스크래퍼는 비로그인 표시가만 수집한다.
 *
 * <p>TODO: 실제 운영 전에 다음 selector를 브라우저 DevTools로 확정 필요:
 *  - 상품 카드 컨테이너  (현재 추정: ".product-tile" / "[data-product-id]")
 *  - 상품명               (".description" / ".product-title")
 *  - 가격                  (".product-price" / ".price-value" / "[data-price]")
 *  - 상품 링크            ("a[href*='/p/']")
 *  - 상품 이미지          ("img[src*='/medias/']")
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CostcoScraper {

    private final LiquorInfoRepository liquorInfoRepository;

    private static final String SEARCH_URL_TEMPLATE = "https://www.costco.co.kr/search?q=%s";
    private static final String SOURCE = "COSTCO";
    private static final int MIN_MATCH_SCORE = 30;
    private static final int MAX_ITEMS_PER_KEYWORD = 12;

    // 실제 Angular Storefront DOM 진단으로 확정한 selector.
    // 카드: <li class="product-list-item ..."> 또는 <sip-product-list-item>
    // 링크: <a class="thumb" href="/.../p/{code}">
    // 영문명: <a class="lister-name-en">
    // 한글명/가격: 둘 다 <span class="notranslate"> — 텍스트 패턴(원/숫자)으로 구분
    private static final String[] ITEM_SELECTORS = {
            "li.product-list-item",
            "sip-product-list-item",
            "[class*='product-list-item']",
    };

    private static final List<String> KNOWN_BRANDS = List.of(
            "조니워커", "발렌타인", "글렌피딕", "맥캘란", "짐빔", "산토리", "잭다니엘",
            "와일드터키", "버팔로트레이스", "메이커스마크", "로얄살루트", "시바스리갈",
            "글렌리벳", "발베니", "아드벡", "라프로익", "탈리스커", "싱글톤",
            "제임슨", "벨즈", "히비키", "야마자키", "카발란", "그란츠"
    );

    public List<Liquor> scrapeLiquors() {
        List<Liquor> liquors = new ArrayList<>();
        WebDriver driver = null;

        try {
            driver = createWebDriver();

            List<String> keywords = generateDynamicKeywords();
            log.info("Costco 동적 검색 키워드 {}개 생성", keywords.size());

            for (String keyword : keywords) {
                try {
                    String url = String.format(SEARCH_URL_TEMPLATE,
                            URLEncoder.encode(keyword, StandardCharsets.UTF_8).replace("+", "%20"));
                    log.info("Costco 검색: '{}' | {}", keyword, url);
                    driver.get(url);

                    // SPA hydration 대기 — 첫 상품 카드가 DOM에 들어올 때까지
                    Thread.sleep(1500);
                    ((JavascriptExecutor) driver).executeScript("window.scrollBy(0, 800)");
                    Thread.sleep(500);

                    List<WebElement> items = findItemsWithFallback(driver, keyword);
                    if (items.isEmpty()) {
                        log.warn("'{}' Costco 검색 결과 없음 (셀렉터 실패)", keyword);
                        continue;
                    }
                    log.info("'{}' Costco 아이템 {}개 발견", keyword, items.size());

                    Liquor best = null;
                    int bestScore = Integer.MIN_VALUE;
                    int limit = Math.min(items.size(), MAX_ITEMS_PER_KEYWORD);
                    for (int i = 0; i < limit; i++) {
                        Liquor candidate = extractItem(items.get(i));
                        if (candidate == null) continue;
                        int score = calculateMatchScore(keyword, candidate);
                        if (score > bestScore) {
                            bestScore = score;
                            best = candidate;
                        }
                    }

                    if (best != null && bestScore >= MIN_MATCH_SCORE) {
                        liquors.add(best);
                        log.info("'{}' → 수집 성공: '{}' ({}점, {}원)",
                                keyword, best.getName(), bestScore, best.getCurrentPrice());
                    } else {
                        log.warn("'{}' → 매칭 점수 미달 (best={}, threshold={})",
                                keyword, bestScore, MIN_MATCH_SCORE);
                    }

                } catch (Exception e) {
                    log.error("'{}' Costco 처리 중 오류: {}", keyword, e.getMessage());
                }
            }
            log.info("=== 전체 Costco 크롤링 완료: 총 {}건 수집 ===", liquors.size());

        } catch (Exception e) {
            log.error("Costco 크롤링 치명적 오류: {}", e.getMessage(), e);
        } finally {
            if (driver != null) driver.quit();
        }
        return liquors;
    }

    private List<String> generateDynamicKeywords() {
        return liquorInfoRepository.findAll().stream()
                .map(info -> {
                    StringBuilder b = new StringBuilder();
                    if (info.getBrand() != null && !info.getBrand().isBlank()) {
                        b.append(info.getBrand()).append(' ');
                    }
                    if (info.getClazz() != null
                            && !info.getClazz().equalsIgnoreCase("none")
                            && !info.getClazz().isBlank()) {
                        b.append(info.getClazz().replace(" ", "")).append(' ');
                    }
                    if (info.getVolumeMl() != null) {
                        b.append(info.getVolumeMl()).append("ml");
                    }
                    return b.toString().trim();
                })
                .filter(k -> !k.isEmpty())
                .distinct()
                .collect(Collectors.toList());
    }

    private List<WebElement> findItemsWithFallback(WebDriver driver, String keyword) {
        for (String selector : ITEM_SELECTORS) {
            try {
                WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(4));
                wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector(selector)));
                List<WebElement> els = driver.findElements(By.cssSelector(selector));
                if (!els.isEmpty()) {
                    log.debug("'{}' 매칭 셀렉터: {} ({}개)", keyword, selector, els.size());
                    return els;
                }
            } catch (Exception ignored) {
                // 다음 셀렉터로
            }
        }
        return Collections.emptyList();
    }

    private static final Pattern PRICE_PATTERN = Pattern.compile("([0-9][0-9,]*)\\s*원");

    private Liquor extractItem(WebElement el) {
        try {
            // 카드 안의 모든 .notranslate 텍스트를 모은다 — 가격 패턴(N원)이면 가격, 아니면 한글 상품명.
            String priceTxt = null;
            String koreanName = null;
            for (WebElement n : el.findElements(By.cssSelector("span.notranslate"))) {
                String t = n.getText();
                if (t == null || t.isBlank()) continue;
                Matcher pm = PRICE_PATTERN.matcher(t);
                if (pm.find()) {
                    if (priceTxt == null) priceTxt = pm.group(1).replace(",", "");
                } else if (koreanName == null) {
                    koreanName = t.trim();
                }
            }

            // 영문명 fallback
            String englishName = null;
            try {
                englishName = el.findElement(By.cssSelector("a.lister-name-en")).getText().trim();
            } catch (org.openqa.selenium.NoSuchElementException ignored) {}

            // 한글 상품명을 우선, 없으면 a.thumb의 title 속성, 없으면 영문명
            String name = koreanName;
            if (name == null || name.isBlank()) {
                try {
                    String t = el.findElement(By.cssSelector("a.thumb")).getAttribute("title");
                    if (t != null && !t.isBlank()) name = t.trim();
                } catch (org.openqa.selenium.NoSuchElementException ignored) {}
            }
            if (name == null || name.isBlank()) name = englishName;
            if (name == null || name.isBlank()) return null;

            Liquor.LiquorBuilder b = Liquor.builder()
                    .name(name)
                    .source(SOURCE)
                    .category(detectCategory(name));

            if (priceTxt != null) {
                try {
                    int price = Integer.parseInt(priceTxt);
                    b.currentPrice(price);
                    b.originalPrice(price);
                } catch (NumberFormatException e) {
                    b.currentPrice(0);
                }
            } else {
                b.currentPrice(0);
            }

            try {
                WebElement link = el.findElement(By.cssSelector("a.thumb"));
                String href = link.getAttribute("href");
                if (href == null || href.isEmpty()) {
                    // 폴백: 첫 번째 a 태그
                    href = el.findElement(By.tagName("a")).getAttribute("href");
                }
                if (href == null || href.isEmpty()) return null;
                b.productUrl(href);
                String code = href.contains("/p/")
                        ? href.split("/p/")[1].split("[/?#]")[0]
                        : String.valueOf(Math.abs(name.hashCode()));
                b.productCode("COSTCO_" + code);
            } catch (org.openqa.selenium.NoSuchElementException e) {
                return null;
            }

            try {
                String img = el.findElement(By.tagName("img")).getAttribute("src");
                b.imageUrl(img);
            } catch (org.openqa.selenium.NoSuchElementException ignored) {}

            Liquor liquor = b.build();
            enrichLiquorInfo(liquor);
            return liquor;
        } catch (Exception e) {
            log.debug("Costco item 파싱 실패: {}", e.getMessage());
            return null;
        }
    }

    private String detectCategory(String name) {
        if (name == null) return "Other";
        String n = name.replace(" ", "");
        if (n.contains("위스키") || n.contains("Whisky") || n.contains("Whiskey")
                || n.contains("Bourbon") || n.contains("버번")) return "Whisky";
        if (n.contains("와인") || n.contains("Wine")) return "Wine";
        if (n.contains("샴페인") || n.contains("Champagne")) return "Champagne";
        if (n.contains("보드카") || n.contains("Vodka")) return "Vodka";
        if (n.contains("브랜디") || n.contains("Brandy") || n.contains("코냑")) return "Brandy";
        if (n.contains("진") && (n.contains("Gin") || n.contains("진토닉"))) return "Gin";
        return "Other";
    }

    private void enrichLiquorInfo(Liquor liquor) {
        String name = liquor.getName();
        String foundBrand = "기타";
        for (String brand : KNOWN_BRANDS) {
            if (name.contains(brand)) { foundBrand = brand; break; }
        }
        liquor.setBrand(foundBrand);

        Pattern abv = Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*(%|도)");
        Matcher mAbv = abv.matcher(name);
        liquor.setAlcoholPercent(mAbv.find()
                ? Double.parseDouble(mAbv.group(1))
                : "Whisky".equals(liquor.getCategory()) ? 40.0 : 0.0);

        Pattern vol = Pattern.compile("(\\d+)\\s*(ml|ML|mL|L|l)");
        Matcher mVol = vol.matcher(name);
        if (mVol.find()) {
            int v = Integer.parseInt(mVol.group(1));
            String unit = mVol.group(2).toLowerCase();
            if (unit.equals("l")) v *= 1000;
            liquor.setVolume(v);
        } else {
            liquor.setVolume("Whisky".equals(liquor.getCategory()) ? 700 : 750);
        }
        liquor.setClazz("None");
    }

    private int calculateMatchScore(String keyword, Liquor liquor) {
        if (liquor == null || liquor.getName() == null || liquor.getName().isBlank()) return Integer.MIN_VALUE;
        String name = liquor.getName();
        String nk = normalizeForMatch(keyword);
        String nn = normalizeForMatch(name);
        int score = 0;
        if (nn.contains(nk)) score += 100;
        for (String token : keyword.split("\\s+")) {
            String nt = normalizeForMatch(token);
            if (nt.length() < 2) continue;
            score += nn.contains(nt) ? 18 : -6;
        }
        if (containsLiquorHint(name)) score += 25;
        if (containsAccessoryHint(name)) score -= 80;
        return score;
    }

    private boolean containsLiquorHint(String n) {
        String l = n.toLowerCase();
        return l.contains("위스키") || l.contains("whisky") || l.contains("whiskey")
                || l.contains("스카치") || l.contains("버번") || l.contains("싱글몰트")
                || l.contains("와인") || l.contains("샴페인") || l.contains("보드카");
    }
    private boolean containsAccessoryHint(String n) {
        String l = n.toLowerCase();
        return l.contains("잔") || l.contains("글라스") || l.contains("디캔터")
                || l.contains("코스터") || l.contains("미니어처");
    }

    private String normalizeForMatch(String text) {
        if (text == null) return "";
        return text.toLowerCase().replace(" ", "").replaceAll("[^0-9a-z가-힣]", "");
    }

    private WebDriver createWebDriver() {
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--headless=new");
        options.addArguments("--disable-blink-features=AutomationControlled");
        options.setExperimentalOption("excludeSwitches", Collections.singletonList("enable-automation"));
        options.setExperimentalOption("useAutomationExtension", false);
        options.addArguments("--disable-gpu");
        options.addArguments("--no-sandbox");
        options.addArguments("--disable-dev-shm-usage");
        options.addArguments("--window-size=1920,1080");
        options.addArguments("--lang=ko_KR");
        options.addArguments("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");

        ChromeDriver driver = new ChromeDriver(options);
        Map<String, Object> params = new HashMap<>();
        params.put("source", "Object.defineProperty(navigator, 'webdriver', { get: () => undefined })");
        driver.executeCdpCommand("Page.addScriptToEvaluateOnNewDocument", params);
        return driver;
    }
}
