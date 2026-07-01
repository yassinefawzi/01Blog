package com.blog01.storage;

import org.springframework.web.multipart.MultipartFile;

public interface StorageService {
    String store(MultipartFile file);
    void delete(String fileUrl);
}
