package com.cdmga.uestc.webpage;

import static org.junit.jupiter.api.Assertions.*;

import com.cdmga.uestc.webpage.Controller.MediaThumbnailController;
import java.awt.Color;
import java.awt.image.BufferedImage;
import java.nio.file.Files;
import java.nio.file.Path;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.test.util.ReflectionTestUtils;

class MediaThumbnailControllerTests {
    @TempDir Path directory;

    @Test
    void resizesLegacyImageAndRejectsTraversal() throws Exception {
        Path images = Files.createDirectory(directory.resolve("images"));
        BufferedImage image = new BufferedImage(800, 400, BufferedImage.TYPE_INT_RGB);
        image.setRGB(0, 0, Color.RED.getRGB());
        ImageIO.write(image, "png", images.resolve("sample.png").toFile());

        MediaThumbnailController controller = new MediaThumbnailController();
        ReflectionTestUtils.setField(controller, "imagesDirectory", images.toString());
        ReflectionTestUtils.setField(controller, "scoresDirectory", directory.toString());
        ReflectionTestUtils.setField(controller, "avatarsDirectory", directory.toString());

        var response = controller.thumbnail("/images/sample.png", 160);
        assertEquals(200, response.getStatusCode().value());
        assertTrue(response.getHeaders().getCacheControl().contains("max-age=2592000"));
        assertTrue(response.getHeaders().getCacheControl().contains("public"));
        assertEquals("image/png", response.getHeaders().getContentType().toString());
        BufferedImage result = ImageIO.read(new java.io.ByteArrayInputStream(response.getBody()));
        assertEquals(160, result.getWidth());
        assertEquals(80, result.getHeight());
        assertEquals(404, controller.thumbnail("/images/../missing.png", 160).getStatusCode().value());
    }
}
