package com.cdmga.uestc.webpage.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.cdmga.uestc.webpage.Entity.Score;
import com.cdmga.uestc.webpage.Repository.ScoreRepository;
import com.cdmga.uestc.webpage.Repository.CourseRepository;
import com.cdmga.uestc.webpage.Repository.IdentityRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ScoreService {

    @Autowired
    private ScoreRepository scoreRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private IdentityRepository identityRepository;

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

            score.setCourse(courseRepository.findById((long) course_id).orElse(null));
            score.setIdentity(identityRepository.findById((long) identity_id).orElse(null));

            score.setUploadTime(upload_time);
            score.setImage(image);
            score.setScore(point);
            score.setIsScored(is_scored);
            score.setRemark(remark);
            score.setUpdatedAt(updated_at);

            return scoreRepository.save(score);
    }

    public Score updateScore(Long scoreId, float point, Boolean is_scored, String remark) {
        // 查找Score
        Score score = scoreRepository.findById(scoreId).orElse(null);
        if (score != null) {
            score.setScore(point);
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

    public Score getScoreByIdentityIdAndCourseId(Long identityId, Long courseId) {
        return scoreRepository.findByIdentityIdAndCourseId(identityId, courseId);

    }
}
