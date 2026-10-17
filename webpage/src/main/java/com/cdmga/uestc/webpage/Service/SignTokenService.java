package com.cdmga.uestc.webpage.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Clock;
import java.util.Base64;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class SignTokenService {
    private static final long PERIOD_SECONDS = 30;
    private final byte[] secret;
    private final Clock clock;

    @Autowired
    public SignTokenService(@Value("${sign.qr-secret:}") String configuredSecret) {
        this(configuredSecret, Clock.systemUTC());
    }

    SignTokenService(String configuredSecret, Clock clock) {
        if (configuredSecret == null || configuredSecret.isBlank()) {
            secret = new byte[32];
            new SecureRandom().nextBytes(secret);
        } else {
            if (configuredSecret.length() < 32) {
                throw new IllegalArgumentException("SIGN_QR_SECRET 至少需要 32 个字符");
            }
            secret = configuredSecret.getBytes(StandardCharsets.UTF_8);
        }
        this.clock = clock;
    }

    public IssuedToken issue(int activityId) {
        long now = clock.instant().getEpochSecond();
        long expiresAt = (now / PERIOD_SECONDS + 1) * PERIOD_SECONDS;
        String payload = activityId + "." + expiresAt;
        return new IssuedToken(payload + "." + signature(payload), expiresAt * 1000);
    }

    public boolean valid(int activityId, String token) {
        if (token == null || token.length() > 200) return false;
        String[] parts = token.split("\\.", -1);
        if (parts.length != 3) return false;
        try {
            int signedActivityId = Integer.parseInt(parts[0]);
            long expiresAt = Long.parseLong(parts[1]);
            long now = clock.instant().getEpochSecond();
            if (signedActivityId != activityId || expiresAt <= now || expiresAt > now + PERIOD_SECONDS) return false;
            String expected = signature(parts[0] + "." + parts[1]);
            return MessageDigest.isEqual(expected.getBytes(StandardCharsets.US_ASCII), parts[2].getBytes(StandardCharsets.US_ASCII));
        } catch (NumberFormatException e) {
            return false;
        }
    }

    private String signature(String payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("无法生成签到码", e);
        }
    }

    public record IssuedToken(String token, long expiresAt) {}
}
