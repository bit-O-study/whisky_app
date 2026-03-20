package org.bito.liquor.service;

import lombok.RequiredArgsConstructor;
import org.bito.liquor.common.dto.LiquorDto;
import org.bito.liquor.common.dto.LiquorPageResponseDto;
import org.bito.liquor.common.model.Liquor;
import org.bito.liquor.common.model.LiquorPrice;
import org.bito.liquor.common.model.Whisky;
import org.bito.liquor.common.repository.LiquorPriceRepository;
import org.bito.liquor.common.repository.LiquorRepository;
import org.bito.liquor.common.repository.WhiskyRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class LiquorQueryService {

    private final WhiskyRepository whiskyRepository;
    private final LiquorRepository liquorRepository;
    private final LiquorPriceRepository liquorPriceRepository;

//    public LiquorPageResponseDto getAllLiquors(int page, int size) {
//        Pageable pageable = PageRequest.of(page, size);
//        Page<Whisky> whiskies = whiskyRepository.findAllByOrderByUpdatedAtDesc(pageable);
//        return toPagedDto(whiskies, page, size);
//    }
// 1. 전체 조회 (페이징)
public LiquorPageResponseDto getAllLiquors(int page, int size) {
    Pageable pageable = PageRequest.of(page, size);
    Page<Liquor> liquors = liquorRepository.findAllByOrderByUpdatedAtDesc(pageable);
    return toPagedDto(liquors, page, size);
}

    // 2. 키워드 검색 (페이징)
    public LiquorPageResponseDto searchLiquors(String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Liquor> liquors = liquorRepository.searchByKeyword(keyword, pageable);
        return toPagedDto(liquors, page, size);
    }

    // 3. Page 객체를 DTO로 변환
    private LiquorPageResponseDto toPagedDto(Page<Liquor> liquors, int page, int size) {
        return LiquorPageResponseDto.builder()
                .items(toDtos(liquors.getContent()))
                .page(page)
                .size(size)
                .hasNext(liquors.hasNext())
                .build();
    }

    // 4. List 객체를 DTO 리스트로 변환
    private List<LiquorDto> toDtos(List<Liquor> liquors) {
        PriceLookup lookup = buildPriceLookup(); // 기존에 작성해두신 가격 조회 로직
        return liquors.stream()
                .map(liquor -> LiquorDto.from(liquor, lookup.findMatch(liquor)))
                .toList();
    }

    private PriceLookup buildPriceLookup() {
        List<LiquorPrice> prices = liquorPriceRepository.findAllOrderByUpdatedAtDesc();

        Map<String, LiquorPrice> byProductCode = new HashMap<>();
        Map<String, LiquorPrice> byNormalizedName = new HashMap<>();

        for (LiquorPrice price : prices) {
            String code = normalize(price.getLiquor().getProductCode());
            String normalizedName = normalize(price.getLiquor().getNormalizedName());

            if (!code.isBlank()) {
                LiquorPrice existing = byProductCode.get(code);
                if (existing == null || isBetterPrice(price, existing)) {
                    byProductCode.put(code, price);
                }
            }

            if (!normalizedName.isBlank()) {
                LiquorPrice existing = byNormalizedName.get(normalizedName);
                if (existing == null || isBetterPrice(price, existing)) {
                    byNormalizedName.put(normalizedName, price);
                }
            }
        }

        return new PriceLookup(byProductCode, byNormalizedName);
    }

    private boolean isBetterPrice(LiquorPrice candidate, LiquorPrice existing) {
        int candidatePrice = candidate.getCurrentPrice() == null ? Integer.MAX_VALUE : candidate.getCurrentPrice();
        int existingPrice = existing.getCurrentPrice() == null ? Integer.MAX_VALUE : existing.getCurrentPrice();
        return candidatePrice < existingPrice;
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private record PriceLookup(
            Map<String, LiquorPrice> byProductCode,
            Map<String, LiquorPrice> byNormalizedName
    ) {
        private LiquorPrice findMatch(Liquor liquor) {
            String code = normalize(liquor.getProductCode());
            if (!code.isBlank()) {
                LiquorPrice matchByCode = byProductCode.get(code);
                if (matchByCode != null) {
                    return matchByCode;
                }
            }

            String normalizedName = normalize(liquor.getNormalizedName());
            if (!normalizedName.isBlank()) {
                LiquorPrice matchByName = byNormalizedName.get(normalizedName);
                if (matchByName != null) {
                    return matchByName;
                }
            }

            return null;
        }

        private String normalize(String value) {
            return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
        }
    }
}
