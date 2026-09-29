package com.blog01.storage;

import com.blog01.exception.BadRequestException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LocalStorageServiceTest {

    @TempDir
    Path uploadDir;

    private LocalStorageService storage;

    @BeforeEach
    void setUp() throws Exception {
        storage = new LocalStorageService(uploadDir.toString(), "http://localhost:8080/api/files");
    }

    @Test
    void rejectsFileLargerThan50Mb() {
        MultipartFile file = new MockMultipartFile("file", "big.png", "image/png", new byte[] {1}) {
            @Override
            public long getSize() {
                return LocalStorageService.MAX_FILE_BYTES + 1;
            }
        };

        BadRequestException error = assertThrows(BadRequestException.class, () -> storage.store(file));
        assertEquals("File must be 50MB or smaller", error.getMessage());
    }

    @Test
    void rejectsScriptRenamedToPng() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "script.png", "image/png", "alert('not an image')".getBytes(StandardCharsets.UTF_8));

        assertThrows(BadRequestException.class, () -> storage.store(file));
        assertThrows(BadRequestException.class, () -> storage.storeImage(file));
    }

    @Test
    void storesPngEvenWhenTheClientClaimsAnotherType() throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(1, 1, BufferedImage.TYPE_INT_RGB), "png", out);
        MockMultipartFile file = new MockMultipartFile("file", "photo.svg", "image/svg+xml", out.toByteArray());

        StoredFile stored = storage.store(file);

        assertTrue(stored.url().endsWith(".png"));
        assertEquals(StoredFileKind.IMAGE, stored.kind());
        assertEquals(StoredFileKind.IMAGE, storage.requireStoredFile(stored.url()));
    }

    @Test
    void rejectsSvgBytesEvenWhenNamedAsJpeg() {
        byte[] svg = "<svg xmlns=\"http://www.w3.org/2000/svg\"></svg>".getBytes(StandardCharsets.UTF_8);
        MockMultipartFile file = new MockMultipartFile("file", "avatar.jpg", "image/jpeg", svg);

        assertThrows(BadRequestException.class, () -> storage.store(file));
        assertThrows(BadRequestException.class, () -> storage.storeImage(file));
    }

    @Test
    void rejectsVideoAsAvatar() {
        MockMultipartFile file = new MockMultipartFile("file", "clip.mp4", "video/mp4", mp4());

        assertThrows(BadRequestException.class, () -> storage.storeImage(file));
    }

    @Test
    void storesMp4FromContentsAndRejectsExternalUrls() {
        StoredFile stored = storage.store(new MockMultipartFile("file", "clip.mov", "video/quicktime", mp4()));
        assertTrue(stored.url().endsWith(".mp4"));
        assertEquals(StoredFileKind.VIDEO, stored.kind());

        byte[] isom = mp4();
        isom[8] = 'i';
        isom[9] = 's';
        isom[10] = 'o';
        isom[11] = 'm';
        StoredFile commonMp4 = storage.store(new MockMultipartFile("file", "phone.mov", "video/quicktime", isom));
        assertTrue(commonMp4.url().endsWith(".mp4"));
        assertEquals(StoredFileKind.VIDEO, commonMp4.kind());

        assertThrows(BadRequestException.class,
                () -> storage.requireStoredFile("https://example.com/files/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.png"));
    }

    private static byte[] mp4() {
        return new byte[] {
                0, 0, 0, 24,
                'f', 't', 'y', 'p',
                'm', 'p', '4', '2',
                0, 0, 0, 0
        };
    }
}
