package com.cdmga.uestc.webpage.Repository;

import com.cdmga.uestc.webpage.Entity.Award;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AwardRepository extends JpaRepository<Award, Integer> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Award a WHERE a.courseId = :courseId")
    Optional<Award> findByCourseIdForUpdate(@Param("courseId") Integer courseId);
}
