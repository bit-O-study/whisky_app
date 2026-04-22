package org.bito.liquor.scraper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bito.liquor.common.model.Liquor;
import org.bito.liquor.common.repository.LiquorInfoRepository;
import org.json.JSONArray;
import org.json.JSONObject;
import org.openqa.selenium.*;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.springframework.stereotype.Component;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class EmartScraper {

    private final LiquorInfoRepository liquorInfoRepository;

    private static final String SEARCH_URL_TEMPLATE = "https://emart.ssg.com/search.ssg?query=%s";
    private static final String SOURCE = "EMART";
    private static final int MIN_MATCH_SCORE = 30;
    private static final int MAX_ITEMS_PER_KEYWORD = 20;

    // Emart(SSG)는 CSS-in-JS로 클래스 해시가 자주 바뀌므로 다중 셀렉터로 폴백.
    private static final String[] ITEM_SELECTORS = {
            "div.css-sz3opf",
            "li[id*='itemUnit']",
            "li[data-react-bind*='ItemUnit']",
            "div[class*='cunit']",
            "div[class*='item_unit']",
            "[data-position]"
    };
    private static final String[] NAME_SELECTORS = {
            ".css-1mrk1dy",
            "[class*='title']",
            "[class*='name']",
            ".infoTit",
            ".tlt"
    };
    private static final String[] PRICE_SELECTORS = {
            ".css-1oiygnj",
            "em[class*='price']",
            "span[class*='ssg_price']",
            "[class*='final_price']",
            ".opt_price",
            ".ssg_price"
    };

    private static final List<String> KNOWN_BRANDS = Arrays.asList(
            "조니워커", "발렌타인", "글렌피딕", "맥캘란", "짐빔", "산토리", "잭다니엘",
            "와일드터키", "버팔로트레이스", "메이커스마크", "로얄살루트", "시바스리갈",
            "글렌리벳", "발베니", "아드벡", "라프로익", "탈리스커", "싱글톤", "에반윌리엄스",
            "제임슨", "카나디안클럽", "벨즈", "블랙앤화이트", "커티삭", "몽키숄더", "니카",
            "하이랜드파크", "보모어", "라가불린", "오반", "글렌모렌지", "달모어", "히비키", "야마자키",
            "카발란", "글렌그란트", "더글렌그란트",
            "1865", "몬테스", "G7", "디아블로", "칸티", "빌라엠", "모엣샹동", "돔페리뇽",
            "뵈브클리코", "투핸즈", "이스까이", "텍스트북", "덕혼", "클라우디베이", "펜폴즈",
            "샤토", "샤또", "울프블라스", "옐로우테일", "코노수르", "앙시앙땅", "트라피체",
            "에라스리즈", "산타리타", "로버트몬다비", "프레스코발디", "피치니", "우마니론끼",
            "몰리두커", "머드하우스", "배비치", "롱반", "서브미션", "브레드앤버터",
            "간바레오또상", "마루", "준마이", "센카", "라쿠엔", "쿠보타", "닷사이", "월계관",
            "앱솔루트", "스미노프", "그레이구스", "봄베이", "핸드릭스", "바카디", "말리부",
            "깔루아", "베일리스", "엑스레이티드", "예거마이스터", "아그와", "호세쿠엘보", "팔리니",
            "코인트로", "볼스"
    );

    public List<Liquor> scrapeLiquors() {
        List<Liquor> liquors = new ArrayList<>();
        WebDriver driver = null;

        try {
            driver = createWebDriver();

            List<String> targetKeywords = generateDynamicKeywords();
            log.info("총 {}개의 동적 검색 키워드를 생성했습니다.", targetKeywords.size());

            for (String keyword : targetKeywords) {
                try {
                    String encodedKeyword = URLEncoder.encode(keyword, StandardCharsets.UTF_8).replace("+", "%20");
                    String searchUrl = String.format(SEARCH_URL_TEMPLATE, encodedKeyword);
                    log.info("이마트 키워드 검색 중: '{}' | URL: {}", keyword, searchUrl);

                    driver.get(searchUrl);
                    Thread.sleep(800);

                    // Emart는 Next.js SSR이라 상품 데이터가 __NEXT_DATA__ JSON에 박혀 옴.
                    // DOM hydration 전에도 pageSource에 전부 있으니 JSON을 1순위로 파싱.
                    String pageSource = driver.getPageSource();
                    Liquor best = null;
                    int bestScore = Integer.MIN_VALUE;
                    BestPick jsonPick = parseBestFromNextData(pageSource, keyword);
                    if (jsonPick != null) {
                        best = jsonPick.liquor;
                        bestScore = jsonPick.score;
                        log.info("'{}' NEXT_DATA에서 후보 찾음 (점수 {})", keyword, bestScore);
                    }

                    // JSON이 없거나 기준 미달이면 DOM 폴백(구버전 SSG 레이아웃 대응).
                    if (best == null || bestScore < MIN_MATCH_SCORE) {
                        ((JavascriptExecutor) driver).executeScript("window.scrollBy(0, 1200)");
                        List<WebElement> items = findItemsWithFallback(driver, keyword);
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
                        if (items.isEmpty() && jsonPick == null) {
                            log.warn("'{}' 이마트 검색 결과 없음 (NEXT_DATA + DOM 모두 실패)", keyword);
                            saveDebugHtml(pageSource, keyword);
                            continue;
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
                    log.error("'{}' 이마트 검색 중 오류: {}", keyword, e.getMessage());
                }
            }

            log.info("=== 전체 이마트 크롤링 완료: 총 {}개 상품 수집 ===", liquors.size());

        } catch (Exception e) {
            log.error("크롤링 중 치명적 오류 발생: {}", e.getMessage(), e);
        } finally {
            if (driver != null) {
                driver.quit();
            }
        }
        return liquors;
    }

    private static final Pattern NEXT_DATA_PATTERN = Pattern.compile(
            "<script id=\"__NEXT_DATA__\" type=\"application/json\">([\\s\\S]*?)</script>");

    private record BestPick(Liquor liquor, int score) {}

    /**
     * Emart 검색 페이지의 __NEXT_DATA__ JSON을 파싱해 최고 점수 상품 1건 반환.
     * 경로: props.pageProps.dehydratedState.queries[?].state.data.areaList[0].dataList
     *      (queryKey에 "fetchSearchItemListArea"가 포함된 쿼리)
     */
    private BestPick parseBestFromNextData(String pageSource, String keyword) {
        try {
            Matcher m = NEXT_DATA_PATTERN.matcher(pageSource);
            if (!m.find()) {
                return null;
            }
            JSONObject root = new JSONObject(m.group(1));
            JSONArray queries = root
                    .getJSONObject("props")
                    .getJSONObject("pageProps")
                    .getJSONObject("dehydratedState")
                    .getJSONArray("queries");

            // areaList는 광고/추천/실제 검색결과/관련상품 등 여러 영역으로 쪼개져 있고,
            // 실제 결과 위치가 areaList[0]이 아닐 수 있다(세션/광고 여부에 따라 3~4번에 밀리기도 함).
            // 모든 area의 dataList를 합쳐서 후보로 넣는다.
            List<JSONObject> candidates = new ArrayList<>();
            for (int i = 0; i < queries.length(); i++) {
                JSONObject q = queries.optJSONObject(i);
                if (q == null) continue;
                JSONArray queryKey = q.optJSONArray("queryKey");
                if (!queryKeyMatches(queryKey, "fetchSearchItemListArea")) continue;
                JSONObject state = q.optJSONObject("state");
                if (state == null) continue;
                JSONObject data = state.optJSONObject("data");
                if (data == null) continue;
                JSONArray areaList = data.optJSONArray("areaList");
                if (areaList == null || areaList.length() == 0) continue;
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

            if (candidates.isEmpty()) {
                return null;
            }

            Liquor best = null;
            int bestScore = Integer.MIN_VALUE;
            int limit = Math.min(candidates.size(), MAX_ITEMS_PER_KEYWORD);
            for (int i = 0; i < limit; i++) {
                Liquor candidate = mapJsonItem(candidates.get(i));
                if (candidate == null) continue;
                int score = calculateMatchScore(keyword, candidate);
                if (score > bestScore) {
                    bestScore = score;
                    best = candidate;
                }
            }
            return best == null ? null : new BestPick(best, bestScore);

        } catch (Exception e) {
            log.debug("NEXT_DATA 파싱 실패: {}", e.getMessage());
            return null;
        }
    }

    private boolean queryKeyMatches(JSONArray queryKey, String token) {
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
        int price = parsePriceDigits(it.optString("finalPrice", ""));
        int originalPrice = parsePriceDigits(it.optString("strikeOutPrice", ""));
        if (originalPrice <= 0) originalPrice = price;
        if (originalPrice < price) originalPrice = price;

        String imgUrl = it.optString("itemImgUrl", "").trim();
        String itemUrl = it.optString("itemUrl", "").trim();
        if (itemUrl.isBlank() && !itemId.isBlank()) {
            itemUrl = "https://emart.ssg.com/item/itemView.ssg?itemId=" + itemId;
        }

        Liquor.LiquorBuilder b = Liquor.builder()
                .source(SOURCE)
                .name(name)
                .category(detectCategory(name))
                .currentPrice(price)
                .originalPrice(originalPrice)
                .imageUrl(imgUrl)
                .productUrl(itemUrl)
                .productCode(itemId.isBlank() ? "EMART_" + Math.abs(name.hashCode()) : itemId);

        Liquor liquor = b.build();
        enrichLiquorInfo(liquor);
        return liquor;
    }

    private int parsePriceDigits(String raw) {
        if (raw == null) return 0;
        String digits = raw.replaceAll("[^0-9]", "");
        if (digits.isEmpty()) return 0;
        try {
            return Integer.parseInt(digits);
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private List<WebElement> findItemsWithFallback(WebDriver driver, String keyword) {
        for (String selector : ITEM_SELECTORS) {
            try {
                WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(3));
                wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector(selector)));
                List<WebElement> els = driver.findElements(By.cssSelector(selector));
                if (!els.isEmpty()) {
                    log.debug("'{}' 매칭 셀렉터: {} ({}개)", keyword, selector, els.size());
                    return els;
                }
            } catch (TimeoutException ignored) {
                // 다음 셀렉터로
            } catch (Exception e) {
                log.debug("셀렉터 '{}' 시도 중 오류: {}", selector, e.getMessage());
            }
        }
        return Collections.emptyList();
    }

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
                        String noSpaceClazz = info.getClazz().replace(" ", "");
                        keywordBuilder.append(noSpaceClazz).append(" ");
                    }

                    if (info.getVolumeMl() != null) {
                        keywordBuilder.append(info.getVolumeMl()).append("ml");
                    }

                    return keywordBuilder.toString().trim();
                })
                .filter(keyword -> !keyword.isEmpty())
                .distinct()
                .collect(Collectors.toList());
    }

    private Liquor extractItem(WebElement el) {
        try {
            String name = findFirstText(el, NAME_SELECTORS);
            if (name == null || name.isBlank()) {
                return null;
            }

            String category = detectCategory(name);

            Liquor.LiquorBuilder builder = Liquor.builder()
                    .name(name)
                    .source(SOURCE)
                    .category(category);

            String priceTxt = findFirstText(el, PRICE_SELECTORS);
            if (priceTxt != null && !priceTxt.isBlank()) {
                try {
                    int price = Integer.parseInt(priceTxt.replaceAll("[^0-9]", ""));
                    builder.currentPrice(price);
                    builder.originalPrice(price);
                } catch (NumberFormatException e) {
                    builder.currentPrice(0);
                }
            } else {
                builder.currentPrice(0);
            }

            try {
                WebElement linkElement = el.findElement(By.tagName("a"));
                String href = linkElement.getAttribute("href");

                if (href == null || href.isEmpty()) {
                    return null;
                }

                builder.productUrl(href);

                String itemId;
                if (href.contains("itemId=")) {
                    itemId = href.split("itemId=")[1].split("&")[0];
                } else {
                    itemId = "EMART_" + Math.abs(name.hashCode());
                }
                builder.productCode(itemId);

            } catch (org.openqa.selenium.NoSuchElementException e) {
                return null;
            }

            try {
                String img = el.findElement(By.tagName("img")).getAttribute("src");
                builder.imageUrl(img);
            } catch (org.openqa.selenium.NoSuchElementException ignored) {
            }

            Liquor liquor = builder.build();
            enrichLiquorInfo(liquor);

            return liquor;

        } catch (Exception e) {
            log.debug("아이템 파싱 실패: {}", e.getMessage());
            return null;
        }
    }

    private String findFirstText(WebElement el, String[] selectors) {
        for (String sel : selectors) {
            try {
                String text = el.findElement(By.cssSelector(sel)).getText();
                if (text != null && !text.isBlank()) {
                    return text.trim();
                }
            } catch (org.openqa.selenium.NoSuchElementException ignored) {
            }
        }
        return null;
    }

    private String detectCategory(String name) {
        if (name == null) return "Other";
        String n = name.replace(" ", "");

        if (n.contains("[레드와인]") || n.contains("[레드]")) return "Red Wine";
        if (n.contains("[화이트와인]") || n.contains("[화이트]")) return "White Wine";
        if (n.contains("[스파클링]") || n.contains("스파클링와인")) return "Sparkling Wine";
        if (n.contains("[로제와인]") || n.contains("로제")) return "Rose Wine";
        if (n.contains("[샴페인]")) return "Champagne";
        if (n.contains("[위스키]")) return "Whisky";
        if (n.contains("[브랜디]") || n.contains("[꼬냑]")) return "Brandy";
        if (n.contains("[보드카]")) return "Vodka";
        if (n.contains("[럼]")) return "Rum";
        if (n.contains("[진]")) return "Gin";
        if (n.contains("[데킬라]")) return "Tequila";
        if (n.contains("[리큐르]") || n.contains("[리큐어]")) return "Liqueur";
        if (n.contains("[사케]") || n.contains("[청주]")) return "Sake";
        if (n.contains("[와인세트]")) return "Wine Set";
        if (n.contains("와인")) return "Wine";

        return "Other";
    }

    private void enrichLiquorInfo(Liquor liquor) {
        String name = liquor.getName();

        String foundBrand = "기타";
        for (String brand : KNOWN_BRANDS) {
            if (name.contains(brand)) {
                foundBrand = brand;
                break;
            }
        }
        if (foundBrand.equals("기타")) {
            String cleanName = name.replaceAll("\\[.*?\\]", "").trim();
            if (!cleanName.isEmpty()) {
                String[] parts = cleanName.split(" ");
                if (parts.length > 0) {
                    foundBrand = parts[0];
                }
            }
        }
        liquor.setBrand(foundBrand);

        double alcohol = 0.0;
        Pattern abvPattern = Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*(%|도)");
        Matcher abvMatcher = abvPattern.matcher(name);

        if (abvMatcher.find()) {
            alcohol = Double.parseDouble(abvMatcher.group(1));
        } else {
            switch (liquor.getCategory()) {
                case "Whisky": case "Rum": case "Vodka": case "Gin": case "Tequila": case "Brandy":
                    alcohol = 40.0; break;
                case "Red Wine": case "White Wine": case "Rose Wine": case "Wine": case "Wine Set":
                    alcohol = 13.5; break;
                case "Sparkling Wine": case "Champagne":
                    alcohol = 12.0; break;
                case "Sake":
                    alcohol = 15.0; break;
                case "Liqueur":
                    alcohol = 20.0; break;
                default:
                    alcohol = 0.0;
            }
        }
        liquor.setAlcoholPercent(alcohol);

        int volume = 0;
        if (name.toUpperCase().contains("1L") || name.contains("1리터")) {
            volume = 1000;
        } else {
            Pattern volPattern = Pattern.compile("(\\d+)\\s*(ml|ML|mL)");
            Matcher volMatcher = volPattern.matcher(name);
            if (volMatcher.find()) {
                volume = Integer.parseInt(volMatcher.group(1));
            } else {
                if (liquor.getCategory().contains("Wine") || liquor.getCategory().equals("Champagne")) {
                    volume = 750;
                } else if (liquor.getCategory().equals("Sake")) {
                    volume = 720;
                } else if (liquor.getCategory().equals("Whisky") || liquor.getCategory().equals("Vodka")) {
                    volume = 700;
                } else {
                    volume = 750;
                }
            }
        }
        liquor.setVolume(volume);

        String clazz = extractClazz(name, liquor.getCategory());
        liquor.setClazz(clazz);
    }

    private String extractClazz(String name, String category) {
        String upperName = name.toUpperCase();
        String noSpaceName = name.replace(" ", "");

        Pattern yearPattern = Pattern.compile("(\\d+)\\s*(년|Y\\.O|YO|years)");
        Matcher m = yearPattern.matcher(upperName);
        if (m.find()) {
            return m.group(1);
        }

        if ("Whisky".equals(category)) {
            if (noSpaceName.contains("블루라벨")) return "블루라벨";
            if (noSpaceName.contains("블랙라벨")) return "블랙라벨";
            if (noSpaceName.contains("더블블랙")) return "더블블랙";
            if (noSpaceName.contains("그린라벨")) return "그린라벨";
            if (noSpaceName.contains("레드라벨")) return "레드라벨";
            if (noSpaceName.contains("골드라벨") || noSpaceName.contains("골드리저브")) return "골드라벨";
            if (noSpaceName.contains("블론드")) return "블론드";
            if (noSpaceName.contains("블랙루비")) return "블랙루비";
            if (noSpaceName.contains("레어브리드")) return "레어브리드";

            if (noSpaceName.contains("더블캐스크")) return "더블캐스크";
            if (noSpaceName.contains("쉐리") || noSpaceName.contains("셰리")) return "쉐리캐스크";

            if (noSpaceName.contains("싱글몰트")) return "싱글몰트";
            if (noSpaceName.contains("블렌디드몰트")) return "블렌디드 몰트";
            if (noSpaceName.contains("블렌디드")) return "블렌디드";
            if (noSpaceName.contains("버번")) return "버번";
            if (noSpaceName.contains("라이")) return "라이";
        }

        if ("Brandy".equals(category)) {
            if (upperName.contains("XO") || upperName.contains("X.O")) return "XO";
            if (upperName.contains("VSOP") || upperName.contains("V.S.O.P")) return "VSOP";
            if (upperName.contains("VS") || upperName.contains("V.S")) return "VS";
        }

        if (category.contains("Wine") || category.equals("Champagne")) {
            if (noSpaceName.matches(".*(까베르네소비뇽|까버네쇼비뇽|카버네소비뇽|카베르네소비뇽|카버넷쇼비뇽|까베네소비뇽).*")) return "까베르네 소비뇽";
            if (noSpaceName.matches(".*(소비뇽블랑|쇼비뇽블랑).*")) return "소비뇽 블랑";
            if (noSpaceName.matches(".*(샤도네이|샤르도네|샤도네).*")) return "샤도네이";
            if (noSpaceName.matches(".*(메를로|멜롯|멜로).*")) return "메를로";
            if (noSpaceName.matches(".*(피노누아|피노누와).*")) return "피노누아";
            if (noSpaceName.matches(".*(쉬라즈|시라|쉬라).*")) return "쉬라즈";
            if (noSpaceName.matches(".*(말벡).*")) return "말벡";
            if (noSpaceName.matches(".*(모스카토|모스까또).*")) return "모스카토";
            if (noSpaceName.matches(".*(까르미네르|카르미네르).*")) return "까르미네르";
            if (noSpaceName.matches(".*(진판델).*")) return "진판델";

            if (noSpaceName.contains("그란레세르바") || noSpaceName.contains("그랑리저브")) return "그란 레세르바";
            if (noSpaceName.contains("리제르바") || noSpaceName.contains("레세르바") || noSpaceName.contains("리저브") || upperName.contains("RESERVA")) return "리제르바";
            if (noSpaceName.contains("그랑크뤼") || upperName.contains("GRANDCRU")) return "그랑크뤼";
            if (noSpaceName.contains("싱글빈야드")) return "싱글빈야드";
            if (upperName.contains("DOCG")) return "DOCG";
        }

        return "None";
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
                || lower.contains("싱글몰트")
                || lower.contains("와인")
                || lower.contains("샴페인")
                || lower.contains("사케")
                || lower.contains("청주");
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
                || lower.contains("스푼")
                || lower.contains("미니어처")
                || lower.contains("디캔터")
                || lower.contains("코스터");
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

    private void saveDebugHtml(String pageSource, String keyword) {
        try {
            String fileName = "emart_debug_" + keyword.replaceAll("\\s+", "_") + ".html";
            java.nio.file.Files.writeString(
                    java.nio.file.Paths.get(fileName),
                    pageSource,
                    StandardCharsets.UTF_8
            );
            log.info("디버깅용 HTML 저장 완료: {}", fileName);
        } catch (Exception ex) {
            log.error("HTML 파일 저장 실패: {}", ex.getMessage());
        }
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
