package org.bito.liquor.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class WhiskyRecommendationItemDto {

    private LiquorDto liquor;
    private double similarity;
    private String reason;
}
