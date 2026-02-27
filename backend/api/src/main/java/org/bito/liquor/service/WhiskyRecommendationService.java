package org.bito.liquor.service;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.bito.liquor.common.dto.FlavorVectorDto;
import org.bito.liquor.common.dto.FlavorVectorRequestDto;
import org.bito.liquor.common.dto.LiquorDto;
import org.bito.liquor.common.dto.WhiskyRecommendationItemDto;
import org.bito.liquor.common.dto.WhiskyRecommendationResponseDto;
import org.bito.liquor.common.model.LiquorPrice;
import org.bito.liquor.common.model.Whisky;
import org.bito.liquor.common.repository.LiquorPriceRepository;
import org.bito.liquor.common.repository.WhiskyRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class WhiskyRecommendationService {

    private static final int TOP_RECOMMENDATION_COUNT = 5;
    private static final List<String> DIMENSIONS = List.of("sweet", "smoky", "fruity", "spicy", "woody", "body");

    private final LiquorPriceRepository liquorPriceRepository;
    private final WhiskyRepository whiskyRepository;

    public WhiskyRecommendationResponseDto recommend(FlavorVectorRequestDto request) {
        double[] userVector = normalizeVector(new double[]{
                sanitize(request.getSweet()),
                sanitize(request.getSmoky()),
                sanitize(request.getFruity()),
                sanitize(request.getSpicy()),
                sanitize(request.getWoody()),
                sanitize(request.getBody())
        });

        PriceLookup priceLookup = buildPriceLookup(liquorPriceRepository.findAllOrderByUpdatedAtDesc());
        List<Whisky> whiskies = whiskyRepository.findAll();
        List<ScoredWhisky> scored = new ArrayList<>();

        for (Whisky whisky : whiskies) {
            LiquorPrice matchedPrice = priceLookup.findMatch(whisky);
            double[] whiskyVector = normalizeVector(buildWhiskyVector(whisky));
            double similarity = cosineSimilarity(userVector, whiskyVector);
            String reason = buildReason(whisky, userVector);
            scored.add(new ScoredWhisky(whisky, matchedPrice, similarity, reason));
        }

        List<WhiskyRecommendationItemDto> topRecommendations = scored.stream()
                .sorted(Comparator.comparingDouble(ScoredWhisky::getSimilarity).reversed())
                .limit(TOP_RECOMMENDATION_COUNT)
                .map(item -> WhiskyRecommendationItemDto.builder()
                        .liquor(LiquorDto.from(item.getWhisky(), item.getMatchedPrice()))
                        .similarity(round(item.getSimilarity()))
                        .reason(item.getReason())
                        .build())
                .toList();

        return WhiskyRecommendationResponseDto.builder()
                .typeName(buildTypeName(userVector))
                .flavorVector(FlavorVectorDto.builder()
                        .sweet(round(userVector[0] * 100))
                        .smoky(round(userVector[1] * 100))
                        .fruity(round(userVector[2] * 100))
                        .spicy(round(userVector[3] * 100))
                        .woody(round(userVector[4] * 100))
                        .body(round(userVector[5] * 100))
                        .build())
                .recommendations(topRecommendations)
                .build();
    }

    private PriceLookup buildPriceLookup(List<LiquorPrice> prices) {
        Map<String, LiquorPrice> byProductCode = new HashMap<>();
        Map<String, LiquorPrice> byNormalizedName = new HashMap<>();

        for (LiquorPrice price : prices) {
            String code = lower(price.getLiquor().getProductCode());
            String normalizedName = lower(price.getLiquor().getNormalizedName());

            if (!code.isBlank()) {
                LiquorPrice existing = byProductCode.get(code);
                if (existing == null || isBetterPrice(price, existing)) {
                    byProductCode.put(code, price);
                }
            }

            if (!normalizedName.isBlank()) {
                LiquorPrice existing = byNormalizedName.get(normalizedName);
                if (existing == null || isBetterPrice(price, existing)) {
                    byNormalizedName.put(normalizedName, price);
                }
            }
        }

        return new PriceLookup(byProductCode, byNormalizedName);
    }

    private boolean isBetterPrice(LiquorPrice candidate, LiquorPrice existing) {
        int candidatePrice = candidate.getCurrentPrice() == null ? Integer.MAX_VALUE : candidate.getCurrentPrice();
        int existingPrice = existing.getCurrentPrice() == null ? Integer.MAX_VALUE : existing.getCurrentPrice();
        return candidatePrice < existingPrice;
    }

    private double[] buildWhiskyVector(Whisky whisky) {
        double[] raw = new double[]{
                sanitize(whisky.getSweet()),
                sanitize(whisky.getSmoky()),
                sanitize(whisky.getFruity()),
                sanitize(whisky.getSpicy()),
                sanitize(whisky.getWoody()),
                sanitize(whisky.getBody())
        };

        boolean hasManualProfile = false;
        for (double value : raw) {
            if (value > 0) {
                hasManualProfile = true;
                break;
            }
        }

        if (hasManualProfile) {
            return raw;
        }

        return inferProfile(whisky);
    }

    private double[] inferProfile(Whisky whisky) {
        double sweet = 0.22;
        double smoky = 0.14;
        double fruity = 0.18;
        double spicy = 0.14;
        double woody = 0.16;
        double body = 0.16;

        String category = lower(whisky.getCategory());
        String clazz = lower(whisky.getClazz());
        String name = lower(whisky.getProductName()) + " " + lower(whisky.getNormalizedName());
        double abv = whisky.getAlcoholPercent() == null ? 40.0 : whisky.getAlcoholPercent();

        if (containsAny(category, clazz, name, "bourbon", "버번")) {
            sweet += 0.14;
            woody += 0.08;
            spicy += 0.06;
        }
        if (containsAny(category, clazz, name, "single malt", "malt", "싱글몰트")) {
            fruity += 0.10;
            body += 0.08;
        }
        if (containsAny(category, clazz, name, "irish", "아이리시")) {
            sweet += 0.08;
            fruity += 0.08;
            smoky -= 0.06;
        }
        if (containsAny(category, clazz, name, "islay", "peat", "peated", "아일라", "피트")) {
            smoky += 0.24;
            woody += 0.06;
            sweet -= 0.06;
        }
        if (containsAny(category, clazz, name, "rye")) {
            spicy += 0.18;
            body += 0.06;
            sweet -= 0.04;
        }
        if (containsAny(category, clazz, name, "sherry", "셰리", "쉐리")) {
            sweet += 0.16;
            fruity += 0.12;
            woody += 0.04;
        }

        if (abv >= 50) {
            body += 0.16;
            spicy += 0.07;
        } else if (abv >= 45) {
            body += 0.10;
            spicy += 0.04;
        } else if (abv <= 40) {
            sweet += 0.05;
            body -= 0.04;
        }

        return new double[]{sweet, smoky, fruity, spicy, woody, body};
    }

    private String buildTypeName(double[] userVector) {
        List<Integer> rank = List.of(0, 1, 2, 3, 4, 5).stream()
                .sorted((a, b) -> Double.compare(userVector[b], userVector[a]))
                .toList();

        String first = DIMENSIONS.get(rank.get(0));
        String second = DIMENSIONS.get(rank.get(1));

        Map<String, String> typeMap = new HashMap<>();
        typeMap.put(key("sweet", "fruity"), "Sherry Lover");
        typeMap.put(key("smoky", "woody"), "Smoky Hunter");
        typeMap.put(key("body", "spicy"), "Bold Explorer");
        typeMap.put(key("sweet", "woody"), "Oak & Honey");
        typeMap.put(key("fruity", "spicy"), "Spice Voyager");

        return typeMap.getOrDefault(key(first, second), title(first) + " " + title(second) + " Explorer");
    }

    private String buildReason(Whisky whisky, double[] userVector) {
        List<Integer> rank = List.of(0, 1, 2, 3, 4, 5).stream()
                .sorted((a, b) -> Double.compare(userVector[b], userVector[a]))
                .toList();
        String primary = DIMENSIONS.get(rank.get(0));
        String secondary = DIMENSIONS.get(rank.get(1));

        StringBuilder reason = new StringBuilder();
        reason.append("당신이 선호한 ")
                .append(toKorean(primary))
                .append(" · ")
                .append(toKorean(secondary))
                .append(" 특성과 잘 맞습니다.");

        if (whisky.getCategory() != null && !whisky.getCategory().isBlank()) {
            reason.append(" ").append(whisky.getCategory()).append(" 스타일이라 입문에도 부담이 적습니다.");
        }

        return reason.toString();
    }

    private double sanitize(Double value) {
        if (value == null || Double.isNaN(value) || Double.isInfinite(value)) {
            return 0;
        }
        if (value < 0) {
            return 0;
        }
        return Math.min(value, 100);
    }

    private double[] normalizeVector(double[] vector) {
        double sum = 0;
        for (double value : vector) {
            sum += Math.max(value, 0);
        }
        if (sum <= 0) {
            return new double[]{1, 1, 1, 1, 1, 1};
        }

        double[] normalized = new double[vector.length];
        for (int i = 0; i < vector.length; i++) {
            normalized[i] = Math.max(vector[i], 0) / sum;
        }
        return normalized;
    }

    private double cosineSimilarity(double[] a, double[] b) {
        double dot = 0;
        double normA = 0;
        double normB = 0;

        for (int i = 0; i < a.length; i++) {
            dot += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }

        if (normA == 0 || normB == 0) {
            return 0;
        }

        return dot / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    private boolean containsAny(String category, String clazz, String name, String... keywords) {
        for (String keyword : keywords) {
            if (category.contains(keyword) || clazz.contains(keyword) || name.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    private String lower(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT);
    }

    private String title(String dimension) {
        return dimension.substring(0, 1).toUpperCase(Locale.ROOT) + dimension.substring(1);
    }

    private String key(String a, String b) {
        return a.compareTo(b) < 0 ? a + ":" + b : b + ":" + a;
    }

    private String toKorean(String dimension) {
        return switch (dimension) {
            case "sweet" -> "달콤함";
            case "smoky" -> "스모키";
            case "fruity" -> "과일향";
            case "spicy" -> "스파이시";
            case "woody" -> "우디함";
            case "body" -> "바디감";
            default -> dimension;
        };
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    @Getter
    @AllArgsConstructor
    private static class ScoredWhisky {
        private Whisky whisky;
        private LiquorPrice matchedPrice;
        private double similarity;
        private String reason;
    }

    @Getter
    @AllArgsConstructor
    private static class PriceLookup {
        private Map<String, LiquorPrice> byProductCode;
        private Map<String, LiquorPrice> byNormalizedName;

        private LiquorPrice findMatch(Whisky whisky) {
            String code = lowerSafe(whisky.getProductCode());
            if (!code.isBlank()) {
                LiquorPrice byCode = byProductCode.get(code);
                if (byCode != null) {
                    return byCode;
                }
            }

            String normalizedName = lowerSafe(whisky.getNormalizedName());
            if (!normalizedName.isBlank()) {
                LiquorPrice byName = byNormalizedName.get(normalizedName);
                if (byName != null) {
                    return byName;
                }
            }

            return null;
        }

        private String lowerSafe(String value) {
            return value == null ? "" : value.toLowerCase(Locale.ROOT);
        }
    }
}
