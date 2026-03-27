package org.bito.liquor.scraper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bito.liquor.common.model.Liquor;
import org.bito.liquor.common.repository.LiquorInfoRepository;
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

    private static final List<String> KNOWN_BRANDS = Arrays.asList(
            "조니워커", "발렌타인", "글렌피딕", "맥캘란", "짐빔", "산토리", "잭다니엘",
            "와일드터키", "버팔로트레이스", "메이커스마크", "로얄살루트", "시바스리갈",
            "글렌리벳", "발베니", "아드벡", "라프로익", "탈리스커", "싱글톤", "에반윌리엄스",
            "제임슨", "카나디안클럽", "벨즈", "블랙앤화이트", "커티삭", "몽키숄더", "니카",
            "하이랜드파크", "보모어", "라가불린", "오반", "글렌모렌지", "달모어", "히비키", "야마자키",
            "카발란", "글렌그란트", "더글렌그란트", "커티삭",
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

                    Thread.sleep((long) (Math.random() * 1500) + 1000);

                    JavascriptExecutor js = (JavascriptExecutor) driver;
                    for (int i = 0; i < 2; i++) {
                        js.executeScript("window.scrollBy(0, 1000)");
                        Thread.sleep(500);
                    }

                    List<WebElement> items = Collections.emptyList();
                    try {
                        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(5));
                        wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector("div.css-sz3opf")));
                        items = driver.findElements(By.cssSelector("div.css-sz3opf"));
                    } catch (TimeoutException e) {
                        log.warn("'{}' 이마트 검색 결과가 없습니다.", keyword);
                        continue;
                    }

                    if (items.isEmpty()) continue;

                    log.info("'{}' 검색 결과 발견된 아이템 {}개", keyword, items.size());

                    for (WebElement item : items) {
                        try {
                            Liquor liquor = extractItem(item);
                            if (liquor != null) {
                                liquors.add(liquor);
                            }
                        } catch (Exception e) {
                        }
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
            String name = "";
            try {
                name = el.findElement(By.cssSelector(".css-1mrk1dy")).getText().trim();
            } catch (Exception e) {
                return null;
            }

            String category = detectCategory(name);

            Liquor.LiquorBuilder builder = Liquor.builder()
                    .name(name)
                    .source(SOURCE)
                    .category(category);

            try {
                String priceTxt = el.findElement(By.cssSelector(".css-1oiygnj")).getText();
                int price = Integer.parseInt(priceTxt.replaceAll("[^0-9]", ""));
                builder.currentPrice(price);
                builder.originalPrice(price);
            } catch (Exception e) {
                builder.currentPrice(0);
            }

            try {
                WebElement linkElement = el.findElement(By.tagName("a"));
                String href = linkElement.getAttribute("href");

                if (href == null || href.isEmpty()) {
                    throw new RuntimeException("href 속성을 찾을 수 없습니다.");
                }

                builder.productUrl(href);

                String itemId = "";
                if (href.contains("itemId=")) {
                    itemId = href.split("itemId=")[1].split("&")[0];
                } else {
                    itemId = "EMART_" + Math.abs(name.hashCode());
                }
                builder.productCode(itemId);

            } catch (Exception e) {
                return null;
            }

            try {
                String img = el.findElement(By.tagName("img")).getAttribute("src");
                builder.imageUrl(img);
            } catch (Exception ignored) {}

            Liquor liquor = builder.build();
            enrichLiquorInfo(liquor);

            return liquor;

        } catch (Exception e) {
            return null;
        }
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

    private WebDriver createWebDriver() {
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--headless=true");
        options.addArguments("--disable-blink-features=AutomationControlled");
        options.setExperimentalOption("excludeSwitches", Collections.singletonList("enable-automation"));
        options.setExperimentalOption("useAutomationExtension", false);
        options.addArguments("--disable-gpu");
        options.addArguments("--no-sandbox");
        options.addArguments("--start-maximized");
        options.addArguments("--lang=ko_KR");
        options.addArguments("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");

        ChromeDriver driver = new ChromeDriver(options);
        Map<String, Object> params = new HashMap<>();
        params.put("source", "Object.defineProperty(navigator, 'webdriver', { get: () => undefined })");
        driver.executeCdpCommand("Page.addScriptToEvaluateOnNewDocument", params);

        return driver;
    }
}