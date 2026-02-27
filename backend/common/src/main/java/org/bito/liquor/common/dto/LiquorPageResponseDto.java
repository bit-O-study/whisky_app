package org.bito.liquor.common.dto;

import lombok.Builder;

import java.util.List;

@Builder
public record LiquorPageResponseDto(
        List<LiquorDto> items,
        int page,
        int size,
        boolean hasNext
) {
}
