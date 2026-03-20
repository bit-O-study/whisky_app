package org.bito.liquor.common.dto;

import lombok.Builder;
import lombok.Data;
import org.bito.liquor.common.model.Liquor;
import org.bito.liquor.common.model.LiquorPrice;
import org.bito.liquor.common.model.Whisky;

import java.time.LocalDateTime;

@Data
@Builder
public class LiquorDto {

    private Long id;
    private String productCode;
    private String name;
    private String brand;
    private String category;
    private Integer volume;
    private Double alcoholPercent;
    private String country;
    private Integer currentPrice;
    private Integer originalPrice;
    private Integer discountPercent;
    private String imageUrl;
    private String productUrl;
    private String source;
    private String fullname;
    private String clazz;
    private LocalDateTime updatedAt;

    public static LiquorDto from(LiquorPrice price) {
        Liquor liquor = price.getLiquor();
        return LiquorDto.builder()
                .id(price.getId())
                .productCode(liquor.getProductCode())
                .name(liquor.getName())
                .brand(liquor.getBrand())
                .category(liquor.getCategory())
                .volume(liquor.getVolume())
                .alcoholPercent(liquor.getAlcoholPercent())
                .country(liquor.getCountry())
                .currentPrice(price.getCurrentPrice())
                .originalPrice(price.getOriginalPrice())
                .discountPercent(price.getDiscountPercent())
                .imageUrl(liquor.getImageUrl())
                .productUrl(liquor.getProductUrl())
                .source(price.getSource())
                .fullname(liquor.getProductName())
                .clazz(liquor.getClazz())
                .updatedAt(price.getCrawledAt())
                .build();
    }

    public static LiquorDto from(Liquor liquor) {
        return from(liquor, null);
    }
    public static LiquorDto from(Liquor liquor, LiquorPrice matchedPrice) {
        String productName = liquor.getProductName() == null || liquor.getProductName().isBlank()
                ? liquor.getNormalizedName()
                : liquor.getProductName();

        Liquor matchedLiquor = matchedPrice == null ? null : matchedPrice.getLiquor();

        String brand = liquor.getBrand() != null && !liquor.getBrand().isBlank()
                ? liquor.getBrand()
                : (matchedLiquor == null ? "Unknown" : matchedLiquor.getBrand());

        // 기본값을 "Whisky"에서 "Unknown"(또는 매칭된 주류의 카테고리)으로 변경
        String category = liquor.getCategory() != null && !liquor.getCategory().isBlank()
                ? liquor.getCategory()
                : (matchedLiquor == null ? "Unknown" : matchedLiquor.getCategory());

        Integer volume = matchedLiquor == null || matchedLiquor.getVolume() == null
                ? (liquor.getVolume() == null ? 700 : liquor.getVolume())
                : matchedLiquor.getVolume();

        Double alcoholPercent = liquor.getAlcoholPercent() != null
                ? liquor.getAlcoholPercent()
                : (matchedLiquor == null ? null : matchedLiquor.getAlcoholPercent());

        return LiquorDto.builder()
                .id(liquor.getId())
                .productCode(liquor.getProductCode()) // SeedKey 대신 일관되게 ProductCode 사용
                .name(productName)
                .brand(brand)
                .category(category)
                .volume(volume)
                .alcoholPercent(alcoholPercent)
                .country(matchedLiquor == null ? liquor.getCountry() : matchedLiquor.getCountry())
                .currentPrice(matchedPrice == null || matchedPrice.getCurrentPrice() == null ? 0 : matchedPrice.getCurrentPrice())
                .originalPrice(matchedPrice == null || matchedPrice.getOriginalPrice() == null ? 0 : matchedPrice.getOriginalPrice())
                .discountPercent(matchedPrice == null ? 0 : matchedPrice.getDiscountPercent())
                .imageUrl(resolveImageUrl(liquor, matchedLiquor)) // ※ 주의: resolveImageUrl 메서드의 파라미터 타입도 Liquor로 변경 필요!
                .productUrl(matchedLiquor == null || matchedLiquor.getProductUrl() == null ? liquor.getProductUrl() : matchedLiquor.getProductUrl())
                .source(matchedPrice == null || matchedPrice.getSource() == null ? "LIQUOR_DB" : matchedPrice.getSource()) // WHISKY_DB -> LIQUOR_DB
                .fullname(productName)
                .clazz(liquor.getClazz() == null && matchedLiquor != null ? matchedLiquor.getClazz() : liquor.getClazz())
                .updatedAt(matchedPrice == null ? liquor.getUpdatedAt() : matchedPrice.getCrawledAt())
                .build();
    }

    private static String resolveImageUrl(Liquor liquor, Liquor matchedLiquor) {
        if (liquor.getImageUrl() != null && !liquor.getImageUrl().isBlank()) {
            return liquor.getImageUrl();
        }
        if (matchedLiquor != null && matchedLiquor.getImageUrl() != null) {
            return matchedLiquor.getImageUrl();
        }
        return "";
    }
}
