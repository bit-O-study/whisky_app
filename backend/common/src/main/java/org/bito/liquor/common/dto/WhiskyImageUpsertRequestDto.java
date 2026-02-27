package org.bito.liquor.common.dto;

import lombok.Data;

@Data
public class WhiskyImageUpsertRequestDto {
    private String seedKey;
    private String productCode;
    private String imageUrl;
    private String imageSource;
}
