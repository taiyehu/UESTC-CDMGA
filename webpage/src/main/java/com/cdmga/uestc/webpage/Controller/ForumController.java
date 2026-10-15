package com.cdmga.uestc.webpage.Controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.UUID;

import com.cdmga.uestc.webpage.Service.ForumService;
import com.cdmga.uestc.webpage.common.Result;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/forum")
public class ForumController {
    @Autowired
    private ForumService service;

    @Value("${forum.upload.directory:/var/webserver/forum/}")
    private String uploadDirectory;

    public record PostRequest(String title, String content) {}
    public record ReplyRequest(Long parentReplyId, String content) {}
    public record ReportRequest(String reason, String detail) {}
    public record ModerateRequest(String decision, String reason) {}

    private Integer viewer(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) return null;
        Object id = session.getAttribute("identityId");
        return id instanceof Integer ? (Integer) id : null;
    }

    private Integer currentUser(HttpServletRequest request) {
        Integer id = viewer(request);
        if (id == null) throw new IllegalArgumentException("请重新登录");
        return id;
    }

    @GetMapping("/posts")
    public Result posts(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size, HttpServletRequest request) {
        try { return Result.success(service.listPosts(page, size, viewer(request))); }
        catch (Exception e) { return Result.error(e.getMessage()); }
    }

    @GetMapping("/posts/{id}")
    public Result post(@PathVariable long id, HttpServletRequest request) {
        try {
            Integer viewer = viewer(request);
            return Result.success(service.post(id, viewer, viewer != null && service.isAdmin(viewer)));
        } catch (Exception e) { return Result.error(e.getMessage()); }
    }

    @PostMapping("/posts")
    public Result createPost(@RequestBody PostRequest body, HttpServletRequest request) {
        try { return Result.success(Map.of("id", service.createPost(currentUser(request), body.title(), body.content()))); }
        catch (Exception e) { return Result.error(e.getMessage()); }
    }

    @PostMapping("/posts/{id}/replies")
    public Result createReply(@PathVariable long id, @RequestBody ReplyRequest body, HttpServletRequest request) {
        try { return Result.success(Map.of("id", service.createReply(currentUser(request), id, body.parentReplyId(), body.content()))); }
        catch (Exception e) { return Result.error(e.getMessage()); }
    }

    @PostMapping("/{type}/{id}/like")
    public Result like(@PathVariable String type, @PathVariable long id, HttpServletRequest request) {
        try { return Result.success(Map.of("liked", service.toggleLike(currentUser(request), type, id))); }
        catch (Exception e) { return Result.error(e.getMessage()); }
    }

    @PostMapping("/{type}/{id}/report")
    public Result report(@PathVariable String type, @PathVariable long id, @RequestBody ReportRequest body, HttpServletRequest request) {
        try {
            service.report(currentUser(request), type, id, body.reason(), body.detail());
            return Result.success("举报已提交，内容已暂时隐藏");
        } catch (Exception e) { return Result.error(e.getMessage()); }
    }

    @PostMapping(path = "/{type}/{id}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Result uploadImage(@PathVariable String type, @PathVariable long id, @RequestParam("image") MultipartFile image, HttpServletRequest request) {
        Path target = null;
        try {
            Integer userId = currentUser(request);
            if (image.isEmpty() || image.getSize() > 5 * 1024 * 1024) throw new IllegalArgumentException("图片大小需在5MB以内");
            byte[] bytes = image.getBytes();
            String extension = imageExtension(bytes);
            String filename = UUID.randomUUID() + "." + extension;
            Path directory = Path.of(uploadDirectory).toAbsolutePath().normalize();
            target = directory.resolve(filename);
            Files.write(target, bytes);
            String url = "/api/forum/media/" + filename;
            service.addImage(userId, type, id, url);
            return Result.success(Map.of("url", url));
        } catch (Exception e) {
            if (target != null) try { Files.deleteIfExists(target); } catch (IOException ignored) {}
            return Result.error(e.getMessage());
        }
    }

    private String imageExtension(byte[] data) {
        if (data.length >= 8 && (data[0] & 255) == 0x89 && data[1] == 'P' && data[2] == 'N' && data[3] == 'G' && data[4] == 13 && data[5] == 10 && data[6] == 26 && data[7] == 10) return "png";
        if (data.length >= 3 && (data[0] & 255) == 0xff && (data[1] & 255) == 0xd8 && (data[2] & 255) == 0xff) return "jpg";
        if (data.length >= 6 && data[0] == 'G' && data[1] == 'I' && data[2] == 'F' && data[3] == '8' && (data[4] == '7' || data[4] == '9') && data[5] == 'a') return "gif";
        throw new IllegalArgumentException("仅支持 PNG、JPEG、GIF 图片");
    }

    @GetMapping("/media/{filename:.+}")
    public ResponseEntity<Resource> image(@PathVariable String filename, HttpServletRequest request) throws IOException {
        if (!filename.matches("[0-9a-f-]{36}\\.(png|jpg|gif)")) return ResponseEntity.notFound().build();
        String url = "/api/forum/media/" + filename;
        if (!service.canViewImage(url, viewer(request))) return ResponseEntity.notFound().build();
        Path target = Path.of(uploadDirectory).toAbsolutePath().normalize().resolve(filename);
        if (!Files.isRegularFile(target)) return ResponseEntity.notFound().build();
        MediaType type = filename.endsWith(".png") ? MediaType.IMAGE_PNG : filename.endsWith(".gif") ? MediaType.parseMediaType("image/gif") : MediaType.IMAGE_JPEG;
        return ResponseEntity.ok().contentType(type).header("X-Content-Type-Options", "nosniff").body(new UrlResource(target.toUri()));
    }

    @GetMapping("/admin/posts")
    public Result adminPosts(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size, HttpServletRequest request) {
        try { return Result.success(service.adminPosts(currentUser(request), page, size)); }
        catch (Exception e) { return Result.error(e.getMessage()); }
    }

    @GetMapping("/admin/reports")
    public Result adminReports(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size, HttpServletRequest request) {
        try { return Result.success(service.adminReports(currentUser(request), page, size)); }
        catch (Exception e) { return Result.error(e.getMessage()); }
    }

    @GetMapping("/admin/{type}/{id}/actions")
    public Result actions(@PathVariable String type, @PathVariable long id, HttpServletRequest request) {
        try { return Result.success(service.adminActions(currentUser(request), type, id)); }
        catch (Exception e) { return Result.error(e.getMessage()); }
    }

    @PostMapping("/admin/{type}/{id}/moderate")
    public Result moderate(@PathVariable String type, @PathVariable long id, @RequestBody ModerateRequest body, HttpServletRequest request) {
        try {
            service.moderate(currentUser(request), type, id, body.decision(), body.reason());
            return Result.success("处理完成");
        } catch (Exception e) { return Result.error(e.getMessage()); }
    }
}
