package com.cdmga.uestc.webpage.Controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.UUID;
import java.util.Set;

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
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
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
    private static final Set<String> FILE_EXTENSIONS = Set.of("pdf", "txt", "zip", "doc", "docx", "xls", "xlsx", "ppt", "pptx");

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
    public Result posts(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size, @RequestParam(defaultValue = "false") boolean mine, @RequestParam(defaultValue = "latest") String sort, HttpServletRequest request) {
        try { return Result.success(service.listPosts(page, size, viewer(request), mine, sort)); }
        catch (Exception e) { return Result.error(e.getMessage()); }
    }

    @GetMapping("/posts/{id}")
    public Result post(@PathVariable long id, @RequestParam(defaultValue = "latest") String replySort, HttpServletRequest request) {
        try {
            Integer viewer = viewer(request);
            return Result.success(service.post(id, viewer, viewer != null && service.isAdmin(viewer), replySort));
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

    @PatchMapping("/posts/{id}")
    public Result editPost(@PathVariable long id, @RequestBody PostRequest body, HttpServletRequest request) {
        try { service.editPost(currentUser(request), id, body.title(), body.content()); return Result.success("修改完成"); }
        catch (Exception e) { return Result.error(e.getMessage()); }
    }

    @DeleteMapping("/{type}/{id}")
    public Result deleteContent(@PathVariable String type, @PathVariable long id, HttpServletRequest request) {
        try { service.deleteOwnContent(currentUser(request), type, id); return Result.success("已删除"); }
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

    @DeleteMapping("/images/{id}")
    public Result removeImage(@PathVariable long id, HttpServletRequest request) {
        try {
            String url = service.removeImage(currentUser(request), id);
            Files.deleteIfExists(Path.of(uploadDirectory).toAbsolutePath().normalize().resolve(url.substring(url.lastIndexOf('/') + 1)));
            return Result.success("图片已移除");
        } catch (Exception e) { return Result.error(e.getMessage()); }
    }

    @PostMapping(path = "/posts/{id}/files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Result uploadFile(@PathVariable long id, @RequestParam("file") MultipartFile file, HttpServletRequest request) {
        Path target = null;
        try {
            Integer userId = currentUser(request);
            if (file.isEmpty() || file.getSize() > 10 * 1024 * 1024) throw new IllegalArgumentException("文件大小需在10MB以内");
            String original = file.getOriginalFilename() == null ? "attachment" : file.getOriginalFilename().replace('\\', '/');
            original = original.substring(original.lastIndexOf('/') + 1).replaceAll("[\\p{Cntrl}]", "");
            if (original.length() > 200) throw new IllegalArgumentException("文件名过长");
            int dot = original.lastIndexOf('.');
            String extension = dot < 0 ? "" : original.substring(dot + 1).toLowerCase(java.util.Locale.ROOT);
            if (!FILE_EXTENSIONS.contains(extension)) throw new IllegalArgumentException("仅支持 PDF、TXT、ZIP 和 Office 文件");
            String filename = UUID.randomUUID() + "." + extension;
            target = Path.of(uploadDirectory).toAbsolutePath().normalize().resolve(filename);
            Files.write(target, file.getBytes());
            String url = "/api/forum/file/" + filename;
            service.addFile(userId, id, url, original);
            return Result.success(Map.of("url", url));
        } catch (Exception e) {
            if (target != null) try { Files.deleteIfExists(target); } catch (IOException ignored) {}
            return Result.error(e.getMessage());
        }
    }

    @DeleteMapping("/files/{id}")
    public Result removeFile(@PathVariable long id, HttpServletRequest request) {
        try {
            String url = service.removeFile(currentUser(request), id);
            Files.deleteIfExists(Path.of(uploadDirectory).toAbsolutePath().normalize().resolve(url.substring(url.lastIndexOf('/') + 1)));
            return Result.success("文件已移除");
        } catch (Exception e) { return Result.error(e.getMessage()); }
    }

    @GetMapping("/file/{filename:.+}")
    public ResponseEntity<Resource> file(@PathVariable String filename, HttpServletRequest request) throws IOException {
        if (!filename.matches("[0-9a-f-]{36}\\.[a-z0-9]+")) return ResponseEntity.notFound().build();
        String url = "/api/forum/file/" + filename;
        if (!service.canViewFile(url, viewer(request))) return ResponseEntity.notFound().build();
        Path target = Path.of(uploadDirectory).toAbsolutePath().normalize().resolve(filename);
        if (!Files.isRegularFile(target)) return ResponseEntity.notFound().build();
        String original = service.originalFileName(url);
        String encodedName = java.net.URLEncoder.encode(original, java.nio.charset.StandardCharsets.UTF_8).replace("+", "%20");
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_OCTET_STREAM)
            .header("Content-Disposition", "attachment; filename=\"" + filename + "\"; filename*=UTF-8''" + encodedName)
            .header("X-Content-Type-Options", "nosniff").body(new UrlResource(target.toUri()));
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

    @GetMapping("/admin/{type}/{id}/edits")
    public Result edits(@PathVariable String type, @PathVariable long id, HttpServletRequest request) {
        try { return Result.success(service.adminEdits(currentUser(request), type, id)); }
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
