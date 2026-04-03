package com.cdmga.uestc.webpage.Controller;

import com.cdmga.uestc.webpage.Dto.RankConfigDto;
import com.cdmga.uestc.webpage.Dto.RankCourseOptionDto;
import com.cdmga.uestc.webpage.Dto.RankUserDto;
import com.cdmga.uestc.webpage.Service.RankService;
import com.cdmga.uestc.webpage.common.RankConfigRequest;
import com.cdmga.uestc.webpage.common.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "https://localhost:8081")
@RestController
@RequestMapping("/api/rank")
public class RankController {

    @Autowired
    private RankService rankService;

    @GetMapping("/board")
    public Result getRankBoard(
            @RequestParam("category") String category,
            @RequestParam(value = "mode", defaultValue = "active") String mode,
            @RequestParam(value = "courseId", required = false) Integer courseId
    ) {
        try {
            List<RankUserDto> rows = rankService.getRankBoardByCategory(category, mode, courseId);
            return Result.success(rows);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/courses")
    public Result listRankCourses(@RequestParam("category") String category) {
        try {
            List<RankCourseOptionDto> courses = rankService.listCoursesByCategory(category);
            return Result.success(courses);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/configs")
    public Result listRankConfigs() {
        try {
            List<RankConfigDto> configs = rankService.listConfigs();
            return Result.success(configs);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/config")
    public Result saveRankConfig(@RequestBody RankConfigRequest request) {
        try {
            RankConfigDto dto = rankService.saveOrUpdateConfig(request.getCourseId(), request.getCountingRules());
            return Result.success(dto);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
}
