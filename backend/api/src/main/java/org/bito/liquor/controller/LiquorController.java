package org.bito.liquor.controller;

import lombok.RequiredArgsConstructor;
import org.bito.liquor.common.dto.FlavorVectorRequestDto;
import org.bito.liquor.common.dto.LiquorPageResponseDto;
import org.bito.liquor.common.dto.WhiskyRecommendationResponseDto;
import org.bito.liquor.service.LiquorQueryService;
import org.bito.liquor.service.WhiskyRecommendationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/liquors")
@RequiredArgsConstructor
public class LiquorController {

    private final LiquorQueryService liquorQueryService;
    private final WhiskyRecommendationService whiskyRecommendationService;

    @GetMapping
    public ResponseEntity<LiquorPageResponseDto> getAllLiquors(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "24") int size
    ) {
        return ResponseEntity.ok(liquorQueryService.getAllLiquors(page, size));
    }

    @GetMapping("/search")
    public ResponseEntity<LiquorPageResponseDto> searchLiquors(
            @RequestParam("q") String keyword,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "24") int size
    ) {
        return ResponseEntity.ok(liquorQueryService.searchLiquors(keyword, page, size));
    }

    @PostMapping("/recommendations")
    public ResponseEntity<WhiskyRecommendationResponseDto> recommendLiquors(
            @RequestBody FlavorVectorRequestDto request
    ) {
        return ResponseEntity.ok(whiskyRecommendationService.recommend(request));
    }
}
