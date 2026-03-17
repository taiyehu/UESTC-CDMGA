package com.cdmga.uestc.webpage.Service;

import com.cdmga.uestc.webpage.Entity.Activity;
import com.cdmga.uestc.webpage.Entity.ActivityCourseAssoc;
import com.cdmga.uestc.webpage.Entity.Course;
import com.cdmga.uestc.webpage.Entity.Team;
import com.cdmga.uestc.webpage.Repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

import com.cdmga.uestc.webpage.Dto.BingoSubmissionDto;
import com.cdmga.uestc.webpage.Dto.UserScoreDto;
import com.cdmga.uestc.webpage.Entity.Profile;
import com.cdmga.uestc.webpage.Entity.Score;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class ScoreService {

    @Autowired
    private ScoreRepository scoreRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private IdentityRepository identityRepository;

    @Autowired
    private ProfileRepository profileRepository;

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private TeamRepository teamRepository;

    public Score getScoreById(long id) {return scoreRepository.findByIdAndIsDeletedFalse(id);}

    public List<Score> getScoreByCourse(int courseId){
        return scoreRepository.findByCourse_Id(courseId);
    }

    public List<Score> getScoreByIdentity(int identityId){
        return scoreRepository.findByIdentity_Id(identityId);
    }

    public List<Score> getAllScore(int page,int size){
        return scoreRepository.findAllNotDeletedByPaged(PageRequest.of(page, size)).getContent();
    }

    public Long getScoreCount(){
        return scoreRepository.countByIsDeletedFalse();
    }

    public Long getUnScoredScoreCount(){
        return scoreRepository.countByIsScoredFalseAndIsDeletedFalse();
    }

    public Score postNewScore(int course_id, int identity_id, Integer issue_id,
        String image, float point, Boolean is_scored, String remark) {

            LocalDateTime now = LocalDateTime.now();
            Course course = courseRepository.findById(course_id).orElse(null);
            if (course == null || Boolean.TRUE.equals(course.getIsDeleted())) {
                throw new IllegalArgumentException("课题不存在");
            }

            if (course.getStartTime() != null && now.isBefore(course.getStartTime())) {
                throw new IllegalArgumentException("请等待课题开始");
            }
            if (course.getEndTime() != null && now.isAfter(course.getEndTime())) {
                throw new IllegalArgumentException("课题已结束，拒绝提交");
            }

            String category = course.getCategory() == null ? "" : course.getCategory().trim().toLowerCase();
            if ("bingo".equals(category) && issue_id != null) {
                Team self = teamRepository.findByCourseIdAndIdentityId(course_id, identity_id).orElse(null);
                if (self != null && self.getTeamId() != null) {
                    List<Team> members = teamRepository.findByCourseIdAndTeamId(course_id, self.getTeamId());
                    Set<Integer> memberIds = new LinkedHashSet<>();
                    for (Team row : members) {
                        if (row.getIdentityId() != null) {
                            memberIds.add(row.getIdentityId());
                        }
                    }

                    if (!memberIds.isEmpty()) {
                        List<Score> teamIssueSubmissions = scoreRepository
                                .findByIdentityIdInAndCourseIdAndIssueIdAndIsDeletedFalseOrderByUploadTimeDescIdDesc(memberIds, course_id, issue_id);

                        boolean hasPendingOrPassed = teamIssueSubmissions.stream().anyMatch(item ->
                                !Boolean.TRUE.equals(item.getIsScored())
                                        || (item.getScore() != null && item.getScore() > 0f));
                        if (hasPendingOrPassed) {
                            throw new IllegalArgumentException("队伍该子题已有待审核或已通过提交，不能重复提交");
                        }
                    }
                }
            }

            Score score = new Score(now);

            score.setCourse(course);
            score.setIdentity(identityRepository.findById(identity_id).orElse(null));

            score.setUploadTime(now);
            score.setImage(image);
            score.setScore(point);
            score.setIsScored(is_scored);
            score.setIssueId(issue_id);
            score.setRemark(remark);
            score.setUpdatedAt(now);

            return scoreRepository.save(score);
    }

    public Score updateScore(Long scoreId, LocalDateTime upload_time, String image,
                             float point, Boolean is_scored, String remark, Integer issue_id) {
        // 查找Score
        Score score = scoreRepository.findById(scoreId).orElse(null);
        if (score != null) {
            // 负分记录视为已定性结果，后续不允许再修改。
            if (Boolean.TRUE.equals(score.getIsScored()) && score.getScore() != null && score.getScore() < 0f) {
                return score;
            }

            if (!Boolean.TRUE.equals(is_scored)) {
                Course course = score.getCourse();
                if (course == null || Boolean.TRUE.equals(course.getIsDeleted())) {
                    throw new IllegalArgumentException("课题不存在");
                }

                LocalDateTime now = LocalDateTime.now();
                if (course.getStartTime() != null && now.isBefore(course.getStartTime())) {
                    throw new IllegalArgumentException("请等待课题开始");
                }
                if (course.getEndTime() != null && now.isAfter(course.getEndTime())) {
                    throw new IllegalArgumentException("课题已结束，拒绝提交");
                }

                String category = course.getCategory() == null ? "" : course.getCategory().trim().toLowerCase();
                Integer effectiveIssueIdForCheck = issue_id != null ? issue_id : score.getIssueId();
                if ("bingo".equals(category) && effectiveIssueIdForCheck != null && score.getIdentity() != null && score.getIdentity().getId() != null) {
                    Integer currentIdentityId = score.getIdentity().getId();
                    Team self = teamRepository.findByCourseIdAndIdentityId(course.getId(), currentIdentityId).orElse(null);
                    if (self != null && self.getTeamId() != null) {
                        List<Team> members = teamRepository.findByCourseIdAndTeamId(course.getId(), self.getTeamId());
                        Set<Integer> memberIds = new LinkedHashSet<>();
                        for (Team row : members) {
                            if (row.getIdentityId() != null) {
                                memberIds.add(row.getIdentityId());
                            }
                        }

                        if (!memberIds.isEmpty()) {
                            List<Score> teamIssueSubmissions = scoreRepository
                                    .findByIdentityIdInAndCourseIdAndIssueIdAndIsDeletedFalseOrderByUploadTimeDescIdDesc(
                                            memberIds, course.getId(), effectiveIssueIdForCheck);
                            boolean hasPendingOrPassed = teamIssueSubmissions.stream()
                                    .filter(item -> !item.getId().equals(scoreId))
                                    .anyMatch(item -> !Boolean.TRUE.equals(item.getIsScored())
                                            || (item.getScore() != null && item.getScore() > 0f));
                            if (hasPendingOrPassed) {
                                throw new IllegalArgumentException("队伍该子题已有待审核或已通过提交，不能重复提交");
                            }
                        }
                    }
                }
            }

            float finalPoint = point;
            Integer effectiveIssueId = issue_id != null ? issue_id : score.getIssueId();
                LocalDateTime effectiveUploadTime = Boolean.TRUE.equals(is_scored)
                    ? score.getUploadTime()
                    : LocalDateTime.now();

            // bingo 审核通过时，按同课题同子题上传时间排名给予阶梯分：1st=5, 2nd/3rd=3, others=2。
            if (Float.compare(point, 2f) == 0
                    && score.getCourse() != null
                    && "bingo".equals(score.getCourse().getCategory())
                    && effectiveIssueId != null
                    && effectiveUploadTime != null) {
                List<Score> earlierApproved = scoreRepository.findEarlierApprovedByCourseIssueAndUploadTime(
                        score.getCourse().getId(),
                        effectiveIssueId,
                        score.getId(),
                        effectiveUploadTime
                );

                Integer courseId = score.getCourse().getId();
                Integer currentIdentityId = score.getIdentity() == null ? null : score.getIdentity().getId();
                Integer currentTeamId = null;
                if (currentIdentityId != null) {
                    Team currentTeam = teamRepository.findByCourseIdAndIdentityId(courseId, currentIdentityId).orElse(null);
                    currentTeamId = currentTeam == null ? null : currentTeam.getTeamId();
                }

                long rank;
                if (currentTeamId != null) {
                    Set<Integer> identityIds = new LinkedHashSet<>();
                    for (Score item : earlierApproved) {
                        if (item.getIdentity() != null && item.getIdentity().getId() != null) {
                            identityIds.add(item.getIdentity().getId());
                        }
                    }

                    Map<Integer, Integer> identityToTeam = new HashMap<>();
                    if (!identityIds.isEmpty()) {
                        List<Team> teamRows = teamRepository.findByCourseIdAndIdentityIdIn(courseId, identityIds);
                        for (Team row : teamRows) {
                            if (row.getTeamId() != null) {
                                identityToTeam.put(row.getIdentityId(), row.getTeamId());
                            }
                        }
                    }

                    List<Integer> orderedTeamIds = new ArrayList<>();
                    Set<Integer> seenTeamIds = new LinkedHashSet<>();
                    for (Score item : earlierApproved) {
                        if (item.getIdentity() == null || item.getIdentity().getId() == null) continue;
                        Integer teamId = identityToTeam.get(item.getIdentity().getId());
                        if (teamId == null) continue;
                        if (seenTeamIds.add(teamId)) {
                            orderedTeamIds.add(teamId);
                        }
                    }

                    int existingIndex = orderedTeamIds.indexOf(currentTeamId);
                    rank = existingIndex >= 0 ? (existingIndex + 1L) : (orderedTeamIds.size() + 1L);
                } else {
                    rank = earlierApproved.size() + 1L;
                }

                if (effectiveIssueId == 13) {
                    finalPoint = rank == 1 ? 15f : 10f;
                } else if (rank == 1) {
                    finalPoint = 5f;
                } else if (rank == 2 || rank == 3) {
                    finalPoint = 3f;
                } else {
                    finalPoint = 2f;
                }
            }

            score.setUploadTime(effectiveUploadTime);
            score.setImage(image);
            score.setScore(finalPoint);
            score.setIsScored(is_scored);
            score.setIssueId(issue_id);
            score.setRemark(remark);
            score.setUpdatedAt(LocalDateTime.now()); // 更新时间
            return scoreRepository.save(score); // 保存更新后的Score
        }
        return null; // 如果没有找到Score，返回null
    }


    public Score updateScoreImage(Long scoreId, String image) {
        // 查找Score
        Score score = scoreRepository.findById(scoreId).orElse(null);
        if (score != null) {
            score.setImage(image);
            score.setUploadTime(LocalDateTime.now());
            score.setUpdatedAt(LocalDateTime.now()); // 更新时间
            return scoreRepository.save(score); // 保存更新后的Score
        }
        return null; // 如果没有找到Score，返回null
    }

    public Score deleteScore(Long scoreId){
        Score score = scoreRepository.findById(scoreId).orElse(null);
        if(score != null){
            score.setIsDeleted(true);
            score.setUpdatedAt(LocalDateTime.now());
            return scoreRepository.save(score);
        }
        return null;
    }

    public List<Score> getUnscoredScores(int page, int size) {
        return scoreRepository.findByIsScoredFalseAndIsDeletedFalse(PageRequest.of(page, size)).getContent();
    }

    public List<Score> getUnscoredBingoScores(int page, int size) {
        return scoreRepository.findUnscoredBingo(PageRequest.of(page, size)).getContent();
    }

    public List<BingoSubmissionDto> getUnscoredBingoSubmissionDtos(int page, int size) {
        List<Score> scores = scoreRepository.findUnscoredBingo(PageRequest.of(page, size)).getContent();

        Map<String, Integer> teamIdByCourseAndIdentity = new HashMap<>();
        Map<Integer, Set<Integer>> identityIdsByCourse = new HashMap<>();

        for (Score score : scores) {
            if (score.getCourse() == null || score.getCourse().getId() == null || score.getIdentity() == null || score.getIdentity().getId() == null) {
                continue;
            }
            identityIdsByCourse
                    .computeIfAbsent(score.getCourse().getId(), key -> new LinkedHashSet<>())
                    .add(score.getIdentity().getId());
        }

        for (Map.Entry<Integer, Set<Integer>> entry : identityIdsByCourse.entrySet()) {
            Integer courseId = entry.getKey();
            List<Team> teamRows = teamRepository.findByCourseIdAndIdentityIdIn(courseId, entry.getValue());
            for (Team team : teamRows) {
                if (team.getIdentityId() == null || team.getTeamId() == null) {
                    continue;
                }
                teamIdByCourseAndIdentity.put(courseId + "#" + team.getIdentityId(), team.getTeamId());
            }
        }

        List<BingoSubmissionDto> result = new ArrayList<>();
        for (Score score : scores) {
            BingoSubmissionDto dto = new BingoSubmissionDto();
            dto.setId(score.getId());
            dto.setIssueId(score.getIssueId());
            dto.setUploadTime(score.getUploadTime());
            dto.setImage(score.getImage());
            dto.setRemark(score.getRemark());

            if (score.getCourse() != null) {
                dto.setCourseId(score.getCourse().getId());
                dto.setCourseName(score.getCourse().getTitle());
            }

            if (score.getIdentity() != null) {
                dto.setIdentityId(score.getIdentity().getId());
                dto.setAccount(score.getIdentity().getAccount());
            }

            if (dto.getCourseId() != null && dto.getIdentityId() != null) {
                dto.setTeamId(teamIdByCourseAndIdentity.get(dto.getCourseId() + "#" + dto.getIdentityId()));
            }

            result.add(dto);
        }

        return result;
    }

    public List<Score> getUnscoredNonBingoScores(int page, int size) {
        return scoreRepository.findUnscoredNonBingo(PageRequest.of(page, size)).getContent();
    }

    public Long getUnScoredBingoScoreCount(){
        return scoreRepository.countUnscoredBingo();
    }

    public Long getUnScoredNonBingoScoreCount(){
        return scoreRepository.countUnscoredNonBingo();
    }

    private void validateAdmin(Integer adminIdentityId) {
        if (adminIdentityId == null || adminIdentityId <= 0) {
            throw new IllegalArgumentException("admin_identity_id 无效");
        }
        var identity = identityRepository.findById(adminIdentityId).orElse(null);
        if (identity == null || Boolean.TRUE.equals(identity.getIsDeleted()) || !"admin".equalsIgnoreCase(identity.getRole())) {
            throw new SecurityException("仅管理员可查看成绩日志");
        }
    }

    public Map<String, Object> getAdminScoreLogs(
            Integer adminIdentityId,
            String category,
            Integer courseId,
            Integer identityId,
            Integer issueId,
            Boolean isScored,
            int page,
            int size
    ) {
        validateAdmin(adminIdentityId);

        String normalizedCategory = category == null ? "non-bingo" : category.trim().toLowerCase();
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, size);
        Pageable pageable = PageRequest.of(safePage, safeSize);

        Page<Score> scorePage;
        if ("bingo".equals(normalizedCategory)) {
            scorePage = scoreRepository.searchAdminBingoLogs(courseId, identityId, issueId, isScored, pageable);
        } else {
            scorePage = scoreRepository.searchAdminNonBingoLogs(courseId, identityId, issueId, isScored, pageable);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("list", scorePage.getContent());
        result.put("total", scorePage.getTotalElements());
        result.put("page", safePage);
        result.put("size", safeSize);
        result.put("category", "bingo".equals(normalizedCategory) ? "bingo" : "non-bingo");
        return result;
    }

    public boolean existsByIdentityIdAndCourseId(int identityId, int courseId, Integer issueId) {
        if (issueId == null) {
            return scoreRepository.existsByIdentityIdAndCourseIdAndIsDeletedFalse(identityId, courseId);
        }
        return scoreRepository.existsByIdentityIdAndCourseIdAndIssueIdAndIsDeletedFalse(identityId, courseId, issueId);
    }

    public Score getScoreByIdentityIdAndCourseId(Integer identityId, Integer courseId, Integer issueId) {
        if (issueId == null) {
            return scoreRepository.findByIdentityIdAndCourseIdAndIsDeletedFalse(identityId, courseId);
        }
        return scoreRepository.findByIdentityIdAndCourseIdAndIssueIdAndIsDeletedFalse(identityId, courseId, issueId);

    }

    public Map<String, Object> getScoreHistoryByIdentityIdAndCourseId(Integer identityId, Integer courseId, Integer issueId) {
        Map<String, Object> result = new HashMap<>();
        result.put("hasTeam", false);
        result.put("teamId", null);
        result.put("list", new ArrayList<Score>());

        if (identityId == null || identityId <= 0 || courseId == null || courseId <= 0) {
            return result;
        }

        Course course = courseRepository.findById(courseId).orElse(null);
        String category = course == null || course.getCategory() == null ? "" : course.getCategory().trim().toLowerCase();
        boolean isBingoCourse = "bingo".equals(category);

        if (!isBingoCourse) {
            List<Score> list;
            if (issueId == null) {
                list = scoreRepository.findByIdentityIdAndCourseIdAndIsDeletedFalseOrderByUploadTimeDescIdDesc(identityId, courseId);
            } else {
                list = scoreRepository.findByIdentityIdAndCourseIdAndIssueIdAndIsDeletedFalseOrderByUploadTimeDescIdDesc(identityId, courseId, issueId);
            }
            result.put("hasTeam", true);
            result.put("list", list);
            return result;
        }

        Team self = teamRepository.findByCourseIdAndIdentityId(courseId, identityId).orElse(null);
        if (self == null || self.getTeamId() == null) {
            return result;
        }

        Integer teamId = self.getTeamId();
        result.put("hasTeam", true);
        result.put("teamId", teamId);

        List<Team> members = teamRepository.findByCourseIdAndTeamId(courseId, teamId);
        Set<Integer> memberIds = new LinkedHashSet<>();
        for (Team row : members) {
            if (row.getIdentityId() != null) {
                memberIds.add(row.getIdentityId());
            }
        }

        if (memberIds.isEmpty()) {
            return result;
        }

        List<Score> list;
        if (issueId == null) {
            list = scoreRepository.findByIdentityIdInAndCourseIdAndIsDeletedFalseOrderByUploadTimeDescIdDesc(memberIds, courseId);
        } else {
            list = scoreRepository.findByIdentityIdInAndCourseIdAndIssueIdAndIsDeletedFalseOrderByUploadTimeDescIdDesc(memberIds, courseId, issueId);
        }
        result.put("list", list);
        return result;
    }

    public Map<String, Object> getBingoIssueHistoryByCourseId(Integer identityId, Integer courseId, Integer issueId) {
        Map<String, Object> result = new HashMap<>();
        result.put("hasTeam", false);
        result.put("teamId", null);
        result.put("list", new ArrayList<Score>());

        if (identityId == null || identityId <= 0 || courseId == null || courseId <= 0 || issueId == null || issueId <= 0) {
            return result;
        }

        Course course = courseRepository.findById(courseId).orElse(null);
        String category = course == null || course.getCategory() == null ? "" : course.getCategory().trim().toLowerCase();
        if (!"bingo".equals(category)) {
            return result;
        }

        Team self = teamRepository.findByCourseIdAndIdentityId(courseId, identityId).orElse(null);
        if (self != null && self.getTeamId() != null) {
            result.put("hasTeam", true);
            result.put("teamId", self.getTeamId());
        }

        List<Score> list = scoreRepository.findByCourseIdAndIssueIdAndIsDeletedFalseOrderByUploadTimeDescIdDesc(courseId, issueId);
        Set<Integer> identityIds = new LinkedHashSet<>();
        for (Score score : list) {
            if (score.getIdentity() != null && score.getIdentity().getId() != null) {
                identityIds.add(score.getIdentity().getId());
            }
        }

        Map<Integer, Integer> identityToTeamId = new HashMap<>();
        if (!identityIds.isEmpty()) {
            List<Team> teamRows = teamRepository.findByCourseIdAndIdentityIdIn(courseId, identityIds);
            for (Team row : teamRows) {
                if (row.getIdentityId() != null) {
                    identityToTeamId.put(row.getIdentityId(), row.getTeamId());
                }
            }
        }

        List<Map<String, Object>> viewList = new ArrayList<>();
        for (Score score : list) {
            Map<String, Object> item = new HashMap<>();
            Integer identity = score.getIdentity() == null ? null : score.getIdentity().getId();
            item.put("id", score.getId());
            item.put("uploadTime", score.getUploadTime());
            item.put("isScored", score.getIsScored());
            item.put("score", score.getScore());
            item.put("teamId", identity == null ? null : identityToTeamId.get(identity));
            viewList.add(item);
        }

        result.put("list", viewList);
        return result;
    }

    public List<UserScoreDto> calculateScoresForAllUsers(List<Score> scores) {
        Map<Integer, Float> userScoreMap = new HashMap<>();
        Map<Integer, String> userAvatarMap = new HashMap<>();
        Map<Integer, String> userAccountMap = new HashMap<>();

        for (Score score : scores) {
            Integer identityId = score.getIdentity().getId();
            float point = score.getScore();
            userScoreMap.put(identityId, userScoreMap.getOrDefault(identityId, 0f) + point);

            // 只要有一次就记录
            if (!userAvatarMap.containsKey(identityId)) {
                // 通过 profileRepository 查询 status=1 的有效头像
                Profile profile = profileRepository.findPassedProfileByIdentityId(identityId);
                userAvatarMap.put(identityId, profile != null ? profile.getAvatar() : null);
            }
            if (!userAccountMap.containsKey(identityId)) {
                userAccountMap.put(identityId, score.getIdentity().getAccount());
            }
        }
        List<UserScoreDto> result = new ArrayList<>();
        for (Map.Entry<Integer, Float> entry : userScoreMap.entrySet()) {
            Integer identityId = entry.getKey();
            Float totalScore = entry.getValue();
            String avatar = userAvatarMap.get(identityId);
            String account = userAccountMap.get(identityId);
            result.add(new UserScoreDto(identityId, totalScore, avatar, account));
        }
        return result;
    }

    public List<UserScoreDto> calculateTotalScoreForAllUsers() {
        List<Score> scores = scoreRepository.findScoredNotDeletedAndCategoryNotContestOrBingo();
        return calculateScoresForAllUsers(scores);
    }


    public List<Score> getScoredScoresByIdentityId(int identityId) {
        return scoreRepository.findByIdentity_IdAndIsScoredTrueAndIsDeletedFalse(identityId);
    }

    public List<Score> getScoredContestScoresByIdentityId(int identityId) {
        return scoreRepository.findByIdentity_IdAndIsScoredTrueAndIsDeletedFalseAndCategoryContest(identityId);
    }

    public List<Score> getScoredCourseScoresByIdentityId(int identityId) {
        return scoreRepository.findByIdentity_IdAndIsScoredTrueAndIsDeletedFalseAndCategoryNotContest(identityId);
    }

    public List<UserScoreDto> calculateTotalScoresForContest(){
        List<Score> scores = scoreRepository.findScoredNotDeletedAndCategoryIsContest();
        return calculateScoresForAllUsers(scores);
    }

    public List<UserScoreDto> calculateTotalScoresForActivity(Integer activityId) {
        Activity activity = activityRepository.findByIdAndIsDeletedFalse(activityId);
        if(activity != null){
            List<Score> scores = new ArrayList<>();
            for (ActivityCourseAssoc assoc : activity.getCourseAssocs()) {
                List<Score> courseScores = scoreRepository.findByCourse_Id(assoc.getCourse().getId());
                for (Score score : courseScores) {
                    if (Boolean.TRUE.equals(score.getIsScored()) && !score.getIsDeleted()) {
                        scores.add(score);
                    }
                }
            }
            return calculateScoresForAllUsers(scores);
        }
        return null;
    }

    public List<Score> getActivityScoreByIdentityId(Integer identityId, Integer activityId) {
        Activity activity = activityRepository.findByIdAndIsDeletedFalse(activityId);
        if (activity != null) {
            List<Score> scores = new ArrayList<>();
            for (ActivityCourseAssoc assoc : activity.getCourseAssocs()) {
                scores.add(scoreRepository.findByIdentityIdAndCourseIdAndIsDeletedFalse(identityId, assoc.getCourse().getId()));
            }
            return scores;
        }
        return null;
    }



    public long countContestScoreByIdentityId(int identityId) {
        return scoreRepository.countContestScoreByIdentityId(identityId);
    }


    public List<Score> getContestScoresByIdentityId(int identityId) {
        return scoreRepository.findContestScoresByIdentityId(identityId);
    }
}
