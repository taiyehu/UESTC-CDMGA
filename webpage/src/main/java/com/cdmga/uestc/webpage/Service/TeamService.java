package com.cdmga.uestc.webpage.Service;

import com.cdmga.uestc.webpage.Dto.TeamMemberDto;
import com.cdmga.uestc.webpage.Dto.TeamRowDto;
import com.cdmga.uestc.webpage.Entity.Course;
import com.cdmga.uestc.webpage.Entity.Identity;
import com.cdmga.uestc.webpage.Entity.Team;
import com.cdmga.uestc.webpage.Repository.CourseRepository;
import com.cdmga.uestc.webpage.Repository.IdentityRepository;
import com.cdmga.uestc.webpage.Repository.TeamRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class TeamService {

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private IdentityRepository identityRepository;

    private Course validateBingoCourse(Integer courseId) {
        Course course = courseRepository.findById(courseId).orElse(null);
        if (course == null || Boolean.TRUE.equals(course.getIsDeleted())) {
            throw new IllegalArgumentException("课题不存在");
        }
        String category = course.getCategory() == null ? "" : course.getCategory().trim().toLowerCase();
        if (!"bingo".equals(category)) {
            throw new IllegalArgumentException("仅 bingo 课题支持队伍管理");
        }
        return course;
    }

    public Map<String, Object> getCourseTeams(Integer courseId, int page, int size) {
        validateBingoCourse(courseId);

        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, size);
        int startTeamId = safePage * safeSize + 1;

        Integer maxTeamId = teamRepository.findMaxTeamIdByCourseId(courseId);
        int total = Math.max(maxTeamId == null ? 0 : maxTeamId, 10);
        int endTeamId = Math.min(total, startTeamId + safeSize - 1);

        List<TeamRowDto> list = new ArrayList<>();
        if (startTeamId <= total) {
            List<Team> rows = teamRepository.findByCourseIdAndTeamIdRange(courseId, startTeamId, endTeamId);

            Map<Integer, List<Team>> grouped = new HashMap<>();
            for (Team row : rows) {
                grouped.computeIfAbsent(row.getTeamId(), ignored -> new ArrayList<>()).add(row);
            }

            for (int teamId = startTeamId; teamId <= endTeamId; teamId += 1) {
                TeamRowDto dto = new TeamRowDto(teamId);
                List<Team> members = grouped.getOrDefault(teamId, Collections.emptyList());
                for (Team member : members) {
                    Identity identity = identityRepository.findById(member.getIdentityId()).orElse(null);
                    if (identity != null && !Boolean.TRUE.equals(identity.getIsDeleted())) {
                        dto.getMembers().add(new TeamMemberDto(identity.getId(), identity.getAccount()));
                    }
                }
                list.add(dto);
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("list", list);
        result.put("total", total);
        return result;
    }

    public List<TeamMemberDto> searchMemberOptions(Integer courseId, String keyword, int size) {
        validateBingoCourse(courseId);

        String key = keyword == null ? "" : keyword.trim();
        if (key.isEmpty()) {
            return Collections.emptyList();
        }

        int safeSize = Math.max(1, Math.min(50, size));
        List<Identity> identities = identityRepository.searchByIdOrAccountNative(key, safeSize);

        List<TeamMemberDto> result = new ArrayList<>();
        for (Identity identity : identities) {
            result.add(new TeamMemberDto(identity.getId(), identity.getAccount()));
        }
        return result;
    }

    @Transactional
    public void saveTeamMembers(Integer courseId, Integer teamId, List<Integer> memberIds) {
        validateBingoCourse(courseId);

        if (teamId == null || teamId <= 0) {
            throw new IllegalArgumentException("team_id 必须是正整数");
        }

        List<Integer> source = memberIds == null ? Collections.emptyList() : memberIds;
        List<Integer> cleaned = new ArrayList<>();
        for (Integer id : source) {
            if (id != null && id > 0) {
                cleaned.add(id);
            }
        }

        Set<Integer> unique = new LinkedHashSet<>(cleaned);
        if (unique.size() != cleaned.size()) {
            throw new IllegalArgumentException("同一队伍内成员不能重复");
        }
        if (unique.size() > 3) {
            throw new IllegalArgumentException("每个队伍最多 3 人");
        }

        for (Integer identityId : unique) {
            Identity identity = identityRepository.findById(identityId).orElse(null);
            if (identity == null || Boolean.TRUE.equals(identity.getIsDeleted())) {
                throw new IllegalArgumentException("成员不存在: " + identityId);
            }
        }

        List<Team> currentTeamRows = teamRepository.findByCourseIdAndTeamId(courseId, teamId);
        for (Team row : currentTeamRows) {
            if (!unique.contains(row.getIdentityId())) {
                row.setTeamId(null);
                teamRepository.save(row);
            }
        }

        Integer maxId = teamRepository.findMaxId();
        int nextId = (maxId == null ? 0 : maxId) + 1;

        for (Integer identityId : unique) {
            Team team = teamRepository.findByCourseIdAndIdentityId(courseId, identityId).orElse(null);
            if (team == null) {
                team = new Team();
                team.setId(nextId++);
                team.setCourseId(courseId);
                team.setIdentityId(identityId);
                team.setIsTouched(false);
            }
            team.setTeamId(teamId);
            teamRepository.save(team);
        }
    }
}
