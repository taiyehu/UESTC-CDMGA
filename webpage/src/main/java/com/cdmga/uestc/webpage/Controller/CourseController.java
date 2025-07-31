package com.cdmga.uestc.webpage.Controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cdmga.uestc.webpage.Common.CourseRequest;
import com.cdmga.uestc.webpage.Common.Result;
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

    @GetMapping("/allcourse")
    public ResponseEntity<List<Course>> getAllCourses() {
        List<Course> courses = courseService.getAllCourse();
        return courses.isEmpty() ? ResponseEntity.notFound().build() : ResponseEntity.ok(courses);
    }

    @DeleteMapping("/{courseId}")
    public ResponseEntity<Void> deleteCourse(@PathVariable Long courseId) {
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
    public ResponseEntity<List<Course>> getAvailableCourses() {
        List<Course> courses = courseService.getAvailableCourse();
        return courses.isEmpty() ? ResponseEntity.notFound().build() : ResponseEntity.ok(courses);
    }

}
