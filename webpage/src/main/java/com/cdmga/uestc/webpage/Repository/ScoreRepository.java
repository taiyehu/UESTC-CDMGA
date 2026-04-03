package com.cdmga.uestc.webpage.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.cdmga.uestc.webpage.Entity.Score;

import java.util.List;
import java.util.Optional;
import java.util.Set;

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

    @Query("SELECT s FROM Score s WHERE s.isScored = false AND s.isDeleted = false AND s.course.category = 'bingo' ORDER BY s.createdAt DESC")
    Page<Score> findUnscoredBingo(Pageable pageable);

    @Query("SELECT s FROM Score s WHERE s.isScored = false AND s.isDeleted = false AND s.course.category <> 'bingo' ORDER BY s.createdAt DESC")
    Page<Score> findUnscoredNonBingo(Pageable pageable);

    @Query("SELECT COUNT(s) FROM Score s WHERE s.isScored = false AND s.isDeleted = false AND s.course.category = 'bingo'")
    long countUnscoredBingo();

    @Query("SELECT COUNT(s) FROM Score s WHERE s.isScored = false AND s.isDeleted = false AND s.course.category <> 'bingo'")
    long countUnscoredNonBingo();

    // 查询所有 isScored = true 且 isDeleted = false 且 category为contest的成绩
    @Query("SELECT s FROM Score s WHERE s.isScored = true AND s.isDeleted = false AND s.course.category = 'contest'")
    List<Score> findScoredNotDeletedAndCategoryIsContest();

    @Query("SELECT s FROM Score s WHERE s.isScored = true AND s.isDeleted = false AND s.course.category <> 'contest' AND s.course.category <> 'bingo'")
    List<Score> findScoredNotDeletedAndCategoryNotContestOrBingo();

    @Query("SELECT s FROM Score s WHERE s.isScored = true AND s.isDeleted = false AND LOWER(TRIM(COALESCE(s.course.category, ''))) NOT IN ('contest', 'ranking', 'bingo')")
    List<Score> findScoredNotDeletedAndCategoryNotContestRankingOrBingo();

    List<Score> findByIdentity_IdAndIsScoredTrueAndIsDeletedFalse(int identityId);

    @Query("SELECT s FROM Score s WHERE s.isScored = true AND s.isDeleted = false AND s.identity.id = :identityId AND s.course.category = 'contest'")
    List<Score> findByIdentity_IdAndIsScoredTrueAndIsDeletedFalseAndCategoryContest(int identityId);

    @Query("SELECT s FROM Score s WHERE s.isScored = true AND s.isDeleted = false AND s.identity.id = :identityId AND s.course.category <> 'contest' AND s.course.category <> 'bingo'")
    List<Score> findByIdentity_IdAndIsScoredTrueAndIsDeletedFalseAndCategoryNotContest(int identityId);

    @Query("SELECT s FROM Score s WHERE s.isScored = true AND s.isDeleted = false AND s.course.category = :category")
    List<Score> findScoredNotDeletedByCategory(@Param("category") String category);

    @Query("SELECT s FROM Score s WHERE s.isScored = true AND s.isDeleted = false AND s.course.category = :category AND s.course.id IN :courseIds")
    List<Score> findScoredNotDeletedByCategoryAndCourseIds(@Param("category") String category, @Param("courseIds") Set<Integer> courseIds);

    boolean existsByIdentityIdAndCourseIdAndIsDeletedFalse(int identityId, int courseId);

    boolean existsByIdentityIdAndCourseIdAndIssueIdAndIsDeletedFalse(int identityId, int courseId, Integer issueId);

    Score findByIdentityIdAndCourseIdAndIsDeletedFalse(Integer identityId, Integer courseId);

    Score findByIdentityIdAndCourseIdAndIssueIdAndIsDeletedFalse(Integer identityId, Integer courseId, Integer issueId);

    List<Score> findByIdentityIdAndCourseIdAndIsDeletedFalseOrderByUploadTimeDescIdDesc(Integer identityId, Integer courseId);

    List<Score> findByIdentityIdAndCourseIdAndIssueIdAndIsDeletedFalseOrderByUploadTimeDescIdDesc(Integer identityId, Integer courseId, Integer issueId);

    List<Score> findByIdentityIdInAndCourseIdAndIsDeletedFalseOrderByUploadTimeDescIdDesc(Set<Integer> identityIds, Integer courseId);

    List<Score> findByIdentityIdInAndCourseIdAndIssueIdAndIsDeletedFalseOrderByUploadTimeDescIdDesc(Set<Integer> identityIds, Integer courseId, Integer issueId);

    List<Score> findByCourseIdAndIssueIdAndIsDeletedFalseOrderByUploadTimeDescIdDesc(Integer courseId, Integer issueId);

    @Query("SELECT COUNT(s) FROM Score s WHERE s.identity.id = :identityId AND s.course.category = 'contest' AND s.isDeleted = false")
    long countContestScoreByIdentityId(Integer identityId);



    @Query("SELECT s FROM Score s WHERE s.identity.id = :identityId AND s.course.category = 'contest' AND s.isDeleted = false AND s.isScored = true")
    List<Score> findContestScoresByIdentityId(Integer identityId);

    @Query("SELECT coalesce(sum(s.score), 0) FROM Score s WHERE s.course.id = :courseId AND s.isDeleted = false AND s.isScored = true AND s.identity.id in :identityIds")
    Double sumTeamScoreByCourseAndIdentityIds(@Param("courseId") Integer courseId, @Param("identityIds") Set<Integer> identityIds);

    @Query("SELECT COUNT(s) FROM Score s WHERE s.isDeleted = false AND s.isScored = true AND s.course.id = :courseId AND s.issueId = :issueId AND s.score > 0 AND s.id <> :scoreId AND (s.uploadTime < :uploadTime OR (s.uploadTime = :uploadTime AND s.id < :scoreId))")
    long countEarlierApprovedByCourseIssueAndUploadTime(
            @Param("courseId") Integer courseId,
            @Param("issueId") Integer issueId,
            @Param("scoreId") Long scoreId,
            @Param("uploadTime") java.time.LocalDateTime uploadTime
    );

        @Query("SELECT s FROM Score s WHERE s.isDeleted = false AND s.isScored = true AND s.course.id = :courseId AND s.issueId = :issueId AND s.score > 0 AND s.id <> :scoreId AND (s.uploadTime < :uploadTime OR (s.uploadTime = :uploadTime AND s.id < :scoreId)) ORDER BY s.uploadTime ASC, s.id ASC")
        List<Score> findEarlierApprovedByCourseIssueAndUploadTime(
            @Param("courseId") Integer courseId,
            @Param("issueId") Integer issueId,
            @Param("scoreId") Long scoreId,
            @Param("uploadTime") java.time.LocalDateTime uploadTime
        );

            @Query("SELECT s FROM Score s WHERE s.isDeleted = false " +
                "AND s.course.category = 'bingo' " +
                "AND (:courseId IS NULL OR s.course.id = :courseId) " +
                "AND (:identityId IS NULL OR s.identity.id = :identityId) " +
                "AND (:issueId IS NULL OR s.issueId = :issueId) " +
                "AND (:isScored IS NULL OR s.isScored = :isScored) " +
                "ORDER BY s.uploadTime DESC, s.id DESC")
            Page<Score> searchAdminBingoLogs(
                @Param("courseId") Integer courseId,
                @Param("identityId") Integer identityId,
                @Param("issueId") Integer issueId,
                @Param("isScored") Boolean isScored,
                Pageable pageable
            );

            @Query("SELECT s FROM Score s WHERE s.isDeleted = false " +
                "AND s.course.category <> 'bingo' " +
                "AND (:courseId IS NULL OR s.course.id = :courseId) " +
                "AND (:identityId IS NULL OR s.identity.id = :identityId) " +
                "AND (:issueId IS NULL OR s.issueId = :issueId) " +
                "AND (:isScored IS NULL OR s.isScored = :isScored) " +
                "ORDER BY s.uploadTime DESC, s.id DESC")
            Page<Score> searchAdminNonBingoLogs(
                @Param("courseId") Integer courseId,
                @Param("identityId") Integer identityId,
                @Param("issueId") Integer issueId,
                @Param("isScored") Boolean isScored,
                Pageable pageable
            );
}
