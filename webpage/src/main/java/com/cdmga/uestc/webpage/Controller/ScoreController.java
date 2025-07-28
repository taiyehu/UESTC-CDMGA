package com.cdmga.uestc.webpage.Controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cdmga.uestc.webpage.Common.Result;
import com.cdmga.uestc.webpage.Common.ScoreRequest;
import com.cdmga.uestc.webpage.Entity.Score;
import com.cdmga.uestc.webpage.Service.ScoreService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;



@CrossOrigin(origins = "https://localhost:8081")
@RestController
@RequestMapping("/api/score")
public class ScoreController {
    @Autowired
    private ScoreService scoreService;

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
                    0, false, null, 
                    scoreRequest.getCreated_at(), scoreRequest.getUpdated_at());
            return ResponseEntity.ok(Result.success(newScore));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Result.error(e.getMessage()));
        }
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

}
