package com.cdmga.uestc.webpage.Controller;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;
import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/media")
public class MediaThumbnailController {
    @Value("${course.upload.directory}") private String imagesDirectory;
    @Value("${score.upload.directory}") private String scoresDirectory;
    @Value("${avatar.upload.directory}") private String avatarsDirectory;

    private record Thumbnail(byte[] bytes, MediaType type) {}

    private final Map<String, Thumbnail> cache = new LinkedHashMap<>(256, 0.75f, true) {
        @Override protected boolean removeEldestEntry(Map.Entry<String, Thumbnail> eldest) {
            return size() > 256;
        }
    };

    @GetMapping("/thumb")
    public ResponseEntity<byte[]> thumbnail(@RequestParam String path, @RequestParam(defaultValue = "160") int size)
            throws IOException {
        if (size < 32 || size > 1280 || path.indexOf('\\') >= 0) return ResponseEntity.badRequest().build();
        Path source = resolveSource(path);
        if (source == null || !Files.isRegularFile(source)) return ResponseEntity.notFound().build();
        if (Files.size(source) > 20L * 1024 * 1024) return ResponseEntity.badRequest().build();

        String key = source + ":" + Files.getLastModifiedTime(source).toMillis() + ":" + size;
        Thumbnail output;
        synchronized (cache) {
            output = cache.get(key);
        }
        if (output == null) {
            BufferedImage original = ImageIO.read(source.toFile());
            if (original == null) return ResponseEntity.notFound().build();
            double scale = Math.min(1.0, (double) size / Math.max(original.getWidth(), original.getHeight()));
            int width = Math.max(1, (int) Math.round(original.getWidth() * scale));
            int height = Math.max(1, (int) Math.round(original.getHeight() * scale));
            boolean png = source.getFileName().toString().toLowerCase().endsWith(".png");
            BufferedImage thumbnail = new BufferedImage(width, height,
                    png ? BufferedImage.TYPE_INT_ARGB : BufferedImage.TYPE_INT_RGB);
            Graphics2D graphics = thumbnail.createGraphics();
            try {
                if (!png) {
                    graphics.setColor(Color.WHITE);
                    graphics.fillRect(0, 0, width, height);
                }
                graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
                graphics.drawImage(original, 0, 0, width, height, null);
            } finally {
                graphics.dispose();
            }
            ByteArrayOutputStream bytes = new ByteArrayOutputStream();
            if (png) {
                ImageIO.write(thumbnail, "png", bytes);
            } else {
                ImageWriter writer = ImageIO.getImageWritersByFormatName("jpeg").next();
                try (ImageOutputStream stream = ImageIO.createImageOutputStream(bytes)) {
                    writer.setOutput(stream);
                    ImageWriteParam params = writer.getDefaultWriteParam();
                    params.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
                    params.setCompressionQuality(0.82f);
                    writer.write(null, new IIOImage(thumbnail, null, null), params);
                } finally {
                    writer.dispose();
                }
            }
            byte[] resized = bytes.toByteArray();
            output = new Thumbnail(resized.length < Files.size(source) ? resized : Files.readAllBytes(source),
                    png ? MediaType.IMAGE_PNG : MediaType.IMAGE_JPEG);
            synchronized (cache) {
                cache.put(key, output);
            }
        }
        return ResponseEntity.ok().cacheControl(CacheControl.maxAge(Duration.ofDays(30)).cachePublic())
                .contentType(output.type()).body(output.bytes());
    }

    private Path resolveSource(String path) {
        String root;
        String relative;
        if (path.startsWith("/images/")) {
            root = imagesDirectory;
            relative = path.substring(8);
        } else if (path.startsWith("/scores/")) {
            root = scoresDirectory;
            relative = path.substring(8);
        } else if (path.startsWith("/avatars/")) {
            root = avatarsDirectory;
            relative = path.substring(9);
        } else {
            return null;
        }
        if (!relative.toLowerCase().matches("[a-z0-9_./-]+\\.(jpg|jpeg|png)")) return null;
        Path directory = Paths.get(root).toAbsolutePath().normalize();
        Path source = directory.resolve(relative).normalize();
        return source.startsWith(directory) ? source : null;
    }
}
