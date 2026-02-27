package org.bito.liquor.common.dto;

import lombok.Builder;
import lombok.Data;
import org.bito.liquor.common.model.Whisky;

import java.time.LocalDateTime;

@Data
@Builder
public class WhiskyImageUpdateResponseDto {
    private Long id;
    private String seedKey;
    private String productCode;
    private String imageUrl;
    private String imageSource;
    private LocalDateTime imageGeneratedAt;

    public static WhiskyImageUpdateResponseDto from(Whisky whisky) {
        return WhiskyImageUpdateResponseDto.builder()
                .id(whisky.getId())
                .seedKey(whisky.getSeedKey())
                .productCode(whisky.getProductCode())
                .imageUrl(whisky.getImageUrl())
                .imageSource(whisky.getImageSource())
                .imageGeneratedAt(whisky.getImageGeneratedAt())
                .build();
    }
}
