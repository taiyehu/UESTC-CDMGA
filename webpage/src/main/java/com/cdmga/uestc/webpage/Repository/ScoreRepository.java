package com.cdmga.uestc.webpage.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.cdmga.uestc.webpage.Entity.Score;

import java.util.List;
import java.util.Optional;

@Repository
public interface ScoreRepository extends JpaRepository<Score, Long> {
    
    // 按 identity_id 查找
    List<Score> findByIdentityId(Long identityId);
    
    // 按 course_id 查找
    List<Score> findByCourseId(Long courseId);
    
    // 按 id、identity_id 和 course_id 查找
    Optional<Score> findByIdAndIdentityIdAndCourseId(Long id, Long identityId, Long courseId);
    
    // 按 id、identity_id 或 course_id 查找（OR 查询）
    List<Score> findByIdOrIdentityIdOrCourseId(Long id, Long identityId, Long courseId);
}
