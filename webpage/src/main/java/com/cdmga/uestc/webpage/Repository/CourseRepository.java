package com.cdmga.uestc.webpage.Repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.cdmga.uestc.webpage.Entity.Course;

@Repository
public interface CourseRepository extends JpaRepository<Course, Integer> {

    // 按照标题查询课程
    List<Course> findByTitleContainingAndIsDeletedFalse(String title);

    // 根据分类查询课程
    Course findByCategoryAndIsDeletedFalse(String category);

    // 获取所有课程
    List<Course> findByIsDeletedFalse();

    // 查找 start_time 最晚且没有超过 end_time 的课程，返回多个
    @Query("SELECT c FROM Course c WHERE c.startTime <= c.endTime AND c.isDeleted = false ORDER BY c.startTime DESC")
    List<Course> findLatestStartTimeCoursesBeforeEndTime();

    // 查找 start_time 最晚且没有超过 end_time 的课程，只返回一个
    @Query("SELECT c FROM Course c WHERE c.startTime <= c.endTime AND c.isDeleted = false ORDER BY c.startTime DESC")
    Course findLatestStartTimeCourseBeforeEndTime();

    @Query("SELECT c FROM Course c WHERE c.startTime <= :currentDateTime AND c.endTime >= :currentDateTime AND c.isDeleted = false ORDER BY c.startTime DESC")
    List<Course> findAvailableCourse(LocalDateTime currentDateTime);
}
