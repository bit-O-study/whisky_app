package org.bito.liquor.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class FlavorVectorDto {

    private double sweet;
    private double smoky;
    private double fruity;
    private double spicy;
    private double woody;
    private double body;
}
