package com.blog01.storage;

import com.blog01.exception.BadRequestException;
import org.apache.tika.Tika;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
@ConditionalOnProperty(name = "app.storage.type", havingValue = "local", matchIfMissing = true)
public class LocalStorageService implements StorageService {

    // Types come from the file contents. The original name is ignored, so script.png stays text.
    // Tika reports many real MP4 files as video/quicktime, and WebM as application/x-matroska.
    private static final Map<String, Detected> ALLOWED = Map.of(
            "image/jpeg", new Detected(".jpg", StoredFileKind.IMAGE),
            "image/png", new Detected(".png", StoredFileKind.IMAGE),
            "image/gif", new Detected(".gif", StoredFileKind.IMAGE),
            "image/webp", new Detected(".webp", StoredFileKind.IMAGE),
            "video/mp4", new Detected(".mp4", StoredFileKind.VIDEO),
            "video/quicktime", new Detected(".mp4", StoredFileKind.VIDEO),
            "video/webm", new Detected(".webm", StoredFileKind.VIDEO),
            "application/x-matroska", new Detected(".webm", StoredFileKind.VIDEO)
    );
    static final long MAX_FILE_BYTES = 50L * 1024 * 1024;
    private static final Pattern STORED_NAME = Pattern.compile(
            "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\\.(jpg|jpeg|png|gif|webp|mp4|webm)$",
            Pattern.CASE_INSENSITIVE
    );

    private final Tika tika = new Tika();
    private final Path uploadPath;
    private final String baseUrl;

    public LocalStorageService(
            @Value("${app.storage.local.upload-dir}") String uploadDir,
            @Value("${app.storage.local.base-url}") String baseUrl
    ) throws IOException {
        this.uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        Files.createDirectories(this.uploadPath);
    }

    @Override
    public StoredFile store(MultipartFile file) {
        return store(file, false);
    }

    @Override
    public StoredFile storeImage(MultipartFile file) {
        return store(file, true);
    }

    @Override
    public StoredFileKind requireStoredFile(String fileUrl) {
        String filename = filenameOf(fileUrl);
        if (!STORED_NAME.matcher(filename).matches()) {
            throw new BadRequestException(mediaMessage(false));
        }
        Path target = uploadPath.resolve(filename).normalize();
        if (!target.startsWith(uploadPath) || !Files.isRegularFile(target)) {
            throw new BadRequestException("Media file not found");
        }
        return kindForExtension(filename);
    }

    @Override
    public void delete(String fileUrl) {
        if (fileUrl == null || !fileUrl.startsWith(baseUrl + "/")) {
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

    private StoredFile store(MultipartFile file, boolean imagesOnly) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File is empty");
        }
        if (file.getSize() > MAX_FILE_BYTES) {
            throw new BadRequestException("File must be 50MB or smaller");
        }

        String filename = UUID.randomUUID() + ".bin";
        Path target = uploadPath.resolve(filename);
        try (InputStream in = file.getInputStream()) {
            byte[] header = in.readNBytes(4096);
            Detected detected = detect(header, imagesOnly);
            filename = UUID.randomUUID() + detected.extension();
            target = uploadPath.resolve(filename);
            try (OutputStream out = Files.newOutputStream(target)) {
                out.write(header);
                in.transferTo(out);
            }
            if (detected.kind() == StoredFileKind.IMAGE && !".webp".equals(detected.extension())
                    && !isDecodableImage(target)) {
                throw new BadRequestException(mediaMessage(true));
            }
            return new StoredFile(baseUrl + "/" + filename, detected.kind());
        } catch (BadRequestException e) {
            deleteQuietly(target);
            throw e;
        } catch (IOException e) {
            deleteQuietly(target);
            throw new BadRequestException("Failed to store file");
        }
    }

    private Detected detect(byte[] header, boolean imagesOnly) {
        String mime;
        try {
            mime = tika.detect(new ByteArrayInputStream(header));
        } catch (IOException e) {
            throw new BadRequestException(mediaMessage(imagesOnly));
        }
        if ("image/jpg".equals(mime) || "image/pjpeg".equals(mime)) {
            mime = "image/jpeg";
        }
        Detected detected = ALLOWED.get(mime);
        if (detected == null || (imagesOnly && detected.kind() != StoredFileKind.IMAGE)) {
            throw new BadRequestException(mediaMessage(imagesOnly));
        }
        return detected;
    }

    private static boolean isDecodableImage(Path target) {
        try {
            BufferedImage image = ImageIO.read(target.toFile());
            return image != null && image.getWidth() > 0 && image.getHeight() > 0;
        } catch (IOException e) {
            return false;
        }
    }

    private String filenameOf(String fileUrl) {
        String prefix = baseUrl + "/";
        if (fileUrl == null || !fileUrl.startsWith(prefix)) {
            throw new BadRequestException("Media must be an uploaded file");
        }
        String filename = fileUrl.substring(prefix.length());
        if (filename.isBlank() || filename.contains("/") || filename.contains("\\") || filename.contains("..")) {
            throw new BadRequestException("Invalid media");
        }
        return filename;
    }

    private static StoredFileKind kindForExtension(String filename) {
        String lower = filename.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".mp4") || lower.endsWith(".webm")) {
            return StoredFileKind.VIDEO;
        }
        return StoredFileKind.IMAGE;
    }

    private static String mediaMessage(boolean imagesOnly) {
        if (imagesOnly) {
            return "Only JPEG, PNG, GIF, and WebP images are allowed";
        }
        return "Only JPEG, PNG, GIF, WebP, MP4, and WebM files are allowed";
    }

    private static void deleteQuietly(Path target) {
        try {
            Files.deleteIfExists(target);
        } catch (IOException ignored) {
        }
    }

    private record Detected(String extension, StoredFileKind kind) {
    }
}
