package com.cdmga.uestc.webpage.Service;

import java.time.LocalDateTime;
import java.util.List;

import com.cdmga.uestc.webpage.Entity.Identity;
import com.cdmga.uestc.webpage.Entity.Score;
import com.cdmga.uestc.webpage.Repository.ScoreRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import com.cdmga.uestc.webpage.Entity.Course;
import com.cdmga.uestc.webpage.Repository.CourseRepository;

@Service
public class CourseService {

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private ScoreRepository scoreRepository;

    public List<Course> getCourseByTitle(String title){
        return courseRepository.findByTitleContainingAndIsDeletedFalse(title);
    }

    public Course getCourseByCategory(String category){
        return courseRepository.findByCategoryAndIsDeletedFalse(category);
    }

    // 获取所有未删除的课程
    public List<Course> getAllCourse() {
        return courseRepository.findByIsDeletedFalse();
    }

    public Course getCurrentCourse(){
        return courseRepository.findLatestStartTimeCourseBeforeEndTime();
    }

    public List<Course> getAvailableCourse(int page, int size){
        LocalDateTime currentDateTime = LocalDateTime.now();
        return courseRepository.findAvailableCourse(currentDateTime,PageRequest.of(page,size)).getContent();
    }

    public Long countCourse(){
        return courseRepository.countByIsDeletedFalse();
    }

    public Course postNewCourse(String title, String category,
        LocalDateTime startTime, LocalDateTime endTime,
        String description, String image,
        LocalDateTime created_at, LocalDateTime updated_at
    ){
        Course course = new Course(created_at);
        course.setTitle(title);
        course.setCategory(category);
        course.setStartTime(startTime);
        course.setEndTime(endTime);
        course.setDescription(description);
        course.setImage(image);
        course.setUpdatedAt(updated_at);
        return courseRepository.save(course);
    }

    // 设置课程为删除状态
    public Course deleteCourse(Integer courseId) {
        Course course = courseRepository.findById(courseId).orElse(null);
        if (course != null) {
            List<Score> scores = scoreRepository.findByCourse_Id(courseId);
            for (Score score : scores) {
                score.setIsDeleted(true);
            }
            course.setIsDeleted(true); // 设置课程为已删除状态
            return courseRepository.save(course); // 保存更新后的课程对象
        }
        return null; // 如果课程不存在，返回null
    }

    public List<Course> getAllCourseByPage(int page, int size) {
        // 分页查询未删除的 Identity
        return courseRepository.findByIsDeletedFalse(PageRequest.of(page, size)).getContent();
    }
}
