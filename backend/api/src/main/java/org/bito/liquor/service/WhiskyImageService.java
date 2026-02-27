package org.bito.liquor.service;

import lombok.RequiredArgsConstructor;
import org.bito.liquor.common.dto.WhiskyImageUpsertRequestDto;
import org.bito.liquor.common.model.Whisky;
import org.bito.liquor.common.repository.WhiskyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class WhiskyImageService {

    private final WhiskyRepository whiskyRepository;

    @Transactional
    public Whisky upsertImage(WhiskyImageUpsertRequestDto request) {
        String normalizedSeedKey = normalize(request.getSeedKey());
        String normalizedProductCode = normalize(request.getProductCode());
        String normalizedImageUrl = normalize(request.getImageUrl());

        if (normalizedImageUrl.isBlank()) {
            throw new IllegalArgumentException("imageUrl은 필수입니다.");
        }

        Whisky whisky = findTargetWhisky(normalizedSeedKey, normalizedProductCode);
        whisky.setImageUrl(normalizedImageUrl);
        whisky.setImageSource(resolveImageSource(request.getImageSource()));
        whisky.setImageGeneratedAt(LocalDateTime.now());

        return whiskyRepository.save(whisky);
    }

    private Whisky findTargetWhisky(String seedKey, String productCode) {
        if (!seedKey.isBlank()) {
            return whiskyRepository.findBySeedKey(seedKey)
                    .orElseThrow(() -> new IllegalArgumentException("해당 seedKey의 위스키를 찾을 수 없습니다."));
        }

        if (!productCode.isBlank()) {
            return whiskyRepository.findByProductCode(productCode)
                    .orElseThrow(() -> new IllegalArgumentException("해당 productCode의 위스키를 찾을 수 없습니다."));
        }

        throw new IllegalArgumentException("seedKey 또는 productCode 중 하나는 필수입니다.");
    }

    private String resolveImageSource(String imageSource) {
        String normalized = normalize(imageSource);
        return normalized.isBlank() ? "AI" : normalized;
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim();
    }
}
