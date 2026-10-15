package com.cdmga.uestc.webpage.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import jakarta.servlet.http.HttpSession;

@Service
public class IdentitySessionService {
    @Autowired
    private JdbcTemplate jdbc;

    private String hash(HttpSession session) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(session.getId().getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    public void login(Integer identityId, HttpSession session) {
        LocalDateTime expires = LocalDateTime.now().plusSeconds(session.getMaxInactiveInterval());
        jdbc.update("INSERT INTO identity_session (identity_id, session_key_hash, expires_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE identity_id = VALUES(identity_id), last_seen_at = CURRENT_TIMESTAMP, expires_at = VALUES(expires_at), logged_out_at = NULL",
            identityId, hash(session), expires);
    }

    public void heartbeat(HttpSession session) {
        LocalDateTime expires = LocalDateTime.now().plusSeconds(session.getMaxInactiveInterval());
        jdbc.update("UPDATE identity_session SET last_seen_at = CURRENT_TIMESTAMP, expires_at = ? WHERE session_key_hash = ? AND logged_out_at IS NULL",
            expires, hash(session));
    }

    public void logout(HttpSession session) {
        jdbc.update("UPDATE identity_session SET logged_out_at = CURRENT_TIMESTAMP WHERE session_key_hash = ? AND logged_out_at IS NULL", hash(session));
    }

    public boolean online(Integer identityId) {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM identity_session WHERE identity_id = ? AND logged_out_at IS NULL AND expires_at > CURRENT_TIMESTAMP AND last_seen_at > CURRENT_TIMESTAMP - INTERVAL 2 MINUTE", Integer.class, identityId);
        return count != null && count > 0;
    }
}
