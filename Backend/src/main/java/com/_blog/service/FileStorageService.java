package com._blog.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

	private final Path uploadDir = Paths.get("uploads");

	public String store(MultipartFile file) throws IOException {
		if (file == null || file.isEmpty()) {
			return null;
		}
		Files.createDirectories(uploadDir);
		String original = file.getOriginalFilename();
		String extension = "";
		if (original != null && original.contains(".")) {
			extension = original.substring(original.lastIndexOf('.'));
		}
		String filename = UUID.randomUUID() + extension;
		Path target = uploadDir.resolve(filename);
		Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
		return "/uploads/" + filename;
	}

	public String detectMediaType(MultipartFile file) {
		if (file == null || file.getContentType() == null) {
			return "IMAGE";
		}
		return file.getContentType().startsWith("video/") ? "VIDEO" : "IMAGE";
	}
}
