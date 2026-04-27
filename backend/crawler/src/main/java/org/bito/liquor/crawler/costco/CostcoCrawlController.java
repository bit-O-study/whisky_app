package org.bito.liquor.crawler.costco;

import lombok.RequiredArgsConstructor;
import org.bito.liquor.common.dto.LiquorDto;
import org.bito.liquor.common.model.LiquorPrice;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/crawl/costco")
@RequiredArgsConstructor
public class CostcoCrawlController {

    private final CostcoCrawlService costcoCrawlService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> scrapeLiquors() {
        List<LiquorPrice> liquors = costcoCrawlService.scrapeLiquors();

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Costco 크롤링이 완료되었습니다.");
        response.put("count", liquors.size());
        response.put("liquors", liquors.stream().map(LiquorDto::from).toList());
        return ResponseEntity.ok(response);
    }
}
