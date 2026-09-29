package com.blog01.service;

import com.blog01.storage.StorageService;
import com.blog01.storage.StoredFile;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class FileUploadService {

    private final StorageService storageService;

    public Map<String, String> uploadMedia(MultipartFile file) {
        StoredFile stored = storageService.store(file);
        return Map.of("url", stored.url(), "mediaType", stored.kind().name());
    }
}
