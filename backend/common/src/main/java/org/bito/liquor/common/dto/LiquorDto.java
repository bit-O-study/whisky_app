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

    public static LiquorDto from(Whisky whisky) {
        return from(whisky, null);
    }

    public static LiquorDto from(Whisky whisky, LiquorPrice matchedPrice) {
        String productName = whisky.getProductName() == null || whisky.getProductName().isBlank()
                ? whisky.getNormalizedName()
                : whisky.getProductName();

        Liquor matchedLiquor = matchedPrice == null ? null : matchedPrice.getLiquor();

        String brand = whisky.getBrand() != null && !whisky.getBrand().isBlank()
                ? whisky.getBrand()
                : (matchedLiquor == null ? "Unknown" : matchedLiquor.getBrand());

        String category = whisky.getCategory() != null && !whisky.getCategory().isBlank()
                ? whisky.getCategory()
                : (matchedLiquor == null ? "Whisky" : matchedLiquor.getCategory());

        Integer volume = matchedLiquor == null || matchedLiquor.getVolume() == null ? 700 : matchedLiquor.getVolume();
        Double alcoholPercent = whisky.getAlcoholPercent() != null
                ? whisky.getAlcoholPercent()
                : (matchedLiquor == null ? null : matchedLiquor.getAlcoholPercent());

        return LiquorDto.builder()
                .id(whisky.getId())
                .productCode(whisky.getProductCode() == null ? whisky.getSeedKey() : whisky.getProductCode())
                .name(productName)
                .brand(brand)
                .category(category)
                .volume(volume)
                .alcoholPercent(alcoholPercent)
                .country(matchedLiquor == null ? "Unknown" : matchedLiquor.getCountry())
                .currentPrice(matchedPrice == null || matchedPrice.getCurrentPrice() == null ? 0 : matchedPrice.getCurrentPrice())
                .originalPrice(matchedPrice == null || matchedPrice.getOriginalPrice() == null ? 0 : matchedPrice.getOriginalPrice())
                .discountPercent(matchedPrice == null ? 0 : matchedPrice.getDiscountPercent())
                .imageUrl(resolveImageUrl(whisky, matchedLiquor))
                .productUrl(matchedLiquor == null || matchedLiquor.getProductUrl() == null ? "" : matchedLiquor.getProductUrl())
                .source(matchedPrice == null || matchedPrice.getSource() == null ? "WHISKY_DB" : matchedPrice.getSource())
                .fullname(productName)
                .clazz(whisky.getClazz() == null && matchedLiquor != null ? matchedLiquor.getClazz() : whisky.getClazz())
                .updatedAt(matchedPrice == null ? whisky.getUpdatedAt() : matchedPrice.getCrawledAt())
                .build();
    }

    private static String resolveImageUrl(Whisky whisky, Liquor matchedLiquor) {
        if (whisky.getImageUrl() != null && !whisky.getImageUrl().isBlank()) {
            return whisky.getImageUrl();
        }
        if (matchedLiquor != null && matchedLiquor.getImageUrl() != null) {
            return matchedLiquor.getImageUrl();
        }
        return "";
    }
}
