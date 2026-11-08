package com.cdmga.uestc.webpage.Service;

import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class MailService {
    @Autowired private JdbcTemplate jdbc;

    public void send(int recipient, String kind, String title, String content, String targetType, long targetId, String sourceType, long sourceId) {
        jdbc.update("INSERT IGNORE INTO mail_message (recipient_id, kind, title, content, target_type, target_id, source_type, source_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                recipient, kind, title, content, targetType, targetId, sourceType, sourceId);
    }

    public void broadcast(String kind, String title, String content, String targetType, long targetId) {
        jdbc.update("INSERT IGNORE INTO mail_message (recipient_id, kind, title, content, target_type, target_id, source_type, source_id) " +
                "SELECT id, ?, ?, ?, ?, ?, ?, ? FROM identity WHERE is_deleted = 0",
                kind, title, content, targetType, targetId, kind, targetId);
    }

    public void admins(String kind, String title, String content, String targetType, long targetId, String sourceType, long sourceId) {
        jdbc.update("INSERT IGNORE INTO mail_message (recipient_id, kind, title, content, target_type, target_id, source_type, source_id) " +
                "SELECT id, ?, ?, ?, ?, ?, ?, ? FROM identity WHERE is_deleted = 0 AND role = 'admin'",
                kind, title, content, targetType, targetId, sourceType, sourceId);
    }

    public void readScoreForAdmins(long scoreId) {
        jdbc.update("UPDATE mail_message SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP), kind = 'score_processed', content = '已被其他管理员处理' WHERE source_type = 'score_submission' AND source_id = ?", scoreId);
    }

    public void retractLike(String sourceType, long sourceId) {
        jdbc.update("DELETE FROM mail_message WHERE source_type = ? AND source_id = ?", sourceType, sourceId);
    }

    public Map<String, Object> inbox(int user, int page, int size, String category) {
        int limit = Math.max(1, Math.min(50, size));
        int offset = Math.max(0, page) * limit;
        String filter = switch (category == null ? "all" : category) {
            case "replies" -> " AND kind = 'forum_reply'";
            case "likes" -> " AND kind = 'forum_like'";
            case "system" -> " AND kind IN ('course_published', 'activity_published', 'award_published')";
            case "review" -> " AND (kind LIKE 'score_%' OR kind LIKE 'forum_report%' OR kind = 'forum_moderated')";
            default -> "";
        };
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT id, kind, title, content, target_type AS targetType, target_id AS targetId, created_at AS createdAt, read_at AS readAt FROM mail_message WHERE recipient_id = ?" + filter + " ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?", user, limit, offset);
        Long total = jdbc.queryForObject("SELECT COUNT(*) FROM mail_message WHERE recipient_id = ?" + filter, Long.class, user);
        return Map.of("list", rows, "total", total == null ? 0 : total);
    }

    public Map<String, Object> counts(int user) {
        Long unread = jdbc.queryForObject("SELECT COUNT(*) FROM mail_message WHERE recipient_id = ? AND read_at IS NULL", Long.class, user);
        Long forumPosts = jdbc.queryForObject("SELECT COUNT(DISTINCT target_id) FROM mail_message WHERE recipient_id = ? AND read_at IS NULL AND target_type = 'forum'", Long.class, user);
        return Map.of("unread", unread == null ? 0 : unread, "forumPosts", forumPosts == null ? 0 : forumPosts);
    }

    public List<Map<String, Object>> unreadForumPosts(int user) {
        return jdbc.queryForList("SELECT target_id AS postId, COUNT(*) AS unread FROM mail_message WHERE recipient_id = ? AND read_at IS NULL AND target_type = 'forum' GROUP BY target_id", user);
    }

    public void read(int user, long id) {
        jdbc.update("UPDATE mail_message SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP) WHERE id = ? AND recipient_id = ?", id, user);
    }

    public void readForumPost(int user, long postId) {
        jdbc.update("UPDATE mail_message SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP) WHERE recipient_id = ? AND target_type = 'forum' AND target_id = ?", user, postId);
    }
}
