package org.bito.liquor.scraper;

import lombok.extern.slf4j.Slf4j;
import org.bito.liquor.common.model.Liquor;
import org.openqa.selenium.*;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Component
public class EmartScraper {

    private static final String BASE_SEARCH_URL = "https://emart.ssg.com/search.ssg?query=%EC%A3%BC%EB%A5%98&ctgLv=2&ctgId=6000213466";
    private static final String SOURCE = "EMART";
    private static final int MAX_PAGE = 50;

    private static final List<String> KNOWN_BRANDS = Arrays.asList(
            // 위스키
            "조니워커", "발렌타인", "글렌피딕", "맥캘란", "짐빔", "산토리", "잭다니엘",
            "와일드터키", "버팔로트레이스", "메이커스마크", "로얄살루트", "시바스리갈",
            "글렌리벳", "발베니", "아드벡", "라프로익", "탈리스커", "싱글톤", "에반윌리엄스",
            "제임슨", "카나디안클럽", "벨즈", "블랙앤화이트", "커티삭", "몽키숄더", "니카",
            "하이랜드파크", "보모어", "라가불린", "오반", "글렌모렌지", "달모어", "히비키", "야마자키",
            "카발란", "글렌그란트", "더글렌그란트", "커티삭",
            // 와인
            "1865", "몬테스", "G7", "디아블로", "칸티", "빌라엠", "모엣샹동", "돔페리뇽",
            "뵈브클리코", "투핸즈", "이스까이", "텍스트북", "덕혼", "클라우디베이", "펜폴즈",
            "샤토", "샤또", "울프블라스", "옐로우테일", "코노수르", "앙시앙땅", "트라피체",
            "에라스리즈", "산타리타", "로버트몬다비", "프레스코발디", "피치니", "우마니론끼",
            "몰리두커", "머드하우스", "배비치", "롱반", "서브미션", "브레드앤버터",
            // 사케/기타
            "간바레오또상", "마루", "준마이", "센카", "라쿠엔", "쿠보타", "닷사이", "월계관",
            // 리큐르/보드카/진/럼
            "앱솔루트", "스미노프", "그레이구스", "봄베이", "핸드릭스", "바카디", "말리부",
            "깔루아", "베일리스", "엑스레이티드", "예거마이스터", "아그와", "호세쿠엘보", "팔리니",
            "코인트로", "볼스"
    );

    public List<Liquor> scrapeLiquors() {
        List<Liquor> liquors = new ArrayList<>();
        WebDriver driver = null;

        try {
            driver = createWebDriver();
            int page = 1;

            while (page <= MAX_PAGE) {
                String currentPageUrl = BASE_SEARCH_URL + "&page=" + page;
                log.info("크롤링 중... Page: {} | URL: {}", page, currentPageUrl);

                driver.get(currentPageUrl);

                // 봇 탐지 회피를 위한 랜덤 대기
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
                    log.info("페이지 {}에서 상품을 찾을 수 없습니다. (크롤링 종료)", page);
                    break;
                }

                if (items.isEmpty()) break;

                log.info("Page {}: 발견된 아이템 {}개", page, items.size());

                for (WebElement item : items) {
                    try {
                        Liquor liquor = extractItem(item);
                        System.out.println("liquor==>"+liquor);
                        if (liquor != null) {
                            liquors.add(liquor);
                        }
                    } catch (Exception e) {
                        // 개별 아이템 에러 무시
                    }
                }
                page++;
            }
            log.info("=== 전체 크롤링 완료: 총 {}개 상품 수집 ===", liquors.size());

        } catch (Exception e) {
            log.error("크롤링 중 치명적 오류 발생: {}", e.getMessage(), e);
        } finally {
            if (driver != null) {
                driver.quit();
            }
        }
        return liquors;
    }

    private Liquor extractItem(WebElement el) {
        try {
            System.out.println(el);
            // 1. 이름 추출
            String name = "";
            try {
                name = el.findElement(By.cssSelector(".css-1mrk1dy")).getText().trim();
            } catch (Exception e) {
                log.warn("상품 이름 추출 실패, 스킵합니다.");
                return null;
            }
            System.out.println(name);
            // 카테고리 감지
            String category = detectCategory(name);

            Liquor.LiquorBuilder builder = Liquor.builder()
                    .name(name)
                    .source(SOURCE)
                    .category(category);

            // 2. 가격 추출
            try {
                String priceTxt = el.findElement(By.cssSelector(".css-1oiygnj")).getText();
                int price = Integer.parseInt(priceTxt.replaceAll("[^0-9]", ""));
                System.out.println(price);
                builder.currentPrice(price);
                builder.originalPrice(price);
            } catch (Exception e) {
                builder.currentPrice(0);
            }

            // 3. 링크 및 코드 추출
            try {
                // 특정 클래스명 대신, 상품 요소(el) 내의 첫 번째 <a> 태그를 찾도록 변경
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
                // 단순 "에러"가 아니라 정확히 왜 실패했는지 로그를 남깁니다.
                System.out.println("링크 추출 에러 - 상품명: " + name + " | 사유: " + e.getMessage());
                return null;
            }

            // 4. 이미지 추출
            try {
                String img = el.findElement(By.tagName("img")).getAttribute("src");
                builder.imageUrl(img);
            } catch (Exception ignored) {}

            Liquor liquor = builder.build();
            System.out.println(liquor);
            // 5. 상세 정보 추출 (브랜드, 도수, 용량, 클래스)
            enrichLiquorInfo(liquor);

            return liquor;

        } catch (Exception e) {
            log.warn("상품 파싱 중 에러 발생: {}", e.getMessage());
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

        // 1. 브랜드 추출
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

        // 2. 도수 추출 (우선순위: 이름 내 명시된 도수 -> 카테고리별 표준 도수)
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

        // 3. 용량 추출 (우선순위: 이름 내 명시된 용량 -> 카테고리별 표준 용량)
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

        // 4. Clazz (등급/종류/숙성연도) 추출 및 세팅 - 추가된 부분
        String clazz = extractClazz(name, liquor.getCategory());
        liquor.setClazz(clazz);
    }

    private String extractClazz(String name, String category) {
        String upperName = name.toUpperCase();
        // 띄어쓰기를 모두 제거한 문자열 (변형된 띄어쓰기 및 외래어 검색용)
        String noSpaceName = name.replace(" ", "");

        // 1. 연산(숙성 년도) 최우선 추출 (예: 12년, 15년산, 18 Y.O 등 -> 숫자만 추출)
        // 위스키, 브랜디 등에서 가장 중요한 지표이므로 제일 먼저 검사합니다.
        Pattern yearPattern = Pattern.compile("(\\d+)\\s*(년|Y\\.O|YO|years)");
        Matcher m = yearPattern.matcher(upperName);
        if (m.find()) {
            return m.group(1); // "12년" -> "12" 반환
        }

        // 2. 위스키 라벨 및 캐스크/종류
        if ("Whisky".equals(category)) {
            // 유명 라벨/시리즈 (조니워커, 와일드터키 등)
            if (noSpaceName.contains("블루라벨")) return "블루라벨";
            if (noSpaceName.contains("블랙라벨")) return "블랙라벨";
            if (noSpaceName.contains("더블블랙")) return "더블블랙";
            if (noSpaceName.contains("그린라벨")) return "그린라벨";
            if (noSpaceName.contains("레드라벨")) return "레드라벨";
            if (noSpaceName.contains("골드라벨") || noSpaceName.contains("골드리저브")) return "골드라벨";
            if (noSpaceName.contains("블론드")) return "블론드";
            if (noSpaceName.contains("블랙루비")) return "블랙루비";
            if (noSpaceName.contains("레어브리드")) return "레어브리드";

            // 캐스크(통) 특징
            if (noSpaceName.contains("더블캐스크")) return "더블캐스크";
            if (noSpaceName.contains("쉐리") || noSpaceName.contains("셰리")) return "쉐리캐스크";

            // 위스키 기본 종류
            if (noSpaceName.contains("싱글몰트")) return "싱글몰트";
            if (noSpaceName.contains("블렌디드몰트")) return "블렌디드 몰트";
            if (noSpaceName.contains("블렌디드")) return "블렌디드";
            if (noSpaceName.contains("버번")) return "버번";
            if (noSpaceName.contains("라이")) return "라이";
        }

        // 3. 꼬냑/브랜디 등급
        if ("Brandy".equals(category)) {
            if (upperName.contains("XO") || upperName.contains("X.O")) return "XO";
            if (upperName.contains("VSOP") || upperName.contains("V.S.O.P")) return "VSOP";
            if (upperName.contains("VS") || upperName.contains("V.S")) return "VS";
        }

        // 4. 와인 품종 통일 및 등급 추출
        if (category.contains("Wine") || category.equals("Champagne")) {

            // 4-1. 대표 포도 품종 맵핑 (다양한 표기법을 하나로 통일)
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

            // 4-2. 와인 등급 및 특수 키워드
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
        options.addArguments("--headless=true"); // 필요시 true/false 변경
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