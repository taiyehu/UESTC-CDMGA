package com.cdmga.uestc.webpage.Controller;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.cdmga.uestc.webpage.common.Result;
import com.cdmga.uestc.webpage.common.ScoreRequest;
import com.cdmga.uestc.webpage.Dto.UserScoreDto;
import com.cdmga.uestc.webpage.Entity.Score;
import com.cdmga.uestc.webpage.Service.ScoreService;


@CrossOrigin(origins = "https://localhost:8081")
@RestController
@RequestMapping("/api/score")
public class ScoreController {
    @Autowired
    private ScoreService scoreService;

    // 配置图片存储目录路径
    @Value("${score.upload.directory}")
    private String uploadDir;

    @GetMapping("/")
    public ResponseEntity<Object> getScore(
                @RequestParam(defaultValue = "0")int page,
                @RequestParam(defaultValue = "10")int size
        ) {
        List<Score> currentScore = scoreService.getAllScore(page, size);

        Long total = scoreService.getScoreCount();

        Map<String, Object> result = new HashMap<>();
        result.put("list",currentScore);
        result.put("total",total);
        return ResponseEntity.ok(result);
    }


    @PostMapping("/post")
    public ResponseEntity<Result> postScore(@RequestBody ScoreRequest scoreRequest) {
        try {
            Score newScore = scoreService.postNewScore(
                    scoreRequest.getCourse_id(), scoreRequest.getIdentity_id(),
                    scoreRequest.getUpload_time(), scoreRequest.getImage(),
                    0, false, scoreRequest.getRemark(),
                    scoreRequest.getCreated_at(), scoreRequest.getUpdated_at());
            return ResponseEntity.ok(Result.success(newScore));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Result.error(e.getMessage()));
        }
    }

    // 上传图片
    @PostMapping("/upload")
    public Result postImage(@RequestParam("image") MultipartFile image) {
        try {
            // 生成一个唯一的文件名
            String fileName = UUID.randomUUID().toString() + "." + getFileExtension(image.getOriginalFilename());
            Path targetLocation = Paths.get(uploadDir, fileName);

            System.out.println("图片上传目录：" + uploadDir);

            // 确保文件存储目录存在
            Files.createDirectories(targetLocation.getParent());

            // 保存图片到指定目录
            Files.copy(image.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            // 假设你有一个基础 URL（例如：http://localhost:8081/scores/），可以返回相对路径
            String imageUrl = "/scores/" + fileName;

            return Result.success(imageUrl);  // 返回图片的URL
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    // @PutMapping("/update/{id}")
    // public ResponseEntity<Result> updateScoreImage(
    //         @PathVariable Long id,
    //         @RequestBody ScoreRequest scoreRequest) {
    //     try {
    //         Score updatedScore = scoreService.updateScoreImage(id, scoreRequest.getImage());
    //         if (updatedScore != null) {
    //             return ResponseEntity.ok(Result.success(updatedScore));
    //         } else {
    //             return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Result.error("Score not found"));
    //         }
    //     } catch (Exception e) {
    //         return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Result.error(e.getMessage()));
    //     }
    // }

    @GetMapping("/find")
    public ResponseEntity<Long> findScoreId(@RequestParam Integer identity_id, @RequestParam Integer course_id) {
        Score score = scoreService.getScoreByIdentityIdAndCourseId(identity_id, course_id);
        if (score != null) {
            return ResponseEntity.ok(score.getId());
        } else {
            return ResponseEntity.ok(null);
        }
    }
    // 获取文件扩展名
    private String getFileExtension(String fileName) {
        int index = fileName.lastIndexOf('.');
        if (index == -1) {
            return ""; // 没有扩展名
        }
        return fileName.substring(index + 1);
    }

    // 根据id查找Score
    @GetMapping("/{id}")
    public ResponseEntity<Score> getScoreById(@PathVariable Long id) {
        return ResponseEntity.ok(scoreService.getScoreById(id));
    }

    @GetMapping("/byIdentity/{identityId}")
    public ResponseEntity<List<Score>> getScoreByIdentityId(@PathVariable Integer identityId) {
        List<Score> scores = scoreService.getScoredScoresByIdentityId(identityId);
        Long total = scoreService.getScoreCount();
        return ResponseEntity.ok(scores);
    }

    // 根据id更新Score
    @PutMapping("/update/{id}")
    public ResponseEntity<Result> updateScore(
            @PathVariable Long id,
            @RequestBody ScoreRequest scoreRequest) {
        try {
            Score updatedScore = scoreService.updateScore(
                    id, scoreRequest.getUpload_time(),
                    scoreRequest.getImage(),
                    scoreRequest.getPoint(),
                    scoreRequest.getIs_scored(),
                    scoreRequest.getRemark()
            );
            if (updatedScore != null) {
                return ResponseEntity.ok(Result.success(updatedScore));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Result.error("Score not found"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Result.error(e.getMessage()));
        }
    }

    @GetMapping("/exists")
        public ResponseEntity<?> checkScoreExists(
                @RequestParam("identityId") Integer identityId,
                @RequestParam("courseId") Integer courseId) {

            boolean exists = scoreService.existsByIdentityIdAndCourseId(identityId, courseId);
            return ResponseEntity.ok(exists);
        }
    @GetMapping("/unscored")
    public ResponseEntity<Object> getUnscoredScores(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        List<Score> scores = scoreService.getUnscoredScores(page, size);
        Long total = scoreService.getUnScoredScoreCount();

        Map<String, Object> result = new HashMap<>();
        result.put("list",scores);
        result.put("total",total);
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/delete/{id}")
    public Result deleteScore(@PathVariable Long id) {
        scoreService.deleteScore(id);
        return Result.success("删除成功");
    }

    @GetMapping("/user-total-scores")
    public Result getUserTotalScores() {
        try {
            List<UserScoreDto> userScores = scoreService.calculateTotalScoreForAllUsers();
            return Result.success(userScores);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/contest-scores")
    public Result getContestScores() {
        try {
            List<UserScoreDto> contestScores = scoreService.calculateTotalScoresForContest();
            return Result.success(contestScores);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/activity-scores")
    public ResponseEntity<List<Score>> getActivityScores(
            @RequestParam Integer activityId,
            @RequestParam Integer identityId){
        return ResponseEntity.ok().body(scoreService.getActivityScoreByIdentityId(identityId, activityId));
    }


    @GetMapping("/activity-totalScores/{id}")
    public Result getActivityTotalScores(@PathVariable Integer id) {
        try {
            List<UserScoreDto> activityScores = scoreService.calculateTotalScoresForActivity(id);
            return Result.success(activityScores);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/user-scored-scores")
    public Result getUserScoredScores(@RequestParam("identityId") int identityId) {
        try {
            List<Score> scoredScores = scoreService.getScoredScoresByIdentityId(identityId);
            return Result.success(scoredScores);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/user-course-scores")
    public Result getUserCourseScoresByIdentityId(@RequestParam("identityId") int identityId) {
        try {
            List<Score> scoredScores = scoreService.getScoredCourseScoresByIdentityId(identityId);
            return Result.success(scoredScores);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/user-contest-scores")
    public Result getUserContestScoresByIdentityId(@RequestParam("identityId") int identityId) {
        try {
            List<Score> scoredScores = scoreService.getScoredContestScoresByIdentityId(identityId);
            return Result.success(scoredScores);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/contest-score-count")
    public Result getContestScoreCount(
            @RequestParam int identityId) {
        try {
            long count = scoreService.countContestScoreByIdentityId(identityId);
            return Result.success(count);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/contest/contest-scores-by-user")
    public Result getContestScoresByUser(@RequestParam int identityId) {
        try {
            List<Score> scores = scoreService.getContestScoresByIdentityId(identityId);
            return Result.success(scores);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

}
