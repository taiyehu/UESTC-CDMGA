package com.cdmga.uestc.webpage.Controller;

import com.cdmga.uestc.webpage.Entity.Activity;
import com.cdmga.uestc.webpage.Service.ActivityService;
import com.cdmga.uestc.webpage.common.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.nio.file.Path;
import java.util.*;

@RestController
@RequestMapping("/api/activity")
public class ActivityController {

    @Autowired
    private ActivityService activityService;

    @Value("${activity.upload.banner-directory}")
    private String bannerUploadDir;

    @Value("${activity.upload.file-directory}")
    private String fileUploadDir;

    // 上传活动banner图片
    @PostMapping("/uploadBanner")
    public Result uploadBanner(@RequestParam("banner") MultipartFile banner) {
        try {
            String fileName = UUID.randomUUID().toString() + "." + getFileExtension(banner.getOriginalFilename());
            Path targetLocation = Paths.get(bannerUploadDir, fileName);
            Files.createDirectories(targetLocation.getParent());
            Files.copy(banner.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            String imageUrl = "/activity/banner/" + fileName;
            return Result.success(imageUrl);
        } catch (Exception e) {
            e.printStackTrace();
            return Result.error(e.getMessage());
        }
    }

    // 上传活动文件
    @PostMapping("/uploadFile")
    public Result uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            String fileName = UUID.randomUUID().toString() + "." + getFileExtension(file.getOriginalFilename());
            Path targetLocation = Paths.get(fileUploadDir, fileName);
            Files.createDirectories(targetLocation.getParent());
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            String fileUrl = "/activity/file/" + fileName;
            return Result.success(fileUrl);
        } catch (Exception e) {
            e.printStackTrace();
            return Result.error(e.getMessage());
        }
    }

    // 新增活动
    @PostMapping("/post")
    public Result postActivity(@RequestBody Activity activity) {
        try {
            activity.setCreatedAt(java.time.LocalDateTime.now());
            activity.setUpdatedAt(java.time.LocalDateTime.now());
            activity.setIsDeleted(false);
            Activity saved = activityService.save(activity);
            return Result.success(saved);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    // 分页获取活动列表
    @GetMapping("/list")
    public ResponseEntity<Object> getAllActivities(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        List<Activity> activities = activityService.getAllActivitiesByPage(page, size);
        Long total = activityService.countActivities();

        Map<String, Object> result = new HashMap<>();
        result.put("list", activities);
        result.put("total", total);
        return ResponseEntity.ok(result);
    }

    // 获取所有活动（不分页）
    @GetMapping("/all")
    public ResponseEntity<List<Activity>> getAllActivities() {
        List<Activity> activities = activityService.findAll();
        return ResponseEntity.ok(activities);
    }

    // 根据ID获取活动
    @GetMapping("/{id}")
    public ResponseEntity<Activity> getActivityById(@PathVariable Integer id) {
        Optional<Activity> activity = activityService.findById(id);
        return activity.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(null));
    }

    // 删除活动
    @DeleteMapping("/{id}")
    public ResponseEntity<Result> deleteActivity(@PathVariable Integer id) {
        try {
            activityService.deleteById(id);
            return ResponseEntity.ok(Result.success("删除成功"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Result.error(e.getMessage()));
        }
    }

    // 获取文件扩展名
    private String getFileExtension(String fileName) {
        int index = fileName.lastIndexOf('.');
        if (index == -1) {
            return "";
        }
        return fileName.substring(index + 1);
    }
}