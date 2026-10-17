package com.cdmga.uestc.webpage.Controller;

import com.cdmga.uestc.webpage.Entity.Identity;
import com.cdmga.uestc.webpage.Repository.IdentityRepository;
import com.cdmga.uestc.webpage.Service.SignCheckinService;
import com.cdmga.uestc.webpage.common.Result;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.BinaryBitmap;
import com.google.zxing.DecodeHintType;
import com.google.zxing.MultiFormatReader;
import com.google.zxing.RGBLuminanceSource;
import com.google.zxing.common.HybridBinarizer;
import com.google.zxing.qrcode.QRCodeWriter;
import jakarta.servlet.http.HttpSession;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.net.URI;
import java.util.Base64;
import java.util.List;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/sign")
public class SignController {
    private static final Logger log = LoggerFactory.getLogger(SignController.class);
    private final SignCheckinService checkins;
    private final IdentityRepository identities;

    public SignController(SignCheckinService checkins, IdentityRepository identities) {
        this.checkins = checkins;
        this.identities = identities;
    }

    @GetMapping("/qr/{activityId}")
    public ResponseEntity<Result> qr(@PathVariable int activityId, @RequestParam String origin, HttpSession session) {
        Identity user = currentUser(session);
        if (user == null) return failure(HttpStatus.UNAUTHORIZED, "请先登录");
        if (!"admin".equals(user.getRole())) return failure(HttpStatus.FORBIDDEN, "需要管理员权限");
        try {
            URI uri = URI.create(origin);
            if (!("http".equals(uri.getScheme()) || "https".equals(uri.getScheme()))
                    || uri.getHost() == null || uri.getRawUserInfo() != null
                    || (uri.getRawPath() != null && !uri.getRawPath().isEmpty())
                    || uri.getRawQuery() != null || uri.getRawFragment() != null) {
                throw new IllegalArgumentException("页面地址无效");
            }
            var issued = checkins.issue(activityId);
            String url = origin + "/sign/" + activityId + "?token=" + issued.token();
            var matrix = new QRCodeWriter().encode(url, BarcodeFormat.QR_CODE, 360, 360);
            BufferedImage image = new BufferedImage(matrix.getWidth(), matrix.getHeight(), BufferedImage.TYPE_INT_RGB);
            for (int y = 0; y < matrix.getHeight(); y++) {
                for (int x = 0; x < matrix.getWidth(); x++) image.setRGB(x, y, matrix.get(x, y) ? 0x000000 : 0xffffff);
            }
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            ImageIO.write(image, "png", output);
            return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(Result.success(
                    new QrResponse("data:image/png;base64," + Base64.getEncoder().encodeToString(output.toByteArray()), issued.expiresAt())));
        } catch (IllegalArgumentException e) {
            return failure(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            return failure(HttpStatus.INTERNAL_SERVER_ERROR, "签到二维码生成失败");
        }
    }

    @PostMapping("/checkin")
    public ResponseEntity<Result> checkin(@RequestBody CheckinRequest request, HttpSession session) {
        Identity user = currentUser(session);
        if (user == null) return failure(HttpStatus.UNAUTHORIZED, "请先登录");
        try {
            return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                    .body(Result.success(checkins.checkIn(user.getId(), request.activityId(), request.token())));
        } catch (IllegalArgumentException e) {
            return failure(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (RuntimeException e) {
            log.error("活动 {} 签到成绩写入失败", request.activityId(), e);
            return failure(HttpStatus.INTERNAL_SERVER_ERROR, "服务器未能保存签到成绩，请联系管理员");
        }
    }

    @PostMapping("/decode")
    public ResponseEntity<Result> decode(@RequestParam("image") MultipartFile file, HttpSession session) {
        if (currentUser(session) == null) return failure(HttpStatus.UNAUTHORIZED, "请先登录");
        if (file.isEmpty() || file.getSize() > 5 * 1024 * 1024) {
            return failure(HttpStatus.BAD_REQUEST, "图片不能为空且不能超过 5 MB");
        }
        try (ImageInputStream input = ImageIO.createImageInputStream(file.getInputStream())) {
            if (input == null) return failure(HttpStatus.BAD_REQUEST, "无法读取图片");
            var readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) return failure(HttpStatus.BAD_REQUEST, "请上传 JPEG 或 PNG 图片");
            ImageReader reader = readers.next();
            try {
                if (!List.of("JPEG", "PNG").contains(reader.getFormatName().toUpperCase(java.util.Locale.ROOT))) {
                    return failure(HttpStatus.BAD_REQUEST, "请上传 JPEG 或 PNG 图片");
                }
                reader.setInput(input);
                int width = reader.getWidth(0);
                int height = reader.getHeight(0);
                if (width <= 0 || height <= 0 || (long) width * height > 16_000_000) {
                    return failure(HttpStatus.BAD_REQUEST, "图片尺寸过大");
                }
                BufferedImage image = reader.read(0);
                int[] pixels = image.getRGB(0, 0, width, height, null, 0, width);
                BinaryBitmap bitmap = new BinaryBitmap(new HybridBinarizer(new RGBLuminanceSource(width, height, pixels)));
                String value = new MultiFormatReader().decode(bitmap, java.util.Map.of(
                        DecodeHintType.POSSIBLE_FORMATS, List.of(BarcodeFormat.QR_CODE),
                        DecodeHintType.TRY_HARDER, true)).getText();
                return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(Result.success(value));
            } finally {
                reader.dispose();
            }
        } catch (Exception e) {
            return failure(HttpStatus.BAD_REQUEST, "未识别到二维码，请对准现场二维码重试");
        }
    }

    private Identity currentUser(HttpSession session) {
        Object id = session.getAttribute("identityId");
        if (!(id instanceof Integer identityId)) return null;
        return identities.findById(identityId).filter(user -> !Boolean.TRUE.equals(user.getIsDeleted())).orElse(null);
    }

    private ResponseEntity<Result> failure(HttpStatus status, String message) {
        return ResponseEntity.status(status).cacheControl(CacheControl.noStore()).body(Result.error(message));
    }

    public record CheckinRequest(int activityId, String token) {}
    public record QrResponse(String image, long expiresAt) {}
}
