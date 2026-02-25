package org.bito.liquor.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@Service
public class SupabaseStorageService {

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.service-key}")
    private String serviceKey;

    @Value("${supabase.storage.bucket}")
    private String bucket;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * MultipartFile을 Supabase Storage에 업로드하고 public URL을 반환합니다.
     */
    public String upload(MultipartFile file) throws IOException {
        String extension = getExtension(file.getOriginalFilename());
        String storagePath = UUID.randomUUID() + extension;

        String uploadUrl = supabaseUrl + "/storage/v1/object/" + bucket + "/" + storagePath;

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + serviceKey);
        headers.set("Content-Type", file.getContentType());
        headers.set("x-upsert", "true");

        HttpEntity<byte[]> entity = new HttpEntity<>(file.getBytes(), headers);
        restTemplate.exchange(uploadUrl, HttpMethod.POST, entity, String.class);

        return supabaseUrl + "/storage/v1/object/public/" + bucket + "/" + storagePath;
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return ".jpg";
        }
        return filename.substring(filename.lastIndexOf('.'));
    }
}
