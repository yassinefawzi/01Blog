package com.blog01.storage;

import com.blog01.exception.BadRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@Service
@ConditionalOnProperty(name = "app.storage.type", havingValue = "local", matchIfMissing = true)
public class LocalStorageService implements StorageService {

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg", "image/png", "image/gif", "image/webp",
            "video/mp4", "video/webm"
    );

    private final Path uploadPath;
    private final String baseUrl;

    public LocalStorageService(
            @Value("${app.storage.local.upload-dir}") String uploadDir,
            @Value("${app.storage.local.base-url}") String baseUrl
    ) throws IOException {
        this.uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        this.baseUrl = baseUrl;
        Files.createDirectories(this.uploadPath);
    }

    @Override
    public String store(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BadRequestException("File is empty");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new BadRequestException("Unsupported file type: " + contentType);
        }

        String extension = getExtension(file.getOriginalFilename());
        String filename = UUID.randomUUID() + extension;

        try {
            Path target = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            return baseUrl + "/" + filename;
        } catch (IOException e) {
            throw new BadRequestException("Failed to store file: " + e.getMessage());
        }
    }

    @Override
    public void delete(String fileUrl) {
        if (fileUrl == null || !fileUrl.startsWith(baseUrl)) {
            return;
        }
        String filename = fileUrl.substring(fileUrl.lastIndexOf('/') + 1);
        if (filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
            return;
        }
        try {
            Path target = uploadPath.resolve(filename).normalize();
            if (!target.startsWith(uploadPath)) {
                return;
            }
            Files.deleteIfExists(target);
        } catch (IOException ignored) {
        }
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.'));
    }
}
