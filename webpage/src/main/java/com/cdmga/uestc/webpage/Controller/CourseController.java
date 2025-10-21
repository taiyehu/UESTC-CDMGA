package com.cdmga.uestc.webpage.Controller;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.nio.file.Path;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.cdmga.uestc.webpage.common.CourseRequest;
import com.cdmga.uestc.webpage.common.Result;
import com.cdmga.uestc.webpage.Entity.Course;
import com.cdmga.uestc.webpage.Service.CourseService;


import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;




@CrossOrigin(origins = "http://localhost:8081")
@RestController
@RequestMapping("/api/course")
public class CourseController {

    @Autowired
    private CourseService courseService;

    // 配置图片存储目录路径
    @Value("${course.upload.directory}")
    private String uploadDir;

    //显示所有课题
    @GetMapping("/")
    public ResponseEntity<List<Course>> getCourse() {
        List<Course> currentCourse = courseService.getAllCourse();
        if(currentCourse != null){
            return ResponseEntity.ok(currentCourse);
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
    }

    //上传课题
    @PostMapping("/post")
    public Result postCourse(@RequestBody CourseRequest courseRequest) {
        //上传课题，包括title, category, end_time, image
        try{
            Course newCourse = courseService.postNewCourse(
            courseRequest.getTitle(), courseRequest.getCategory(),
            courseRequest.getStartTime(), courseRequest.getEndTime(),
            courseRequest.getDescription(), courseRequest.getImage(),
            courseRequest.getCreateTime(), courseRequest.getUpdateTime());
            return Result.success(newCourse);
        } catch (Exception e){
            return Result.error(e.getMessage());
        }
    }

    // 上传图片
    @PostMapping("/upload")
    public Result postImage(@RequestParam("image") MultipartFile image) {
        try {
            // 生成一个唯一的文件名
            String fileName = UUID.randomUUID().toString() + "." + getFileExtension(image.getOriginalFilename());
            Path targetLocation = Paths.get(uploadDir, fileName);

            // 确保文件存储目录存在
            Files.createDirectories(targetLocation.getParent());

            // 保存图片到指定目录
            Files.copy(image.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            // 假设你有一个基础 URL（例如：http://localhost:8081/images/），可以返回相对路径
            String imageUrl = "/images/" + fileName;

            return Result.success(imageUrl);  // 返回图片的URL
        } catch (Exception e) {
            e.printStackTrace();
            return Result.error( e.getMessage());
        }
    }

    // 获取文件扩展名
    private String getFileExtension(String fileName) {
        int index = fileName.lastIndexOf('.');
        if (index == -1) {
            return ""; // 没有扩展名
        }
        return fileName.substring(index + 1);
    }


    @GetMapping("/allcourse")
    public ResponseEntity<Object> getAllCourses(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        List<Course> courses = courseService.getAllCourseByPage(page,size);
        Long total = courseService.countCourse();

        Map<String, Object> result = new HashMap<>();
        result.put("list", courses);
        result.put("total", total);
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{courseId}")
    public ResponseEntity<Void> deleteCourse(@PathVariable Integer courseId) {
        try {
            Course deletedCourse = courseService.deleteCourse(courseId); // 接收 Course 类型
            if (deletedCourse != null) {
                return ResponseEntity.noContent().build(); // 成功：204
            } else {
                return ResponseEntity.notFound().build(); // 失败（课程不存在）：404
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).build(); // 服务器异常：500
        }
    }

    @GetMapping("/availablecourse")
    public ResponseEntity<Object> getAvailableCourses(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        List<Course> courses = courseService.getAvailableCourse(page,size);
        Long total = courseService.countCourse();

        Map<String, Object> result = new HashMap<>();
        result.put("list", courses);
        result.put("total", total);

        return ResponseEntity.ok(result);
    }

    // 删除对应id的课题
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Result> deleteCourseData(@PathVariable Integer id) {
        try {
            Course deletedCourse = courseService.deleteCourse(id);
            if (deletedCourse != null) {
                return ResponseEntity.ok(Result.success(deletedCourse));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Result.error("Course not found"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Result.error(e.getMessage()));
        }
    }

}
