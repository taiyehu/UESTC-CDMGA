package com.cdmga.uestc.webpage.Controller;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.cdmga.uestc.webpage.Common.Result;
import com.cdmga.uestc.webpage.Common.ScoreRequest;
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
    public ResponseEntity<List<Score>> getScore() {
    List<Score> currentScore = scoreService.getAllScore();
    return currentScore.isEmpty() ? ResponseEntity.status(HttpStatus.NO_CONTENT).body(null)
                                  : ResponseEntity.ok(currentScore);
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
    public Result findScoreId(@RequestParam Long identity_id, @RequestParam Long course_id) {
        Score score = scoreService.getScoreByIdentityIdAndCourseId(identity_id, course_id);
        if (score != null) {
            return Result.success(score.getId());
        } else {
            return Result.error("Score not found");
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

    // 根据id更新Score
    @PutMapping("/update/{id}")
    public ResponseEntity<Result> updateScore(
            @PathVariable Long id,
            @RequestBody ScoreRequest scoreRequest) {
        try {
            Score updatedScore = scoreService.updateScore(
                    id, scoreRequest.getPoint(), scoreRequest.getIs_scored(), scoreRequest.getRemark());

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
                @RequestParam("identityId") int identityId,
                @RequestParam("courseId") int courseId) {

            boolean exists = scoreService.existsByIdentityIdAndCourseId(identityId, courseId);
            return ResponseEntity.ok(exists);
        }
    @GetMapping("/unscored")
    public ResponseEntity<List<Score>> getUnscoredScores() {
        List<Score> scores = scoreService.getUnscoredScores();
        return ResponseEntity.ok(scores);
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
}
