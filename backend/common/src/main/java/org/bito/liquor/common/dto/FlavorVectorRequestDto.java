package org.bito.liquor.common.dto;

import lombok.Data;

@Data
public class FlavorVectorRequestDto {

    private Double sweet;
    private Double smoky;
    private Double fruity;
    private Double spicy;
    private Double woody;
    private Double body;
}
