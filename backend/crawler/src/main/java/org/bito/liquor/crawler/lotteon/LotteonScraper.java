package org.bito.liquor.crawler.lotteon;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bito.liquor.common.model.Liquor;
import org.bito.liquor.common.repository.LiquorInfoRepository;
import org.json.JSONObject;
import org.openqa.selenium.By;
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
import java.util.Arrays;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class LotteonScraper {

    private final LiquorInfoRepository liquorInfoRepository;
    private static final String SEARCH_URL_TEMPLATE = "https://www.lotteon.com/search/search/search.ecn?render=search&platform=pc&q=%s";
    private static final String SOURCE = "LOTTEON";
    private static final int MIN_MATCH_SCORE = 30;

//    private static final List<String> TARGET_KEYWORDS = Arrays.asList(
//            "산토리 가쿠빈",
//            "그란츠 트리플 우드",
//            "맥캘란 12 더블 캐스크",
//            "발베니 12 더블우드",
//            "시바스 리갈 12년",
//            "조니워커 블랙 라벨",
//            "글렌드로낙 12년",
//            "벨즈",
//            "와일드 터키 101",
//            "짐 빔 화이트 라벨",
//            "제임슨",
//            "조니워커 블론드",
//            "맥캘란 15년",
//            "조니워커 골드 라벨",
//            "아드벡 10년",
//            "글렌피딕 12년",
//            "글렌리벳 12년",
//            "버팔로 트레이스",
//            "라가불린 16년",
//            "로얄 살루트 21년"
//    );
    private List<String> generateDynamicKeywords() {
        return liquorInfoRepository.findAll().stream()
                .map(info -> {
                    StringBuilder keywordBuilder = new StringBuilder();

                    if (info.getBrand() != null && !info.getBrand().isBlank()) {
                        keywordBuilder.append(info.getBrand()).append(" ");
                    }

                    if (info.getClazz() != null
                            && !info.getClazz().equalsIgnoreCase("none")
                            && !info.getClazz().isBlank()) {
                        keywordBuilder.append(info.getClazz()).append(" ");
                    }

                    if (info.getVolumeMl() != null) {
                        keywordBuilder.append(info.getVolumeMl());
                    }

                    return keywordBuilder.toString().trim();
                })
                .filter(keyword -> !keyword.isEmpty())
                .distinct()
                .collect(Collectors.toList());
    }
    public List<Liquor> scrapeLiquors() {
        List<Liquor> liquors = new ArrayList<>();
        WebDriver driver = null;

        try {
            driver = createWebDriver();

            List<String> targetKeywords = generateDynamicKeywords();
            log.info("총 {}개의 동적 검색 키워드를 생성했습니다.", targetKeywords.size());

            for (String keyword : targetKeywords) {
                try {
                    String encodedKeyword = URLEncoder.encode(keyword, StandardCharsets.UTF_8);
                    String searchUrl = String.format(SEARCH_URL_TEMPLATE, encodedKeyword);
                    log.info("키워드 검색 중: '{}' | URL: {}", keyword, searchUrl);

                    driver.get(searchUrl);

                    WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
                    try {
                        wait.until(ExpectedConditions.presenceOfElementLocated(
                                By.cssSelector("[class*='product'], [class*='srchProduct'], li[data-index]")));
                    } catch (Exception e) {
                        log.warn("'{}' 검색 결과 대기 타임아웃", keyword);
                    }

                    Thread.sleep(3000);

                    String pageSource = driver.getPageSource();
                    Liquor liquor = parseFirstFromScript(pageSource);

                    if (!isAcceptableMatch(keyword, liquor)) {
                        liquor = parseBestFromDOM(driver, keyword);
                    }

                    if (liquor != null) {
                        liquors.add(liquor);
                        log.info("'{}' → 상품 수집 성공: {} - {}원", keyword, liquor.getName(), liquor.getCurrentPrice());
                    } else {
                        log.warn("'{}' → 검색 결과 없음 (DOM 파싱 실패 또는 매칭 점수 미달)", keyword);

                        try {
                            String fileName = "lotteon_debug_" + keyword.replaceAll("\\s+", "_") + ".html";
                            java.nio.file.Files.writeString(
                                    java.nio.file.Paths.get(fileName),
                                    pageSource,
                                    java.nio.charset.StandardCharsets.UTF_8
                            );
                            log.info(" 디버깅용 HTML 저장 완료: {}", fileName);
                        } catch (Exception ex) {
                            log.error("HTML 파일 저장 실패", ex);
                        }
                    }

                    Thread.sleep((long) (Math.random() * 1500) + 1500);

                } catch (Exception e) {
                    log.error("'{}' 검색 중 오류: {}", keyword, e.getMessage());
                }
            }

            log.info("롯데온 크롤링 완료: 총 {}개 상품 수집", liquors.size());

        } catch (Exception e) {
            log.error("크롤링 중 치명적 오류: {}", e.getMessage(), e);
        } finally {
            if (driver != null) {
                driver.quit();
            }
        }

        return liquors;
    }

    private WebDriver createWebDriver() {
        System.clearProperty("webdriver.chrome.driver");

        ChromeOptions options = new ChromeOptions();

        options.addArguments("--headless=new");

        options.addArguments("--no-sandbox");
        options.addArguments("--disable-dev-shm-usage");
        options.addArguments("--disable-gpu");
        options.addArguments("--window-size=1920,1080");

        options.addArguments("--disable-blink-features=AutomationControlled");
        options.addArguments("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

        options.addArguments("--remote-allow-origins=*");

        options.setExperimentalOption("excludeSwitches", new String[]{"enable-automation"});
        options.setExperimentalOption("useAutomationExtension", false);

        return new ChromeDriver(options);
    }
    private Liquor parseFirstFromScript(String pageSource) {
        try {
            Pattern dataItemPattern = Pattern.compile("data-item=\"\\{([^}]+)\\}\"");
            Matcher matcher = dataItemPattern.matcher(pageSource);

            if (matcher.find()) {
                String jsonStr = "{" + matcher.group(1) + "}";
                jsonStr = jsonStr.replace("&quot;", "\"")
                        .replace("&amp;", "&")
                        .replace("&lt;", "<")
                        .replace("&gt;", ">");

                JSONObject item = new JSONObject(jsonStr);

                String itemName = item.optString("item_name", "");
                if (itemName.isEmpty()) return null;

                int price = item.optInt("price", 0);
                int discount = item.optInt("discount", 0);
                String itemId = item.optString("item_id", "");

                Liquor liquor = Liquor.builder()
                        .productCode(itemId.isEmpty() ? createFallbackProductCode(itemName) : "LOTTEON_" + itemId)
                        .name(itemName)
                        .currentPrice(price)
                        .originalPrice(discount > 0 ? price + discount : price)
                        .source(SOURCE)
                        .build();

                extractDetailsFromName(liquor);
                return liquor;
            }
        } catch (Exception e) {
            log.debug("Script 파싱 실패: {}", e.getMessage());
        }
        return null;
    }

    private Liquor parseBestFromDOM(WebDriver driver, String keyword) {
        Liquor best = null;
        int bestScore = Integer.MIN_VALUE;
        // ⭐️ 롯데온의 새로운 HTML 구조(c-product-card) 반영
        String[] selectors = {
                ".c-product-card",          // 최신 롯데온 상품 카드
                ".c-product-list__item",    // 최신 롯데온 리스트
                "li[data-index]",
                ".srchProductItem",
                "[class*='productItem']",
                ".product-list li",
                "[class*='prd-item']"
        };

        for (String selector : selectors) {
            List<WebElement> elements = driver.findElements(By.cssSelector(selector));
            if (!elements.isEmpty()) {
                int limit = Math.min(elements.size(), 20);
                for (int i = 0; i < limit; i++) {
                    Liquor liquor = extractFromElement(elements.get(i));
                    int score = calculateMatchScore(keyword, liquor);
                    if (score > bestScore) {
                        bestScore = score;
                        best = liquor;
                    }
                }
                break;
            }
        }
        return bestScore >= MIN_MATCH_SCORE ? best : null;
    }

    private Liquor extractFromElement(WebElement element) {
        Liquor.LiquorBuilder builder = Liquor.builder().source(SOURCE);
        String name = "";

        try {
            // 새로운 타이틀 클래스명(.c-product-title__title) 추가
            WebElement nameEl = element.findElement(By.cssSelector(".c-product-title__title, [class*='name'], [class*='title'], .prd-name"));
            name = nameEl.getText().trim();
            builder.name(name);
        } catch (Exception e) {
            log.warn("상품명 파싱 실패 (HTML 구조 변경 또는 요소 없음)");
            return null;
        }

        try {
            // 롯데온은 정상가/할인율/최종가가 뭉쳐있어 '최종가'만 정확히 타겟팅해야 480억 원짜리 위스키가 안 나옵니다.
            WebElement priceEl;
            try {
                priceEl = element.findElement(By.cssSelector(".c-product-price__final, [class*='price__final']"));
            } catch (Exception e) {
                // 최종가 태그가 없을 경우를 대비한 옛날 방식 폴백
                priceEl = element.findElement(By.cssSelector("[class*='price'], .prd-price"));
            }

            String priceText = priceEl.getText().replaceAll("[^0-9]", "");
            if (!priceText.isEmpty()) {
                builder.currentPrice(Integer.parseInt(priceText));
            }
        } catch (Exception e) {
            log.warn("가격 파싱 실패: {}", name);
        }

        try {
            WebElement imgEl = element.findElement(By.cssSelector("img"));
            String src = imgEl.getAttribute("src");
            if (src == null || src.isEmpty()) {
                src = imgEl.getAttribute("data-src");
            }
            builder.imageUrl(src);
        } catch (Exception ignored) {}

        try {
            WebElement linkEl = element.findElement(By.cssSelector("a"));
            String href = linkEl.getAttribute("href");
            builder.productUrl(href);

            Pattern pattern = Pattern.compile("/product/([A-Za-z0-9]+)");
            Matcher matcher = pattern.matcher(href);
            if (matcher.find()) {
                builder.productCode("LOTTEON_" + matcher.group(1));
            } else {
                builder.productCode(createFallbackProductCode(name));
            }
        } catch (Exception e) {
            builder.productCode(createFallbackProductCode(name));
        }

        Liquor liquor = builder.build();
        extractDetailsFromName(liquor);
        return liquor;
    }

    private String createFallbackProductCode(String name) {
        String normalized = normalizeForMatch(name);
        if (normalized.isBlank()) {
            normalized = "unknown";
        }
        return "LOTTEON_NAME_" + Integer.toUnsignedLong(normalized.hashCode());
    }

    private boolean isAcceptableMatch(String keyword, Liquor liquor) {
        return calculateMatchScore(keyword, liquor) >= MIN_MATCH_SCORE;
    }

    private int calculateMatchScore(String keyword, Liquor liquor) {
        if (liquor == null || liquor.getName() == null || liquor.getName().isBlank()) {
            return Integer.MIN_VALUE;
        }

        String name = liquor.getName();
        String normalizedKeyword = normalizeForMatch(keyword);
        String normalizedName = normalizeForMatch(name);
        int score = 0;

        if (normalizedName.contains(normalizedKeyword)) {
            score += 100;
        }

        for (String token : keyword.split("\\s+")) {
            String normalizedToken = normalizeForMatch(token);
            if (normalizedToken.length() < 2) {
                continue;
            }
            if (normalizedName.contains(normalizedToken)) {
                score += 18;
            } else {
                score -= 6;
            }
        }

        if (containsLiquorHint(name)) {
            score += 25;
        }
        if (containsAccessoryHint(name)) {
            score -= 80;
        }

        return score;
    }

    private boolean containsLiquorHint(String name) {
        String lower = name.toLowerCase();
        return lower.contains("위스키")
                || lower.contains("whisky")
                || lower.contains("whiskey")
                || lower.contains("버번")
                || lower.contains("스카치")
                || lower.contains("single malt")
                || lower.contains("싱글몰트");
    }

    private boolean containsAccessoryHint(String name) {
        String lower = name.toLowerCase();
        return lower.contains("잔")
                || lower.contains("글라스")
                || lower.contains("머그")
                || lower.contains("컵")
                || lower.contains("치약")
                || lower.contains("원피스")
                || lower.contains("팬츠")
                || lower.contains("스푼");
    }

    private String normalizeForMatch(String text) {
        if (text == null) {
            return "";
        }
        return text.toLowerCase()
                .replace(" ", "")
                .replace("더블우드", "더블 우드")
                .replace("더블캐스크", "더블 캐스크")
                .replace("트리플우드", "트리플 우드")
                .replace("블랙라벨", "블랙 라벨")
                .replace("골드라벨", "골드 라벨")
                .replace("화이트라벨", "화이트 라벨")
                .replace("버팔로트레이스", "버팔로 트레이스")
                .replace("와일드터키", "와일드 터키")
                .replace("조니워커", "조니 워커")
                .replace("시바스리갈", "시바스 리갈")
                .replace("로얄살루트", "로얄 살루트")
                .replace("짐빔", "짐 빔")
                .replace("맥켈란", "맥캘란")
                .replaceAll("[^0-9a-z가-힣]", "");
    }

    private void extractDetailsFromName(Liquor liquor) {
        if (liquor.getName() == null) return;

        String name = liquor.getName();

        // fullname = 원본 상품명 그대로
        liquor.setFullname(name);

        String[] brands = {"조니워커", "발렌타인", "글렌피딕", "글렌리벳", "맥캘란", "잭다니엘",
                "짐빔", "와일드터키", "메이커스마크", "시바스리갈", "로얄살루트", "윈저",
                "산토리", "그란츠", "발베니", "글렌드로낙", "아드벡", "라가불린", "버팔로트레이스",
                "제임슨", "벨즈",
                "Johnnie Walker", "Ballantine", "Glenfiddich", "Glenlivet", "Macallan",
                "Jack Daniel", "Jim Beam", "Wild Turkey", "Maker's Mark", "Chivas Regal",
                "조니 워커", "잭 다니엘", "글렌 피딕", "짐 빔", "와일드 터키",
                "시바스 리갈", "로얄 살루트", "버팔로 트레이스"};

        for (String brand : brands) {
            if (name.toLowerCase().contains(brand.toLowerCase())) {
                liquor.setBrand(brand);
                break;
            }
        }

        Pattern volumePattern = Pattern.compile("(\\d+)\\s*(ml|ML|L|l|리터)", Pattern.CASE_INSENSITIVE);
        Matcher volumeMatcher = volumePattern.matcher(name);
        if (volumeMatcher.find()) {
            int volume = Integer.parseInt(volumeMatcher.group(1));
            String unit = volumeMatcher.group(2).toLowerCase();
            if (unit.equals("l") || unit.equals("리터")) {
                volume *= 1000;
            }
            liquor.setVolume(volume);
        }

        Pattern alcoholPattern = Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*(%|도|프루프)");
        Matcher alcoholMatcher = alcoholPattern.matcher(name);
        if (alcoholMatcher.find()) {
            double alcohol = Double.parseDouble(alcoholMatcher.group(1));
            if (alcoholMatcher.group(2).equals("프루프")) {
                alcohol = alcohol / 2;
            }
            liquor.setAlcoholPercent(alcohol);
        }

        String lowerName = name.toLowerCase();
        if (lowerName.contains("위스키") || lowerName.contains("whisky") || lowerName.contains("whiskey")
                || lowerName.contains("스카치") || lowerName.contains("버번")) {
            liquor.setCategory("Whisky");
        } else if (lowerName.contains("브랜디") || lowerName.contains("brandy") || lowerName.contains("코냑")) {
            liquor.setCategory("Brandy");
        } else if (lowerName.contains("보드카") || lowerName.contains("vodka")) {
            liquor.setCategory("Vodka");
        } else if (lowerName.contains("럼") || lowerName.contains("rum")) {
            liquor.setCategory("Rum");
        } else if (lowerName.contains("진") || lowerName.contains("gin")) {
            liquor.setCategory("Gin");
        } else if (lowerName.contains("테킬라") || lowerName.contains("tequila")) {
            liquor.setCategory("Tequila");
        } else {
            liquor.setCategory("Whisky");
        }

        // clazz = 브랜드 + 용량 정보 제거한 나머지
        String clazz = name;
        if (liquor.getBrand() != null) {
            clazz = clazz.replace(liquor.getBrand(), "").trim();
        }
        clazz = clazz.replaceAll("\\d+\\s*(ml|ML|mL|L|l|리터)", "").trim();
        clazz = clazz.replaceAll("\\s+", " ").trim();
        liquor.setClazz(clazz);
    }
}
