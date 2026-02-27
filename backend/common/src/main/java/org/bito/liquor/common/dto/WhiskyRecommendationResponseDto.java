package org.bito.liquor.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
public class WhiskyRecommendationResponseDto {

    private String typeName;
    private FlavorVectorDto flavorVector;
    private List<WhiskyRecommendationItemDto> recommendations;
}
