package com.cdmga.uestc.webpage.Controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cdmga.uestc.webpage.Entity.Course;
import com.cdmga.uestc.webpage.Service.CourseService;

@CrossOrigin(origins = "http://localhost:8081")
@RestController
@RequestMapping("/api/home")
public class HomeController {

    @Autowired
    private CourseService courseService;

    //显示当前课题
    @GetMapping("/")
    public ResponseEntity<List<Course>> getCourse() {
        List<Course> currentCourse = courseService.getAllCourse();
        if(currentCourse != null){
            return ResponseEntity.ok(currentCourse);
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
    }


}
