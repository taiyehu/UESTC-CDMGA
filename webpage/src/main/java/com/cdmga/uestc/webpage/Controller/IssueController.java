package com.cdmga.uestc.webpage.Controller;

import com.cdmga.uestc.webpage.Entity.Issue;
import com.cdmga.uestc.webpage.Service.IssueService;
import com.cdmga.uestc.webpage.common.IssueRequest;
import com.cdmga.uestc.webpage.common.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@CrossOrigin(origins = "https://localhost:8081")
@RestController
@RequestMapping("/api/issue")
public class IssueController {

    @Autowired
    private IssueService issueService;

    @Value("${course.upload.directory}")
    private String imageUploadDir;

    @Value("${activity.upload.file-directory}")
    private String fileUploadDir;

    @GetMapping("/course/{courseId}")
    public ResponseEntity<Object> getCourseIssues(
            @PathVariable Integer courseId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        try {
            Page<Issue> issues = issueService.getCourseIssues(courseId, page, size);
            Map<String, Object> result = new HashMap<>();
            result.put("list", issues.getContent());
            result.put("total", issues.getTotalElements());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Result.error(e.getMessage()));
        }
    }

    @PostMapping("/course/{courseId}/upsert")
    public ResponseEntity<Result> upsertIssue(@PathVariable Integer courseId, @RequestBody IssueRequest request) {
        try {
            Issue issue = issueService.upsertIssue(
                    courseId,
                    request.getIssue_id(),
                    request.getImage(),
                    request.getText(),
                    request.getFile(),
                    request.getSong_name()
            );
            return ResponseEntity.ok(Result.success(issue));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Result.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Result.error(e.getMessage()));
        }
    }

    @PostMapping("/upload-image")
    public Result uploadIssueImage(
            @RequestParam("image") MultipartFile image,
            @RequestParam("courseId") Integer courseId
    ) {
        try {
            String fileName = UUID.randomUUID().toString() + "." + getFileExtension(image.getOriginalFilename());
            Path targetLocation = Paths.get(imageUploadDir, "course", String.valueOf(courseId), "issue", fileName);
            Files.createDirectories(targetLocation.getParent());
            Files.copy(image.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            return Result.success("/image/course/" + courseId + "/issue/" + fileName);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/upload-file")
    public Result uploadIssueFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("courseId") Integer courseId
    ) {
        try {
            String fileName = UUID.randomUUID().toString() + "." + getFileExtension(file.getOriginalFilename());
            Path targetLocation = Paths.get(fileUploadDir, "course", String.valueOf(courseId), "issue", fileName);
            Files.createDirectories(targetLocation.getParent());
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            return Result.success("/files/course/" + courseId + "/issue/" + fileName);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    private String getFileExtension(String fileName) {
        int index = fileName == null ? -1 : fileName.lastIndexOf('.');
        if (index == -1) {
            return "dat";
        }
        return fileName.substring(index + 1);
    }
}
