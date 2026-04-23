package org.bito.liquor.crawler.traders;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bito.liquor.common.model.Liquor;
import org.bito.liquor.common.repository.LiquorInfoRepository;
import org.json.JSONArray;
import org.json.JSONObject;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.springframework.stereotype.Component;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * E-Mart Traders (트레이더스 홀세일 클럽) 스크래퍼.
 *
 * <p>Traders는 SSG 우산 안에 있어 emart.ssg.com 도메인의 검색 결과를
 * 트레이더스 카테고리(dispCtgId=6000095831)로 필터링해 사용한다. 자체 도메인
 * (store.traders.co.kr)도 있지만 검색은 SSG SSR로 이뤄진다.
 *
 * <p>EmartScraper와 동일한 NEXT_DATA JSON 파싱 로직을 사용 — 차이는
 * URL 파라미터(카테고리 필터)와 SOURCE만.
 *
 * <p>TODO: 운영 전에 Traders 전용 dispCtgId가 정확한지(주류 카테고리)
 * 브라우저로 한 번 확인 필요. 현재 6000095831은 추정값.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TradersScraper {

    private final LiquorInfoRepository liquorInfoRepository;

    // 트레이더스 카테고리(주류) 추정 dispCtgId
    private static final String TRADERS_DISP_CTG_ID = "6000095831";
    private static final String SEARCH_URL_TEMPLATE =
            "https://emart.ssg.com/search.ssg?query=%s&dispCtgId=" + TRADERS_DISP_CTG_ID;
    private static final String SOURCE = "TRADERS";
    private static final int MIN_MATCH_SCORE = 30;
    private static final int MAX_ITEMS_PER_KEYWORD = 20;

    private static final Pattern NEXT_DATA_PATTERN = Pattern.compile(
            "<script id=\"__NEXT_DATA__\" type=\"application/json\">([\\s\\S]*?)</script>");

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
            log.info("Traders 동적 검색 키워드 {}개 생성", keywords.size());

            for (String keyword : keywords) {
                try {
                    String url = String.format(SEARCH_URL_TEMPLATE,
                            URLEncoder.encode(keyword, StandardCharsets.UTF_8).replace("+", "%20"));
                    log.info("Traders 검색: '{}' | {}", keyword, url);
                    driver.get(url);
                    Thread.sleep(800);

                    String pageSource = driver.getPageSource();
                    BestPick pick = parseBestFromNextData(pageSource, keyword);
                    if (pick == null) {
                        log.warn("'{}' Traders 결과 없음 (NEXT_DATA 없음)", keyword);
                        continue;
                    }

                    if (pick.score >= MIN_MATCH_SCORE) {
                        liquors.add(pick.liquor);
                        log.info("'{}' → 수집 성공: '{}' ({}점, {}원)",
                                keyword, pick.liquor.getName(), pick.score, pick.liquor.getCurrentPrice());
                    } else {
                        log.warn("'{}' → 매칭 점수 미달 (best={}, threshold={})",
                                keyword, pick.score, MIN_MATCH_SCORE);
                    }

                } catch (Exception e) {
                    log.error("'{}' Traders 처리 중 오류: {}", keyword, e.getMessage());
                }
            }
            log.info("=== 전체 Traders 크롤링 완료: 총 {}건 수집 ===", liquors.size());

        } catch (Exception e) {
            log.error("Traders 크롤링 치명적 오류: {}", e.getMessage(), e);
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

    private record BestPick(Liquor liquor, int score) {}

    private BestPick parseBestFromNextData(String pageSource, String keyword) {
        try {
            Matcher m = NEXT_DATA_PATTERN.matcher(pageSource);
            if (!m.find()) return null;
            JSONObject root = new JSONObject(m.group(1));
            JSONArray queries = root
                    .getJSONObject("props")
                    .getJSONObject("pageProps")
                    .getJSONObject("dehydratedState")
                    .getJSONArray("queries");

            List<JSONObject> candidates = new ArrayList<>();
            for (int i = 0; i < queries.length(); i++) {
                JSONObject q = queries.optJSONObject(i);
                if (q == null) continue;
                JSONArray queryKey = q.optJSONArray("queryKey");
                if (!queryKeyHas(queryKey, "fetchSearchItemListArea")) continue;
                JSONObject state = q.optJSONObject("state");
                if (state == null) continue;
                JSONObject data = state.optJSONObject("data");
                if (data == null) continue;
                JSONArray areaList = data.optJSONArray("areaList");
                if (areaList == null) continue;
                for (int a = 0; a < areaList.length(); a++) {
                    JSONObject area = areaList.optJSONObject(a);
                    if (area == null) continue;
                    JSONArray dl = area.optJSONArray("dataList");
                    if (dl == null) continue;
                    for (int k = 0; k < dl.length(); k++) {
                        JSONObject it = dl.optJSONObject(k);
                        if (it != null && it.has("itemId")) candidates.add(it);
                    }
                }
            }
            if (candidates.isEmpty()) return null;

            Liquor best = null;
            int bestScore = Integer.MIN_VALUE;
            int limit = Math.min(candidates.size(), MAX_ITEMS_PER_KEYWORD);
            for (int i = 0; i < limit; i++) {
                Liquor c = mapJsonItem(candidates.get(i));
                if (c == null) continue;
                int s = calculateMatchScore(keyword, c);
                if (s > bestScore) { bestScore = s; best = c; }
            }
            return best == null ? null : new BestPick(best, bestScore);

        } catch (Exception e) {
            log.debug("Traders NEXT_DATA 파싱 실패: {}", e.getMessage());
            return null;
        }
    }

    private boolean queryKeyHas(JSONArray queryKey, String token) {
        if (queryKey == null) return false;
        for (int i = 0; i < queryKey.length(); i++) {
            Object v = queryKey.opt(i);
            if (v instanceof String s && s.equals(token)) return true;
        }
        return false;
    }

    private Liquor mapJsonItem(JSONObject it) {
        String name = it.optString("itemName", "").trim();
        if (name.isBlank()) return null;
        String itemId = it.optString("itemId", "").trim();
        int price = parseDigits(it.optString("finalPrice", ""));
        int original = parseDigits(it.optString("strikeOutPrice", ""));
        if (original <= 0) original = price;
        if (original < price) original = price;
        String imgUrl = it.optString("itemImgUrl", "").trim();
        String itemUrl = it.optString("itemUrl", "").trim();
        if (itemUrl.isBlank() && !itemId.isBlank()) {
            itemUrl = "https://emart.ssg.com/item/itemView.ssg?itemId=" + itemId;
        }
        Liquor liquor = Liquor.builder()
                .source(SOURCE)
                .name(name)
                .category(detectCategory(name))
                .currentPrice(price)
                .originalPrice(original)
                .imageUrl(imgUrl)
                .productUrl(itemUrl)
                .productCode(itemId.isBlank() ? "TRADERS_" + Math.abs(name.hashCode()) : "TRADERS_" + itemId)
                .build();
        enrichLiquorInfo(liquor);
        return liquor;
    }

    private int parseDigits(String s) {
        if (s == null) return 0;
        String d = s.replaceAll("[^0-9]", "");
        if (d.isEmpty()) return 0;
        try { return Integer.parseInt(d); } catch (NumberFormatException e) { return 0; }
    }

    private String detectCategory(String name) {
        if (name == null) return "Other";
        if (name.contains("[위스키]")) return "Whisky";
        if (name.contains("[와인]") || name.contains("[레드와인]") || name.contains("[화이트와인]")) return "Wine";
        if (name.contains("[샴페인]")) return "Champagne";
        if (name.contains("[보드카]")) return "Vodka";
        if (name.contains("[브랜디]") || name.contains("[꼬냑]")) return "Brandy";
        if (name.contains("[사케]") || name.contains("[청주]")) return "Sake";
        if (name.contains("[리큐르]") || name.contains("[리큐어]")) return "Liqueur";
        if (name.contains("위스키")) return "Whisky";
        if (name.contains("와인")) return "Wine";
        return "Other";
    }

    private void enrichLiquorInfo(Liquor liquor) {
        String name = liquor.getName();
        String brand = "기타";
        for (String b : KNOWN_BRANDS) if (name.contains(b)) { brand = b; break; }
        liquor.setBrand(brand);

        Pattern abv = Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*(%|도)");
        Matcher mAbv = abv.matcher(name);
        liquor.setAlcoholPercent(mAbv.find()
                ? Double.parseDouble(mAbv.group(1))
                : "Whisky".equals(liquor.getCategory()) ? 40.0 : 0.0);

        Pattern vol = Pattern.compile("(\\d+)\\s*(ml|ML|mL|L|l)");
        Matcher mVol = vol.matcher(name);
        if (mVol.find()) {
            int v = Integer.parseInt(mVol.group(1));
            if (mVol.group(2).equalsIgnoreCase("l")) v *= 1000;
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
                || l.contains("와인") || l.contains("샴페인") || l.contains("사케");
    }
    private boolean containsAccessoryHint(String n) {
        String l = n.toLowerCase();
        return l.contains("잔") || l.contains("글라스") || l.contains("디캔터")
                || l.contains("코스터") || l.contains("미니어처");
    }
    private String normalizeForMatch(String t) {
        if (t == null) return "";
        return t.toLowerCase().replace(" ", "").replaceAll("[^0-9a-z가-힣]", "");
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
