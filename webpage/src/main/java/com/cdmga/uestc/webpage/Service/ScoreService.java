package com.cdmga.uestc.webpage.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.cdmga.uestc.webpage.Dto.UserScoreDto;
import com.cdmga.uestc.webpage.Entity.Profile;
import com.cdmga.uestc.webpage.Entity.Score;
import com.cdmga.uestc.webpage.Repository.ScoreRepository;
import com.cdmga.uestc.webpage.Repository.CourseRepository;
import com.cdmga.uestc.webpage.Repository.IdentityRepository;
import com.cdmga.uestc.webpage.Repository.ProfileRepository;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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

    public Score getScoreById(long id) {return scoreRepository.findByIdAndIsDeletedFalse(id);}

    public List<Score> getScoreByCourse(int courseId){
        return scoreRepository.findByCourse_Id(courseId);
    }

    public List<Score> getScoreByIdentity(int identityId){
        return scoreRepository.findByIdentity_Id(identityId);
    }

    public List<Score> getAllScore(){
        return scoreRepository.findAllNotDeleted();
    }

    public Score postNewScore(int course_id, int identity_id,
        LocalDateTime upload_time, String image,
        float point, Boolean is_scored, String remark,
        LocalDateTime created_at, LocalDateTime updated_at
        ){

            Score score = new Score(created_at);

            score.setCourse(courseRepository.findById(course_id).orElse(null));
            score.setIdentity(identityRepository.findById(identity_id).orElse(null));

            score.setUploadTime(upload_time);
            score.setImage(image);
            score.setScore(point);
            score.setIsScored(is_scored);
            score.setRemark(remark);
            score.setUpdatedAt(updated_at);

            return scoreRepository.save(score);
    }

    public Score updateScore(Long scoreId, LocalDateTime upload_time, String image,
                             float point, Boolean is_scored, String remark) {
        // 查找Score
        Score score = scoreRepository.findById(scoreId).orElse(null);
        if (score != null) {
            score.setUploadTime(upload_time);
            score.setImage(image);
            score.setScore(point);
            score.setIsScored(is_scored);
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
            return scoreRepository.save(score);
        }
        return null;
    }

    public List<Score> getUnscoredScores() {
        return scoreRepository.findByIsScoredFalseAndIsDeletedFalse();
    }

    public boolean existsByIdentityIdAndCourseId(int identityId, int courseId) {
        return scoreRepository.existsByIdentityIdAndCourseId(identityId, courseId);
    }

    public Score getScoreByIdentityIdAndCourseId(Integer identityId, Integer courseId) {
        return scoreRepository.findByIdentityIdAndCourseId(identityId, courseId);

    }

    public List<UserScoreDto> calculateTotalScoreForAllUsers() {
        List<Score> scores = scoreRepository.findByIsScoredTrueAndIsDeletedFalse();
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

    public List<Score> getScoredScoresByIdentityId(int identityId) {
        return scoreRepository.findByIdentity_IdAndIsScoredTrueAndIsDeletedFalse(identityId);
    }
}
