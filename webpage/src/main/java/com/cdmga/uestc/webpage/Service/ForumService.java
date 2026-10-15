package com.cdmga.uestc.webpage.Service;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ForumService {
    @Autowired
    private JdbcTemplate jdbc;

    private static final String POST_FIELDS = "p.id, p.author_id AS authorId, i.account AS authorName, p.title, p.content, p.status, p.created_at AS createdAt, p.updated_at AS updatedAt, (SELECT pr.avatar FROM profile pr WHERE pr.identity_id = i.id AND pr.status = 1 ORDER BY pr.id DESC LIMIT 1) AS avatar, (SELECT COUNT(*) FROM forum_post_like l WHERE l.post_id = p.id) AS likeCount, (SELECT COUNT(*) FROM forum_reply r WHERE r.post_id = p.id AND r.status = 'visible') AS replyCount";
    private static final String REPLY_FIELDS = "r.id, r.post_id AS postId, r.parent_reply_id AS parentReplyId, r.author_id AS authorId, i.account AS authorName, r.content, r.status, r.created_at AS createdAt, (SELECT pr.avatar FROM profile pr WHERE pr.identity_id = i.id AND pr.status = 1 ORDER BY pr.id DESC LIMIT 1) AS avatar, (SELECT COUNT(*) FROM forum_reply_like l WHERE l.reply_id = r.id) AS likeCount";

    private int page(int page) { return Math.max(0, page); }
    private int size(int size) { return Math.min(50, Math.max(1, size)); }

    private Map<String, Object> one(String sql, Object... args) {
        List<Map<String, Object>> rows = jdbc.queryForList(sql, args);
        if (rows.isEmpty()) throw new IllegalArgumentException("内容不存在或不可查看");
        return rows.get(0);
    }

    private String table(String type) {
        return switch (type) {
            case "post" -> "forum_post";
            case "reply" -> "forum_reply";
            default -> throw new IllegalArgumentException("内容类型无效");
        };
    }

    private String targetColumn(String type) {
        table(type);
        return type + "_id";
    }

    private void requireActiveUser(Integer id) {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM identity WHERE id = ? AND is_deleted = 0", Integer.class, id);
        if (count == null || count == 0) throw new IllegalArgumentException("用户不存在或已注销");
    }

    public boolean isAdmin(Integer id) {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM identity WHERE id = ? AND role = 'admin' AND is_deleted = 0", Integer.class, id);
        return count != null && count > 0;
    }

    private void requireAdmin(Integer id) {
        if (!isAdmin(id)) throw new IllegalArgumentException("需要管理员权限");
    }

    public Map<String, Object> listPosts(int page, int size, Integer viewer) {
        int limit = size(size);
        List<Map<String, Object>> posts = jdbc.queryForList("SELECT " + POST_FIELDS + ", EXISTS(SELECT 1 FROM forum_post_like l WHERE l.post_id = p.id AND l.identity_id = ?) AS liked FROM forum_post p JOIN identity i ON i.id = p.author_id WHERE p.status = 'visible' ORDER BY p.created_at DESC, p.id DESC LIMIT ? OFFSET ?", viewer, limit, page(page) * limit);
        posts.forEach(post -> post.put("images", images("post", ((Number) post.get("id")).longValue())));
        Long total = jdbc.queryForObject("SELECT COUNT(*) FROM forum_post WHERE status = 'visible'", Long.class);
        return Map.of("list", posts, "total", total == null ? 0 : total);
    }

    public Map<String, Object> post(long postId, Integer viewer, boolean admin) {
        String statusFilter = admin ? "" : " AND p.status = 'visible'";
        Map<String, Object> post = one("SELECT " + POST_FIELDS + ", EXISTS(SELECT 1 FROM forum_post_like l WHERE l.post_id = p.id AND l.identity_id = ?) AS liked FROM forum_post p JOIN identity i ON i.id = p.author_id WHERE p.id = ?" + statusFilter, viewer, postId);
        post.put("images", images("post", postId));
        String replyFilter = admin ? "" : " AND r.status = 'visible'";
        List<Map<String, Object>> replies = jdbc.queryForList("SELECT " + REPLY_FIELDS + ", EXISTS(SELECT 1 FROM forum_reply_like l WHERE l.reply_id = r.id AND l.identity_id = ?) AS liked FROM forum_reply r JOIN identity i ON i.id = r.author_id WHERE r.post_id = ?" + replyFilter + " ORDER BY r.created_at, r.id", viewer, postId);
        replies.forEach(reply -> reply.put("images", images("reply", ((Number) reply.get("id")).longValue())));
        post.put("replies", replies);
        return post;
    }

    public List<Map<String, Object>> images(String type, long id) {
        return jdbc.queryForList("SELECT id, storage_path AS url FROM forum_image WHERE " + targetColumn(type) + " = ? ORDER BY sort_order, id", id);
    }

    public boolean canViewImage(String path, Integer viewer) {
        if (viewer != null && isAdmin(viewer)) {
            Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM forum_image WHERE storage_path = ?", Integer.class, path);
            return count != null && count > 0;
        }
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM forum_image im LEFT JOIN forum_post p ON p.id = im.post_id LEFT JOIN forum_reply r ON r.id = im.reply_id LEFT JOIN forum_post rp ON rp.id = r.post_id WHERE im.storage_path = ? AND ((p.status = 'visible') OR (r.status = 'visible' AND rp.status = 'visible'))", Integer.class, path);
        return count != null && count > 0;
    }

    @Transactional
    public long createPost(Integer userId, String title, String content) {
        requireActiveUser(userId);
        String cleanTitle = title == null ? "" : title.trim();
        String cleanContent = content == null ? "" : content.trim();
        if (cleanTitle.isEmpty() || cleanTitle.length() > 120 || cleanContent.isEmpty() || cleanContent.length() > 10000) throw new IllegalArgumentException("标题需为1至120字，正文需为1至10000字");
        KeyHolder key = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            var statement = connection.prepareStatement("INSERT INTO forum_post (author_id, title, content) VALUES (?, ?, ?)", new String[]{"id"});
            statement.setInt(1, userId);
            statement.setString(2, cleanTitle);
            statement.setString(3, cleanContent);
            return statement;
        }, key);
        return key.getKey().longValue();
    }

    @Transactional
    public long createReply(Integer userId, long postId, Long parentReplyId, String content) {
        requireActiveUser(userId);
        String cleanContent = content == null ? "" : content.trim();
        if (cleanContent.isEmpty() || cleanContent.length() > 3000) throw new IllegalArgumentException("回复需为1至3000字");
        one("SELECT id FROM forum_post WHERE id = ? AND status = 'visible' FOR UPDATE", postId);
        if (parentReplyId != null) one("SELECT id FROM forum_reply WHERE id = ? AND post_id = ? AND status = 'visible'", parentReplyId, postId);
        KeyHolder key = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            var statement = connection.prepareStatement("INSERT INTO forum_reply (post_id, parent_reply_id, author_id, content) VALUES (?, ?, ?, ?)", new String[]{"id"});
            statement.setLong(1, postId);
            if (parentReplyId == null) statement.setNull(2, java.sql.Types.BIGINT);
            else statement.setLong(2, parentReplyId);
            statement.setInt(3, userId);
            statement.setString(4, cleanContent);
            return statement;
        }, key);
        return key.getKey().longValue();
    }

    @Transactional
    public void addImage(Integer userId, String type, long id, String path) {
        Map<String, Object> target = one("SELECT author_id AS authorId, status FROM " + table(type) + " WHERE id = ? FOR UPDATE", id);
        if (((Number) target.get("authorId")).intValue() != userId || !"visible".equals(target.get("status"))) throw new IllegalArgumentException("只能给自己的可见内容添加图片");
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM forum_image WHERE " + targetColumn(type) + " = ?", Integer.class, id);
        int max = "post".equals(type) ? 6 : 1;
        if (count != null && count >= max) throw new IllegalArgumentException("图片数量已达上限");
        jdbc.update("INSERT INTO forum_image (" + targetColumn(type) + ", storage_path, sort_order) VALUES (?, ?, ?)", id, path, count == null ? 0 : count);
    }

    @Transactional
    public boolean toggleLike(Integer userId, String type, long id) {
        requireActiveUser(userId);
        one("SELECT id FROM " + table(type) + " WHERE id = ? AND status = 'visible'", id);
        if ("reply".equals(type)) one("SELECT p.id FROM forum_reply r JOIN forum_post p ON p.id = r.post_id WHERE r.id = ? AND p.status = 'visible'", id);
        String likeTable = "forum_" + type + "_like";
        String column = targetColumn(type);
        int removed = jdbc.update("DELETE FROM " + likeTable + " WHERE " + column + " = ? AND identity_id = ?", id, userId);
        if (removed > 0) return false;
        jdbc.update("INSERT IGNORE INTO " + likeTable + " (" + column + ", identity_id) VALUES (?, ?)", id, userId);
        return true;
    }

    @Transactional
    public void report(Integer userId, String type, long id, String reason, String detail) {
        requireActiveUser(userId);
        String cleanReason = reason == null ? "" : reason.trim();
        if (cleanReason.isEmpty() || cleanReason.length() > 100 || (detail != null && detail.length() > 500)) throw new IllegalArgumentException("举报原因需为1至100字，补充说明不超过500字");
        Map<String, Object> target = one("SELECT author_id AS authorId, status FROM " + table(type) + " WHERE id = ? FOR UPDATE", id);
        if (((Number) target.get("authorId")).intValue() == userId) throw new IllegalArgumentException("不能举报自己的内容");
        if (!"visible".equals(target.get("status"))) throw new IllegalArgumentException("内容当前不可举报");
        if ("reply".equals(type)) one("SELECT p.id FROM forum_reply r JOIN forum_post p ON p.id = r.post_id WHERE r.id = ? AND p.status = 'visible'", id);
        String column = targetColumn(type);
        Integer existing = jdbc.queryForObject("SELECT COUNT(*) FROM forum_report WHERE " + column + " = ? AND reporter_id = ?", Integer.class, id, userId);
        if (existing != null && existing > 0) throw new IllegalArgumentException("你已举报过此内容");
        jdbc.update("INSERT INTO forum_report (" + column + ", reporter_id, reason, detail) VALUES (?, ?, ?, ?)", id, userId, cleanReason, detail);
        jdbc.update("UPDATE " + table(type) + " SET status = 'hidden' WHERE id = ?", id);
        action(type, id, null, "auto_hide", cleanReason, "visible", "hidden");
    }

    private void action(String type, long id, Integer operatorId, String action, String reason, String oldStatus, String newStatus) {
        jdbc.update("INSERT INTO forum_moderation_action (" + targetColumn(type) + ", operator_id, action, reason, previous_status, new_status) VALUES (?, ?, ?, ?, ?, ?)", id, operatorId, action, reason, oldStatus, newStatus);
    }

    public Map<String, Object> adminPosts(Integer adminId, int page, int size) {
        requireAdmin(adminId);
        int limit = size(size);
        List<Map<String, Object>> posts = jdbc.queryForList("SELECT " + POST_FIELDS + " FROM forum_post p JOIN identity i ON i.id = p.author_id ORDER BY p.created_at DESC, p.id DESC LIMIT ? OFFSET ?", limit, page(page) * limit);
        Long total = jdbc.queryForObject("SELECT COUNT(*) FROM forum_post", Long.class);
        return Map.of("list", posts, "total", total == null ? 0 : total);
    }

    public Map<String, Object> adminReports(Integer adminId, int page, int size) {
        requireAdmin(adminId);
        int limit = size(size);
        List<Map<String, Object>> reports = jdbc.queryForList("SELECT r.id, r.post_id AS postId, r.reply_id AS replyId, fr.post_id AS replyPostId, r.reporter_id AS reporterId, i.account AS reporterName, r.reason, r.detail, r.status, r.created_at AS createdAt, r.handled_at AS handledAt, r.handled_by AS handledBy, COALESCE(p.title, LEFT(fr.content, 80)) AS targetText FROM forum_report r JOIN identity i ON i.id = r.reporter_id LEFT JOIN forum_post p ON p.id = r.post_id LEFT JOIN forum_reply fr ON fr.id = r.reply_id ORDER BY (r.status = 'pending') DESC, r.created_at DESC, r.id DESC LIMIT ? OFFSET ?", limit, page(page) * limit);
        Long total = jdbc.queryForObject("SELECT COUNT(*) FROM forum_report", Long.class);
        return Map.of("list", reports, "total", total == null ? 0 : total);
    }

    public List<Map<String, Object>> adminActions(Integer adminId, String type, long id) {
        requireAdmin(adminId);
        return jdbc.queryForList("SELECT a.id, a.operator_id AS operatorId, i.account AS operatorName, a.action, a.reason, a.previous_status AS previousStatus, a.new_status AS newStatus, a.created_at AS createdAt FROM forum_moderation_action a LEFT JOIN identity i ON i.id = a.operator_id WHERE a." + targetColumn(type) + " = ? ORDER BY a.id DESC", id);
    }

    @Transactional
    public void moderate(Integer adminId, String type, long id, String decision, String reason) {
        requireAdmin(adminId);
        if (!"retain".equals(decision) && !"delete".equals(decision)) throw new IllegalArgumentException("处理决定无效");
        Map<String, Object> target = one("SELECT status FROM " + table(type) + " WHERE id = ? FOR UPDATE", id);
        String previous = (String) target.get("status");
        if ("deleted".equals(previous)) throw new IllegalArgumentException("已删除内容不能恢复");
        String next = "retain".equals(decision) ? "visible" : "deleted";
        if ("delete".equals(decision)) jdbc.update("UPDATE " + table(type) + " SET status = ?, deleted_at = CURRENT_TIMESTAMP WHERE id = ?", next, id);
        else jdbc.update("UPDATE " + table(type) + " SET status = ? WHERE id = ?", next, id);
        jdbc.update("UPDATE forum_report SET status = ?, handled_by = ?, handled_at = CURRENT_TIMESTAMP WHERE " + targetColumn(type) + " = ? AND status = 'pending'", "retain".equals(decision) ? "retained" : "deleted", adminId, id);
        action(type, id, adminId, decision, reason, previous, next);
    }
}
