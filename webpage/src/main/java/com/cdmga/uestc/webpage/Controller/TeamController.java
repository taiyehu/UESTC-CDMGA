package com.cdmga.uestc.webpage.Controller;

import com.cdmga.uestc.webpage.Dto.TeamJoinOptionDto;
import com.cdmga.uestc.webpage.Dto.TeamMemberDto;
import com.cdmga.uestc.webpage.Dto.TeamPanelDto;
import com.cdmga.uestc.webpage.Service.TeamService;
import com.cdmga.uestc.webpage.common.Result;
import com.cdmga.uestc.webpage.common.TeamActionRequest;
import com.cdmga.uestc.webpage.common.TeamSaveRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:8081")
@RestController
@RequestMapping("/api/team")
public class TeamController {

    @Autowired
    private TeamService teamService;

    @GetMapping("/course/{courseId}")
    public ResponseEntity<Object> getCourseTeams(
            @PathVariable Integer courseId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        try {
            Map<String, Object> result = teamService.getCourseTeams(courseId, page, size);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Result.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Result.error(e.getMessage()));
        }
    }

    @GetMapping("/course/{courseId}/member-options")
    public ResponseEntity<Object> searchMemberOptions(
            @PathVariable Integer courseId,
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(defaultValue = "20") int size
    ) {
        try {
            List<TeamMemberDto> result = teamService.searchMemberOptions(courseId, keyword, size);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Result.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Result.error(e.getMessage()));
        }
    }

    @GetMapping("/course/{courseId}/my")
    public ResponseEntity<Object> getMyTeamPanel(
            @PathVariable Integer courseId,
            @RequestParam Integer identityId
    ) {
        try {
            TeamPanelDto panel = teamService.getMyTeamPanel(courseId, identityId);
            return ResponseEntity.ok(Result.success(panel));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Result.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Result.error(e.getMessage()));
        }
    }

    @GetMapping("/course/{courseId}/join-options")
    public ResponseEntity<Object> searchJoinOptions(
            @PathVariable Integer courseId,
            @RequestParam Integer identityId,
            @RequestParam(defaultValue = "") String keyword
    ) {
        try {
            List<TeamJoinOptionDto> list = teamService.searchJoinOptions(courseId, identityId, keyword);
            return ResponseEntity.ok(Result.success(list));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Result.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Result.error(e.getMessage()));
        }
    }

    @PostMapping("/course/{courseId}/create")
    public ResponseEntity<Result> createTeam(
            @PathVariable Integer courseId,
            @RequestBody TeamActionRequest request
    ) {
        try {
            Integer teamId = teamService.createTeam(courseId, request.getIdentity_id());
            return ResponseEntity.ok(Result.success(teamId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Result.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Result.error(e.getMessage()));
        }
    }

    @PostMapping("/course/{courseId}/join")
    public ResponseEntity<Result> joinTeam(
            @PathVariable Integer courseId,
            @RequestBody TeamActionRequest request
    ) {
        try {
            teamService.joinTeam(courseId, request.getIdentity_id(), request.getTeam_id());
            return ResponseEntity.ok(Result.success("加入成功"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Result.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Result.error(e.getMessage()));
        }
    }

    @PostMapping("/course/{courseId}/invite")
    public ResponseEntity<Result> inviteMember(
            @PathVariable Integer courseId,
            @RequestBody TeamActionRequest request
    ) {
        try {
            teamService.inviteMember(courseId, request.getOwner_identity_id(), request.getTarget_identity_id());
            return ResponseEntity.ok(Result.success("邀请成功"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Result.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Result.error(e.getMessage()));
        }
    }

    @PostMapping("/course/{courseId}/leave")
    public ResponseEntity<Result> leaveTeam(
            @PathVariable Integer courseId,
            @RequestBody TeamActionRequest request
    ) {
        try {
            teamService.leaveTeam(courseId, request.getIdentity_id());
            return ResponseEntity.ok(Result.success("退出成功"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Result.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Result.error(e.getMessage()));
        }
    }

    @PostMapping("/course/{courseId}/save")
    public ResponseEntity<Result> saveCourseTeam(
            @PathVariable Integer courseId,
            @RequestBody TeamSaveRequest request
    ) {
        try {
            teamService.saveTeamMembers(courseId, request.getTeam_id(), request.getMember_ids());
            return ResponseEntity.ok(Result.success("保存成功"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Result.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Result.error(e.getMessage()));
        }
    }
}
