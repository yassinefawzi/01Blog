package com.blog01.storage;

import org.springframework.web.multipart.MultipartFile;

public interface StorageService {
    StoredFile store(MultipartFile file);

    StoredFile storeImage(MultipartFile file);

    StoredFileKind requireStoredFile(String fileUrl);

    void delete(String fileUrl);
}
