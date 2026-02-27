package org.bito.liquor.controller;

import lombok.RequiredArgsConstructor;
import org.bito.liquor.common.dto.WhiskyImageUpdateResponseDto;
import org.bito.liquor.common.dto.WhiskyImageUpsertRequestDto;
import org.bito.liquor.common.model.Whisky;
import org.bito.liquor.service.SupabaseStorageService;
import org.bito.liquor.service.WhiskyImageService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;

@RestController
@RequestMapping("/api/whiskies")
@RequiredArgsConstructor
public class WhiskyController {

    private final WhiskyImageService whiskyImageService;
    private final SupabaseStorageService supabaseStorageService;

    /**
     * 이미지 URL을 직접 지정하여 위스키 이미지 저장
     */
    @PatchMapping("/image")
    public ResponseEntity<WhiskyImageUpdateResponseDto> upsertImage(
            @RequestBody WhiskyImageUpsertRequestDto request
    ) {
        try {
            Whisky updated = whiskyImageService.upsertImage(request);
            return ResponseEntity.ok(WhiskyImageUpdateResponseDto.from(updated));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
        }
    }

    /**
     * 이미지 파일을 Supabase Storage에 업로드하고 URL을 DB에 저장
     *
     * @param file        업로드할 이미지 파일
     * @param seedKey     위스키 seedKey (seedKey 또는 productCode 중 하나 필수)
     * @param productCode 위스키 productCode
     * @param imageSource 이미지 출처 (기본값: MANUAL)
     */
    @PostMapping(value = "/image/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<WhiskyImageUpdateResponseDto> uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "seedKey", required = false) String seedKey,
            @RequestParam(value = "productCode", required = false) String productCode,
            @RequestParam(value = "imageSource", defaultValue = "MANUAL") String imageSource
    ) {
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "파일이 비어 있습니다.");
        }

        try {
            String publicUrl = supabaseStorageService.upload(file);

            WhiskyImageUpsertRequestDto request = new WhiskyImageUpsertRequestDto();
            request.setSeedKey(seedKey);
            request.setProductCode(productCode);
            request.setImageUrl(publicUrl);
            request.setImageSource(imageSource);

            Whisky updated = whiskyImageService.upsertImage(request);
            return ResponseEntity.ok(WhiskyImageUpdateResponseDto.from(updated));

        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "파일 업로드에 실패했습니다.", e);
        }
    }
}
