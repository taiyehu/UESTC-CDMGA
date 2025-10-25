package com.cdmga.uestc.webpage.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.cdmga.uestc.webpage.Entity.Score;

import java.util.List;
import java.util.Optional;

@Repository
public interface ScoreRepository extends JpaRepository<Score, Long> {

    long countByIsDeletedFalse();

    long countByIsScoredFalseAndIsDeletedFalse();

    // 按id查找
    Score findByIdAndIsDeletedFalse(Long id);

    // 按 identity_id 查找
    List<Score> findByIdentity_Id(int identityId);

    // 按 course_id 查找
    List<Score> findByCourse_Id(int courseId);

    @Query("SELECT c FROM Score c WHERE c.isDeleted = false ORDER BY c.createdAt DESC")
    List<Score> findAllNotDeleted();

    @Query("SELECT c FROM Score c WHERE c.isDeleted = false ORDER BY c.createdAt DESC")
    Page<Score> findAllNotDeletedByPaged(Pageable pageable);
    // 按 id、identity_id 和 course_id 查找
    Optional<Score> findByIdAndIdentityIdAndCourseId(Long id, int identityId, int courseId);

    // 按 id、identity_id 或 course_id 查找（OR 查询）
    List<Score> findByIdOrIdentityIdOrCourseId(Long id, int identityId, int courseId);

    // 查询所有 isScored = false 且 isDeleted = false 的成绩
    Page<Score> findByIsScoredFalseAndIsDeletedFalse(Pageable pageable);

    // 根据identity_id 查找所有 isScored = true 且 isDeleted = false 的成绩
    List<Score> findByIsScoredTrueAndIsDeletedFalse();

    List<Score> findByIdentity_IdAndIsScoredTrueAndIsDeletedFalse(int identityId);

    boolean existsByIdentityIdAndCourseId(int identityId, int courseId);

    Score findByIdentityIdAndCourseId(Integer identityId, Integer courseId);

}
