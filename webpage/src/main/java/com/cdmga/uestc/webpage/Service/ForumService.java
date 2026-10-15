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

    public Map<String, Object> listPosts(int page, int size, Integer viewer, boolean mine) {
        int limit = size(size);
        if (mine && viewer == null) throw new IllegalArgumentException("请重新登录");
        String filter = mine ? "p.author_id = ?" : "p.status = 'visible'";
        List<Map<String, Object>> posts = mine
            ? jdbc.queryForList("SELECT " + POST_FIELDS + ", EXISTS(SELECT 1 FROM forum_post_like l WHERE l.post_id = p.id AND l.identity_id = ?) AS liked FROM forum_post p JOIN identity i ON i.id = p.author_id WHERE " + filter + " ORDER BY p.created_at DESC, p.id DESC LIMIT ? OFFSET ?", viewer, viewer, limit, page(page) * limit)
            : jdbc.queryForList("SELECT " + POST_FIELDS + ", EXISTS(SELECT 1 FROM forum_post_like l WHERE l.post_id = p.id AND l.identity_id = ?) AS liked FROM forum_post p JOIN identity i ON i.id = p.author_id WHERE " + filter + " ORDER BY p.created_at DESC, p.id DESC LIMIT ? OFFSET ?", viewer, limit, page(page) * limit);
        posts.forEach(post -> {
            long id = ((Number) post.get("id")).longValue();
            post.put("images", images("post", id));
            post.put("files", files(id));
        });
        Long total = mine ? jdbc.queryForObject("SELECT COUNT(*) FROM forum_post WHERE author_id = ?", Long.class, viewer) : jdbc.queryForObject("SELECT COUNT(*) FROM forum_post WHERE status = 'visible'", Long.class);
        return Map.of("list", posts, "total", total == null ? 0 : total);
    }

    public Map<String, Object> post(long postId, Integer viewer, boolean admin) {
        String statusFilter = admin ? "" : " AND (p.status = 'visible' OR (p.status = 'hidden' AND p.author_id = ?))";
        Map<String, Object> post = admin
            ? one("SELECT " + POST_FIELDS + ", EXISTS(SELECT 1 FROM forum_post_like l WHERE l.post_id = p.id AND l.identity_id = ?) AS liked FROM forum_post p JOIN identity i ON i.id = p.author_id WHERE p.id = ?", viewer, postId)
            : one("SELECT " + POST_FIELDS + ", EXISTS(SELECT 1 FROM forum_post_like l WHERE l.post_id = p.id AND l.identity_id = ?) AS liked FROM forum_post p JOIN identity i ON i.id = p.author_id WHERE p.id = ?" + statusFilter, viewer, postId, viewer);
        post.put("images", images("post", postId));
        post.put("files", files(postId));
        String replyFilter = admin ? "" : " AND (r.status = 'visible' OR (r.status = 'hidden' AND (r.author_id = ? OR ? = (SELECT author_id FROM forum_post WHERE id = r.post_id))))";
        List<Map<String, Object>> replies = admin
            ? jdbc.queryForList("SELECT " + REPLY_FIELDS + ", EXISTS(SELECT 1 FROM forum_reply_like l WHERE l.reply_id = r.id AND l.identity_id = ?) AS liked FROM forum_reply r JOIN identity i ON i.id = r.author_id WHERE r.post_id = ? ORDER BY r.created_at, r.id", viewer, postId)
            : jdbc.queryForList("SELECT " + REPLY_FIELDS + ", EXISTS(SELECT 1 FROM forum_reply_like l WHERE l.reply_id = r.id AND l.identity_id = ?) AS liked FROM forum_reply r JOIN identity i ON i.id = r.author_id WHERE r.post_id = ?" + replyFilter + " ORDER BY r.created_at, r.id", viewer, postId, viewer, viewer);
        replies.forEach(reply -> reply.put("images", images("reply", ((Number) reply.get("id")).longValue())));
        post.put("replies", replies);
        return post;
    }

    public List<Map<String, Object>> images(String type, long id) {
        return jdbc.queryForList("SELECT id, storage_path AS url FROM forum_image WHERE " + targetColumn(type) + " = ? ORDER BY sort_order, id", id);
    }

    public List<Map<String, Object>> files(long postId) {
        return jdbc.queryForList("SELECT id, storage_path AS url, original_name AS name FROM forum_file WHERE post_id = ? ORDER BY id", postId);
    }

    public boolean canViewImage(String path, Integer viewer) {
        if (viewer != null && isAdmin(viewer)) {
            Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM forum_image WHERE storage_path = ?", Integer.class, path);
            return count != null && count > 0;
        }
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM forum_image im LEFT JOIN forum_post p ON p.id = im.post_id LEFT JOIN forum_reply r ON r.id = im.reply_id LEFT JOIN forum_post rp ON rp.id = r.post_id WHERE im.storage_path = ? AND ((p.status = 'visible' OR (p.status = 'hidden' AND p.author_id = ?)) OR (r.status = 'visible' AND rp.status = 'visible') OR (r.status = 'hidden' AND rp.status <> 'deleted' AND (r.author_id = ? OR rp.author_id = ?)))", Integer.class, path, viewer, viewer, viewer);
        return count != null && count > 0;
    }

    public boolean canViewFile(String path, Integer viewer) {
        Integer count = viewer != null && isAdmin(viewer)
            ? jdbc.queryForObject("SELECT COUNT(*) FROM forum_file WHERE storage_path = ?", Integer.class, path)
            : jdbc.queryForObject("SELECT COUNT(*) FROM forum_file f JOIN forum_post p ON p.id = f.post_id WHERE f.storage_path = ? AND (p.status = 'visible' OR (p.status = 'hidden' AND p.author_id = ?))", Integer.class, path, viewer);
        return count != null && count > 0;
    }

    public String originalFileName(String path) {
        Map<String, Object> row = one("SELECT original_name AS name FROM forum_file WHERE storage_path = ?", path);
        return (String) row.get("name");
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
        if ("reply".equals(type)) one("SELECT p.id FROM forum_reply r JOIN forum_post p ON p.id = r.post_id WHERE r.id = ? AND p.status = 'visible'", id);
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM forum_image WHERE " + targetColumn(type) + " = ?", Integer.class, id);
        int max = "post".equals(type) ? 6 : 1;
        if (count != null && count >= max) throw new IllegalArgumentException("图片数量已达上限");
        jdbc.update("INSERT INTO forum_image (" + targetColumn(type) + ", storage_path, sort_order) VALUES (?, ?, ?)", id, path, count == null ? 0 : count);
    }

    @Transactional
    public void addFile(Integer userId, long postId, String path, String originalName) {
        Map<String, Object> post = one("SELECT author_id AS authorId, status FROM forum_post WHERE id = ? FOR UPDATE", postId);
        if (((Number) post.get("authorId")).intValue() != userId || !"visible".equals(post.get("status"))) throw new IllegalArgumentException("只能给自己的可见帖子添加文件");
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM forum_file WHERE post_id = ?", Integer.class, postId);
        if (count != null && count >= 3) throw new IllegalArgumentException("帖子最多添加3个文件");
        jdbc.update("INSERT INTO forum_file (post_id, storage_path, original_name) VALUES (?, ?, ?)", postId, path, originalName);
    }

    @Transactional
    public String removeImage(Integer userId, long imageId) {
        Map<String, Object> image = one("SELECT im.storage_path AS path, COALESCE(p.author_id, r.author_id) AS authorId, COALESCE(p.status, r.status) AS status, rp.status AS postStatus FROM forum_image im LEFT JOIN forum_post p ON p.id = im.post_id LEFT JOIN forum_reply r ON r.id = im.reply_id LEFT JOIN forum_post rp ON rp.id = r.post_id WHERE im.id = ? FOR UPDATE", imageId);
        if (((Number) image.get("authorId")).intValue() != userId || !"visible".equals(image.get("status")) || (image.get("postStatus") != null && !"visible".equals(image.get("postStatus")))) throw new IllegalArgumentException("只能移除自己可见内容的图片");
        jdbc.update("DELETE FROM forum_image WHERE id = ?", imageId);
        return (String) image.get("path");
    }

    @Transactional
    public String removeFile(Integer userId, long fileId) {
        Map<String, Object> file = one("SELECT f.storage_path AS path, p.author_id AS authorId, p.status FROM forum_file f JOIN forum_post p ON p.id = f.post_id WHERE f.id = ? FOR UPDATE", fileId);
        if (((Number) file.get("authorId")).intValue() != userId || !"visible".equals(file.get("status"))) throw new IllegalArgumentException("只能移除自己可见帖子的文件");
        jdbc.update("DELETE FROM forum_file WHERE id = ?", fileId);
        return (String) file.get("path");
    }

    @Transactional
    public void editPost(Integer userId, long postId, String title, String content) {
        String cleanTitle = title == null ? "" : title.trim();
        String cleanContent = content == null ? "" : content.trim();
        if (cleanTitle.isEmpty() || cleanTitle.length() > 120 || cleanContent.isEmpty() || cleanContent.length() > 10000) throw new IllegalArgumentException("标题需为1至120字，正文需为1至10000字");
        Map<String, Object> old = one("SELECT author_id AS authorId, title, content, status FROM forum_post WHERE id = ? FOR UPDATE", postId);
        if (((Number) old.get("authorId")).intValue() != userId || !"visible".equals(old.get("status"))) throw new IllegalArgumentException("只能修改自己的可见帖子");
        jdbc.update("INSERT INTO forum_edit_history (post_id, editor_id, old_title, new_title, old_content, new_content) VALUES (?, ?, ?, ?, ?, ?)", postId, userId, old.get("title"), cleanTitle, old.get("content"), cleanContent);
        jdbc.update("UPDATE forum_post SET title = ?, content = ? WHERE id = ?", cleanTitle, cleanContent, postId);
    }

    @Transactional
    public void editReply(Integer userId, long replyId, String content) {
        String cleanContent = content == null ? "" : content.trim();
        if (cleanContent.isEmpty() || cleanContent.length() > 3000) throw new IllegalArgumentException("回复需为1至3000字");
        Map<String, Object> old = one("SELECT r.author_id AS authorId, r.content, r.status, p.status AS postStatus FROM forum_reply r JOIN forum_post p ON p.id = r.post_id WHERE r.id = ? FOR UPDATE", replyId);
        if (((Number) old.get("authorId")).intValue() != userId || !"visible".equals(old.get("status")) || !"visible".equals(old.get("postStatus"))) throw new IllegalArgumentException("只能修改自己的可见回复");
        jdbc.update("INSERT INTO forum_edit_history (reply_id, editor_id, old_content, new_content) VALUES (?, ?, ?, ?)", replyId, userId, old.get("content"), cleanContent);
        jdbc.update("UPDATE forum_reply SET content = ? WHERE id = ?", cleanContent, replyId);
    }

    @Transactional
    public void deleteOwnContent(Integer userId, String type, long id) {
        Map<String, Object> target = "post".equals(type)
            ? one("SELECT author_id AS authorId, status FROM forum_post WHERE id = ? FOR UPDATE", id)
            : one("SELECT r.author_id AS authorId, p.author_id AS postAuthorId, r.status FROM forum_reply r JOIN forum_post p ON p.id = r.post_id WHERE r.id = ? FOR UPDATE", id);
        if ("deleted".equals(target.get("status"))) throw new IllegalArgumentException("内容已删除");
        boolean own = ((Number) target.get("authorId")).intValue() == userId;
        boolean postOwner = "reply".equals(type) && ((Number) target.get("postAuthorId")).intValue() == userId;
        if (!own && !postOwner) throw new IllegalArgumentException("没有删除权限");
        String previous = (String) target.get("status");
        jdbc.update("UPDATE " + table(type) + " SET status = 'deleted', deleted_at = CURRENT_TIMESTAMP WHERE id = ?", id);
        jdbc.update("UPDATE forum_report SET status = 'deleted', handled_by = ?, handled_at = CURRENT_TIMESTAMP WHERE " + targetColumn(type) + " = ? AND status = 'pending'", userId, id);
        action(type, id, userId, postOwner && !own ? "post_owner_delete" : "author_delete", "用户主动删除", previous, "deleted");
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

    public List<Map<String, Object>> adminEdits(Integer adminId, String type, long id) {
        requireAdmin(adminId);
        return jdbc.queryForList("SELECT e.id, e.editor_id AS editorId, i.account AS editorName, e.old_title AS oldTitle, e.new_title AS newTitle, e.old_content AS oldContent, e.new_content AS newContent, e.created_at AS createdAt FROM forum_edit_history e JOIN identity i ON i.id = e.editor_id WHERE e." + targetColumn(type) + " = ? ORDER BY e.id DESC", id);
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
