package com.cdmga.uestc.webpage.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.cdmga.uestc.webpage.Entity.Score;

import java.util.List;
import java.util.Optional;

@Repository
public interface ScoreRepository extends JpaRepository<Score, Long> {
    
    // 按 identity_id 查找
    List<Score> findByIdentity_Id(int identityId);
    
    // 按 course_id 查找
    List<Score> findByCourse_Id(int courseId);

    @Query("SELECT c FROM Score c WHERE c.isDeleted = false ORDER BY c.createdAt DESC")
    List<Score> findAllNotDeleted();
    
    // 按 id、identity_id 和 course_id 查找
    Optional<Score> findByIdAndIdentityIdAndCourseId(Long id, int identityId, int courseId);
    
    // 按 id、identity_id 或 course_id 查找（OR 查询）
    List<Score> findByIdOrIdentityIdOrCourseId(Long id, int identityId, int courseId);
}
