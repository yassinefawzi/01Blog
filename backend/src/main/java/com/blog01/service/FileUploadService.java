package com.blog01.service;

import com.blog01.entity.MediaType;
import com.blog01.storage.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class FileUploadService {

    private final StorageService storageService;

    public Map<String, String> uploadMedia(MultipartFile file) {
        String url = storageService.store(file);
        MediaType mediaType = detectMediaType(file.getContentType());
        return Map.of("url", url, "mediaType", mediaType.name());
    }

    private MediaType detectMediaType(String contentType) {
        if (contentType == null) return MediaType.NONE;
        if (contentType.startsWith("image/")) return MediaType.IMAGE;
        if (contentType.startsWith("video/")) return MediaType.VIDEO;
        return MediaType.NONE;
    }
}
