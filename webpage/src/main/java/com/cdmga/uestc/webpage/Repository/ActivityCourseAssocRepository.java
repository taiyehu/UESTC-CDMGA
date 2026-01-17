package com.cdmga.uestc.webpage.Repository;

import com.cdmga.uestc.webpage.Entity.ActivityCourseAssoc;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActivityCourseAssocRepository extends JpaRepository<ActivityCourseAssoc, Integer> {
    ActivityCourseAssoc findByActivityIdAndCourseId(Integer activityId, Integer courseId);

    List<ActivityCourseAssoc> findByActivityId(Integer activityId);

    List<ActivityCourseAssoc> findByCourseId(Integer courseId);

}

