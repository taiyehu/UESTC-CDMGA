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

    @Query("SELECT COUNT(s) FROM Score s WHERE s.isScored = 0 AND s.isDeleted = false")
    long countByIsScoredZeroAndIsDeletedFalse();

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

    // 查询所有 isScored = 0 且 isDeleted = false 的成绩
    @Query("SELECT s FROM Score s WHERE s.isScored = 0 AND s.isDeleted = false ORDER BY s.createdAt DESC")
    Page<Score> findByIsScoredZeroAndIsDeletedFalse(Pageable pageable);

    @Query("SELECT s FROM Score s WHERE s.isScored = 0 AND s.isDeleted = false AND s.course.category = 'bingo' ORDER BY s.createdAt DESC")
    Page<Score> findUnscoredBingo(Pageable pageable);

    @Query("SELECT s FROM Score s WHERE s.isScored = 0 AND s.isDeleted = false AND s.course.category <> 'bingo' ORDER BY s.createdAt DESC")
    Page<Score> findUnscoredNonBingo(Pageable pageable);

    @Query("SELECT COUNT(s) FROM Score s WHERE s.isScored = 0 AND s.isDeleted = false AND s.course.category = 'bingo'")
    long countUnscoredBingo();

    @Query("SELECT COUNT(s) FROM Score s WHERE s.isScored = 0 AND s.isDeleted = false AND s.course.category <> 'bingo'")
    long countUnscoredNonBingo();

    // 查询所有 isScored = 1 且 isDeleted = false 且 category为contest的成绩
    @Query("SELECT s FROM Score s WHERE s.isScored = 1 AND s.isDeleted = false AND s.course.category = 'contest'")
    List<Score> findScoredNotDeletedAndCategoryIsContest();

    @Query("SELECT s FROM Score s WHERE s.isScored = 1 AND s.isDeleted = false AND s.course.category <> 'contest' AND s.course.category <> 'bingo'")
    List<Score> findScoredNotDeletedAndCategoryNotContestOrBingo();

    @Query("SELECT s FROM Score s WHERE s.isScored = 1 AND s.isDeleted = false AND s.identity.id = :identityId")
    List<Score> findByIdentity_IdAndIsScoredOneAndIsDeletedFalse(int identityId);

    @Query("SELECT s FROM Score s WHERE s.isScored = 1 AND s.isDeleted = false AND s.identity.id = :identityId AND s.course.category = 'contest'")
    List<Score> findByIdentity_IdAndIsScoredOneAndIsDeletedFalseAndCategoryContest(int identityId);

    @Query("SELECT s FROM Score s WHERE s.isScored = 1 AND s.isDeleted = false AND s.identity.id = :identityId AND s.course.category <> 'contest' AND s.course.category <> 'bingo'")
    List<Score> findByIdentity_IdAndIsScoredOneAndIsDeletedFalseAndCategoryNotContest(int identityId);

    boolean existsByIdentityIdAndCourseIdAndIsDeletedFalse(int identityId, int courseId);

    boolean existsByIdentityIdAndCourseIdAndIssueIdAndIsDeletedFalse(int identityId, int courseId, Integer issueId);

    Score findByIdentityIdAndCourseIdAndIsDeletedFalse(Integer identityId, Integer courseId);

    Score findByIdentityIdAndCourseIdAndIssueIdAndIsDeletedFalse(Integer identityId, Integer courseId, Integer issueId);

    @Query("SELECT COUNT(s) FROM Score s WHERE s.identity.id = :identityId AND s.course.category = 'contest' AND s.isDeleted = false")
    long countContestScoreByIdentityId(Integer identityId);



    @Query("SELECT s FROM Score s WHERE s.identity.id = :identityId AND s.course.category = 'contest' AND s.isDeleted = false AND s.isScored = 1")
    List<Score> findContestScoresByIdentityId(Integer identityId);
}
