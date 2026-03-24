package com.cdmga.uestc.webpage.Controller;

import com.cdmga.uestc.webpage.Entity.BingoTip;
import com.cdmga.uestc.webpage.Service.BingoTipService;
import com.cdmga.uestc.webpage.common.BingoTipRequest;
import com.cdmga.uestc.webpage.common.Result;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@CrossOrigin(origins = "https://localhost:8081")
@RestController
@RequestMapping("/api/bingo-tip")
public class BingoTipController {

    @Autowired
    private BingoTipService bingoTipService;

    @GetMapping("/course/{courseId}")
    public ResponseEntity<Object> getCourseTips(
            @PathVariable Integer courseId,
            @RequestParam(required = false, name = "issue_id") Integer issueId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size
    ) {
        try {
            Page<BingoTip> tipPage = bingoTipService.getCourseTips(courseId, issueId, page, size);
            Map<String, Object> result = new HashMap<>();
            result.put("list", tipPage.getContent());
            result.put("total", tipPage.getTotalElements());
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Result.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Result.error(e.getMessage()));
        }
    }

    @GetMapping("/course/{courseId}/issue/{issueId}")
    public ResponseEntity<Object> getCourseIssueTips(
            @PathVariable Integer courseId,
            @PathVariable Integer issueId
    ) {
        try {
            return ResponseEntity.ok(Result.success(bingoTipService.getCourseIssueTips(courseId, issueId)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Result.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Result.error(e.getMessage()));
        }
    }

    @PostMapping("/course/{courseId}/create")
    public ResponseEntity<Result> createTip(
            @PathVariable Integer courseId,
            @RequestBody BingoTipRequest request
    ) {
        try {
            BingoTip tip = bingoTipService.createTip(
                    courseId,
                    request.getIssue_id(),
                    request.getTip(),
                    request.getTeam_id(),
                    request.getTeam_name()
            );
            return ResponseEntity.ok(Result.success(tip));
        } catch (DataIntegrityViolationException e) {
            String message = e.getMessage() == null ? "" : e.getMessage();
            if (message.contains("uk_bingo_tip_course_issue")) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Result.error("数据库仍存在旧唯一约束 uk_bingo_tip_course_issue，请先执行 sql_script/bingo_tips_incremental.sql"));
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Result.error("数据约束校验失败：" + message));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Result.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Result.error(e.getMessage()));
        }
    }

    @DeleteMapping("/course/{courseId}/tip/{tipId}")
    public ResponseEntity<Result> deleteTip(
            @PathVariable Integer courseId,
            @PathVariable Integer tipId
    ) {
        try {
            bingoTipService.deleteTip(courseId, tipId);
            return ResponseEntity.ok(Result.success("删除成功"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Result.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Result.error(e.getMessage()));
        }
    }
}
