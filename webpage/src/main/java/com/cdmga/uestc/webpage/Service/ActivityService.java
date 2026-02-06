package com.cdmga.uestc.webpage.Service;

import com.cdmga.uestc.webpage.Dto.AssocActivityDto;
import com.cdmga.uestc.webpage.Dto.AssocCourseDto;
import com.cdmga.uestc.webpage.Entity.Activity;
import com.cdmga.uestc.webpage.Entity.ActivityCourseAssoc;
import com.cdmga.uestc.webpage.Entity.Course;
import com.cdmga.uestc.webpage.Entity.Score;
import com.cdmga.uestc.webpage.Repository.ActivityRepository;
import com.cdmga.uestc.webpage.Repository.CourseRepository;
import com.cdmga.uestc.webpage.Repository.ActivityCourseAssocRepository;
import com.cdmga.uestc.webpage.Repository.ScoreRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class ActivityService {

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private ActivityCourseAssocRepository activityCourseAssocRepository;

    @Autowired
    private ScoreRepository scoreRepository;


    public List<Activity> findAll() {
        return activityRepository.findAll();
    }

    public Optional<Activity> findById(Integer id) {
        return activityRepository.findById(id);
    }

    public Activity save(Activity activity) {
        return activityRepository.save(activity);
    }

    public void deleteById(Integer id) {
        activityRepository.deleteById(id);
    }

    public List<Activity> getAllActivitiesByPage(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return activityRepository.findAll(pageable).getContent();
    }

    public long countActivities() {
        return activityRepository.count();
    }

    public Course saveAssocCoursesToActivity(Integer activityId, Integer courseId,String rule) {
        Activity activity = activityRepository.findByIdAndIsDeletedFalse(activityId);
        Course course = courseRepository.findByIdAndIsDeletedFalse(courseId);
        if (activity != null && course != null) {
            ActivityCourseAssoc assoc = new ActivityCourseAssoc();
            assoc.setActivity(activity);
            assoc.setCourse(course);
            assoc.setRule(rule);
            // persist assoc directly to ensure the join row is saved (no cascade required)
            activityCourseAssocRepository.save(assoc);

            return course;
        } else {
            throw new IllegalArgumentException("课题或活动不存在");
        }
    }

    public List<AssocCourseDto> getAssocCoursesForActivity(Integer activityId) {
        Optional<Activity> activityOpt = activityRepository.findById(activityId);
        if (activityOpt.isPresent()) {
            Activity activity = activityOpt.get();
            List<AssocCourseDto> list = new ArrayList<>();
            for(ActivityCourseAssoc courseAssoc : activity.getCourseAssocs()) {
                Course assocCourse = courseAssoc.getCourse();
                AssocCourseDto newDto = new AssocCourseDto();
                newDto.setId(assocCourse.getId());
                newDto.setTitle(assocCourse.getTitle());
                newDto.setCategory(assocCourse.getCategory());
                newDto.setTitle(assocCourse.getTitle());
                newDto.setCategory(assocCourse.getCategory());
                newDto.setDescription(assocCourse.getDescription());
                newDto.setStartTime(assocCourse.getStartTime());
                newDto.setEndTime(assocCourse.getEndTime());
                newDto.setImage(assocCourse.getImage());
                newDto.setRule(courseAssoc.getRule());
                list.add(newDto);
            }
            return list;
        }
        return null;
    }

    public List<Activity> getRatedActivities(Integer identityId) {
        List<Score> activityScores = scoreRepository.findByIdentity_IdAndIsScoredTrueAndIsDeletedFalseAndCategoryContest(identityId);
        Set<Activity> result = new HashSet<>();
        for(Score score : activityScores){
            Course course = score.getCourse();
            List<ActivityCourseAssoc> assocs = activityCourseAssocRepository.findByCourseId(course.getId());
            for(ActivityCourseAssoc assoc : assocs){
                result.add(assoc.getActivity());
            }
        }
        return new ArrayList<>(result);
    }

    public String getRule(Integer activityId, Integer courseId) {
        return activityCourseAssocRepository.findByActivityIdAndCourseId(activityId, courseId).getRule();
    }

    public List<Activity> searchActivitiesByName(String name) {
        if (name == null) name = "";
        return activityRepository.findByNameContainingIgnoreCaseAndIsDeletedFalse(name);
    }

    public Page<Activity> searchActivitiesByName(String name, Pageable pageable) {
        if (name == null) name = "";
        return activityRepository.findByNameContainingIgnoreCaseAndIsDeletedFalse(name, pageable);
    }
}
