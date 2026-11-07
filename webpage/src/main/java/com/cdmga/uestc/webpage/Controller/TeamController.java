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
import jakarta.servlet.http.HttpSession;

import java.util.List;
import java.util.Map;

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
            @RequestParam Integer identityId,
            HttpSession session
    ) {
        ResponseEntity<Object> denied = requireOwnIdentity(identityId, session);
        if (denied != null) return denied;
        try {
            TeamPanelDto panel = teamService.getMyTeamPanel(courseId, identityId);
            return ResponseEntity.ok(Result.success(panel));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Result.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Result.error(e.getMessage()));
        }
    }

    @GetMapping("/course/{courseId}/my-score")
    public ResponseEntity<Object> getMyTeamScore(
            @PathVariable Integer courseId,
            @RequestParam Integer identityId,
            HttpSession session
    ) {
        ResponseEntity<Object> denied = requireOwnIdentity(identityId, session);
        if (denied != null) return denied;
        try {
            Double score = teamService.getMyTeamTotalScore(courseId, identityId);
            return ResponseEntity.ok(Result.success(score));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Result.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Result.error(e.getMessage()));
        }
    }

    @GetMapping("/course/{courseId}/board-state")
    public ResponseEntity<Object> getBingoBoardState(
            @PathVariable Integer courseId,
            @RequestParam Integer identityId,
            HttpSession session
    ) {
        ResponseEntity<Object> denied = requireOwnIdentity(identityId, session);
        if (denied != null) return denied;
        try {
            return ResponseEntity.ok(Result.success(teamService.getBingoBoardState(courseId, identityId)));
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
            @RequestParam(defaultValue = "") String keyword,
            HttpSession session
    ) {
        ResponseEntity<Object> denied = requireOwnIdentity(identityId, session);
        if (denied != null) return denied;
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
            @RequestBody TeamActionRequest request,
            HttpSession session
    ) {
        try {
            Integer teamId = teamService.createTeam(courseId, sessionIdentityId(session));
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
            @RequestBody TeamActionRequest request,
            HttpSession session
    ) {
        try {
            teamService.joinTeam(courseId, sessionIdentityId(session), request.getTeam_id());
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
            @RequestBody TeamActionRequest request,
            HttpSession session
    ) {
        try {
            teamService.inviteMember(courseId, sessionIdentityId(session), request.getTarget_identity_id());
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
            @RequestBody TeamActionRequest request,
            HttpSession session
    ) {
        try {
            teamService.leaveTeam(courseId, sessionIdentityId(session));
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
            @RequestBody TeamSaveRequest request,
            HttpSession session
    ) {
        try {
            teamService.saveTeamMembers(courseId, request.getTeam_id(), request.getMember_ids(), sessionIdentityId(session));
            return ResponseEntity.ok(Result.success("保存成功"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Result.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Result.error(e.getMessage()));
        }
    }

    private Integer sessionIdentityId(HttpSession session) {
        Object identityId = session.getAttribute("identityId");
        if (identityId instanceof Integer id) return id;
        throw new SecurityException("请先登录");
    }

    private ResponseEntity<Object> requireOwnIdentity(Integer requestedId, HttpSession session) {
        Integer sessionId = sessionIdentityId(session);
        if (requestedId == null || !requestedId.equals(sessionId))
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Result.error("不能访问其他用户的队伍数据"));
        return null;
    }
}
