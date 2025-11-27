package com.cdmga.uestc.webpage.Repository;

import com.cdmga.uestc.webpage.Entity.ActivityCourseAssoc;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ActivityCourseAssocRepository extends JpaRepository<ActivityCourseAssoc, Integer> {
}

