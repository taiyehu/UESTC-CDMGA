package com.cdmga.uestc.webpage.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.cdmga.uestc.webpage.Entity.*;
import com.cdmga.uestc.webpage.Repository.ActivityRepository;
import com.cdmga.uestc.webpage.Repository.AwardRepository;
import com.cdmga.uestc.webpage.Repository.ScoreRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cdmga.uestc.webpage.Repository.CourseRepository;

@Service
public class CourseService {

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private AwardRepository awardRepository;

    @Autowired
    private ScoreRepository scoreRepository;

    @Autowired
    private ActivityService activityService;

    public List<Course> getCourseByTitle(String title){
        return courseRepository.findByTitleContainingAndIsDeletedFalse(title);
    }

    public Course getCourseByCategory(String category){
        return courseRepository.findByCategoryAndIsDeletedFalse(category);
    }

    public Course getCourseById(Integer id) {
        return courseRepository.findByIdAndIsDeletedFalse(id);
    }

    // 获取所有未删除的课程
    public List<Course> getAllCourse() {
        return courseRepository.findByIsDeletedFalse();
    }

    public List<Course> getStandaloneCourses() {
        return courseRepository.findStandaloneCourses();
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

    @Transactional
    public Course postNewCourse(String title, String category,
        LocalDateTime startTime, LocalDateTime endTime,
        String description, String image, Integer awardCost, Integer awardStock
    ){
        validateAwardCost(category, awardCost);
        int stock = validateAwardStock(category, awardStock);
        LocalDateTime now = LocalDateTime.now();
        Course course = new Course(now);
        course.setTitle(title);
        course.setCategory(category);
        course.setStartTime(startTime);
        course.setEndTime(endTime);
        course.setDescription(description);
        course.setImage(image);
        course.setUpdatedAt(now);
        Course savedCourse = courseRepository.save(course);
        if (isAwardCategory(category)) {
            Award award = new Award();
            award.setCourse(savedCourse);
            award.setCost(awardCost);
            award.setTotalStock(stock);
            award.setRemainingStock(stock);
            award.setCreatedAt(now);
            award.setUpdatedAt(now);
            awardRepository.save(award);
            savedCourse.setAward(award);
        }
        return savedCourse;
    }

    @Transactional
    public Course updateCourse(
        Integer courseId,
        String title,
        String category,
        LocalDateTime startTime,
        LocalDateTime endTime,
        String description,
        String image,
        Integer awardCost,
        Integer awardStock
    ) {
        Course course = courseRepository.findById(courseId).orElse(null);
        if (course == null || Boolean.TRUE.equals(course.getIsDeleted())) {
            return null;
        }

        validateAwardCost(category, awardCost);
        boolean wasAward = isAwardCategory(course.getCategory());
        boolean isAward = isAwardCategory(category);
        Award existingAward = isAward || wasAward
                ? awardRepository.findByCourseIdForUpdate(courseId).orElse(null) : null;
        int stock = validateAwardStock(category, awardStock == null && existingAward != null
                ? existingAward.getTotalStock() : awardStock);
        boolean priceChanged = isAward && existingAward != null && !existingAward.getCost().equals(awardCost);
        if ((wasAward || isAward) && scoreRepository.existsByCourseIdAndIsDeletedFalse(courseId)
                && (!course.getTitle().equals(title) || !course.getCategory().equals(category) || priceChanged)) {
            throw new IllegalArgumentException("已有提交记录的奖品课题不能修改名称、类别或兑换积分");
        }

        course.setTitle(title);
        course.setCategory(category);
        course.setStartTime(startTime);
        course.setEndTime(endTime);
        course.setDescription(description);
        course.setImage(image);
        course.setUpdatedAt(LocalDateTime.now());
        Course savedCourse = courseRepository.save(course);

        if (isAward) {
            LocalDateTime now = LocalDateTime.now();
            Award award = existingAward == null ? new Award() : existingAward;
            if (existingAward == null) {
                award.setCourse(savedCourse);
                award.setTotalStock(stock);
                award.setRemainingStock(stock);
                award.setCreatedAt(now);
            } else {
                int redeemed = award.getTotalStock() - award.getRemainingStock();
                boolean hadRemaining = award.getRemainingStock() > 0;
                if (stock < redeemed) {
                    throw new IllegalArgumentException("奖品数量不能小于已兑换数量");
                }
                award.setTotalStock(stock);
                award.setRemainingStock(stock - redeemed);
                award.setSoldOutAt(stock == redeemed ? award.getSoldOutAt() == null ? now : award.getSoldOutAt() : null);
                if (stock == redeemed && hadRemaining) {
                    scoreRepository.rejectOtherPendingAwardScores(
                            courseId, -1L, "奖品已售罄", now);
                }
            }
            award.setCost(awardCost);
            award.setUpdatedAt(now);
            awardRepository.save(award);
            savedCourse.setAward(award);
        } else if (existingAward != null) {
            awardRepository.delete(existingAward);
            savedCourse.setAward(null);
        }

        return savedCourse;
    }

    // 设置课程为删除状态
    public Course deleteCourse(Integer courseId) {
        Course course = courseRepository.findById(courseId).orElse(null);
        if (course != null) {
            if ("award".equalsIgnoreCase(course.getCategory().trim())
                    && scoreRepository.existsApprovedAwardByCourseId(courseId)) {
                throw new IllegalArgumentException("已有兑换记录的奖品课题不允许删除");
            }
            List<Score> scores = scoreRepository.findByCourse_Id(courseId);
            for (Score score : scores) {
                score.setIsDeleted(true);
            }
            course.setIsDeleted(true); // 设置课程为已删除状态
            return courseRepository.save(course); // 保存更新后的课程对象
        }
        return null; // 如果课程不存在，返回null
    }

    private void validateAwardCost(String category, Integer awardCost) {
        if (isAwardCategory(category) && (awardCost == null || awardCost <= 0)) {
            throw new IllegalArgumentException("奖品必须设置大于 0 的兑换积分");
        }
    }

    private int validateAwardStock(String category, Integer awardStock) {
        if (!isAwardCategory(category)) return 1;
        int stock = awardStock == null ? 1 : awardStock;
        if (stock <= 0) {
            throw new IllegalArgumentException("奖品数量必须是大于 0 的整数");
        }
        return stock;
    }

    private boolean isAwardCategory(String category) {
        return category != null && "award".equalsIgnoreCase(category.trim());
    }

    public List<Course> getAllCourseByPage(int page, int size) {
        // 分页查询未删除的 Identity
        return courseRepository.findByIsDeletedFalse(PageRequest.of(page, size)).getContent();
    }

    // 排除包含 substring 的 category
    public Page<Course> findAvailableByCategoryNotContaining(String substring, int page, int size) {
        if (substring == null) substring = "";
        Pageable pageable = PageRequest.of(page, size);
        LocalDateTime currentDateTime = LocalDateTime.now();
        return courseRepository.findAvailableCourseNotContainingCategory(currentDateTime, substring, pageable);
    }

    public Page<Course> findAvailableByCategoryContaining(String substring, int page, int size) {
        if (substring == null) substring = "";
        Pageable pageable = PageRequest.of(page, size);
        LocalDateTime currentDateTime = LocalDateTime.now();
        return courseRepository.findAvailableCourseContainingCategory(currentDateTime, substring, pageable);
    }

    // 包含 substring 的 category
    public Page<Course> findByCategoryContainingAll(String substring, int page, int size) {
        if (substring == null) substring = "";
        Pageable pageable = PageRequest.of(page, size);
        return courseRepository.findByCategoryContainingIgnoreCaseAndIsDeletedFalse(substring, pageable);
    }

    // 排除包含 substring 的 category
    public Page<Course> findByCategoryNotContainingAll(String substring, int page, int size) {
        if (substring == null) substring = "";
        Pageable pageable = PageRequest.of(page, size);
        return courseRepository.findByCategoryNotContainingIgnoreCaseAndIsDeletedFalse(substring, pageable);
    }

    //不一定用的到
    public List<Activity> getAssocActivities(Integer courseId) {
        Course course = courseRepository.findById(courseId).orElse(null);
        if (course != null) {
            List<Activity> list = new ArrayList<>();
            for(ActivityCourseAssoc assoc : course.getActivityAssocs())
                list.add(assoc.getActivity());
            return list;
        }
        return null;
    }
}
