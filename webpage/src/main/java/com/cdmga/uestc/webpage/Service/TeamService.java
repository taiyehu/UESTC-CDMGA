package com.cdmga.uestc.webpage.Service;

import com.cdmga.uestc.webpage.Dto.TeamMemberDto;
import com.cdmga.uestc.webpage.Dto.TeamRowDto;
import com.cdmga.uestc.webpage.Dto.TeamJoinOptionDto;
import com.cdmga.uestc.webpage.Dto.TeamPanelDto;
import com.cdmga.uestc.webpage.Dto.TeamPanelMemberDto;
import com.cdmga.uestc.webpage.Entity.Course;
import com.cdmga.uestc.webpage.Entity.Identity;
import com.cdmga.uestc.webpage.Entity.Profile;
import com.cdmga.uestc.webpage.Entity.Team;
import com.cdmga.uestc.webpage.Repository.CourseRepository;
import com.cdmga.uestc.webpage.Repository.IdentityRepository;
import com.cdmga.uestc.webpage.Repository.TeamRepository;
import com.cdmga.uestc.webpage.Repository.ProfileRepository;
import com.cdmga.uestc.webpage.Repository.ScoreRepository;
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
    @Autowired
    private ProfileRepository profileRepository;
    @Autowired
    private ScoreRepository scoreRepository;

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

    public TeamPanelDto getMyTeamPanel(Integer courseId, Integer identityId) {
        validateBingoCourse(courseId);
        if (identityId == null || identityId <= 0) {
            throw new IllegalArgumentException("identity_id 无效");
        }

        Team self = teamRepository.findByCourseIdAndIdentityId(courseId, identityId).orElse(null);
        if (self == null || self.getTeamId() == null) {
            return null;
        }

        Integer teamId = self.getTeamId();
        List<Team> teamRows = teamRepository.findByCourseIdAndTeamId(courseId, teamId);

        Set<Integer> memberIds = new LinkedHashSet<>();
        for (Team row : teamRows) {
            memberIds.add(row.getIdentityId());
        }

        Double totalScore = scoreRepository.sumTeamScoreByCourseAndIdentityIds(courseId, memberIds);
        TeamPanelDto panel = new TeamPanelDto(teamId, totalScore == null ? 0D : totalScore);

        for (Team row : teamRows) {
            Identity member = identityRepository.findById(row.getIdentityId()).orElse(null);
            if (member == null || Boolean.TRUE.equals(member.getIsDeleted())) continue;
            Profile profile = profileRepository.findPassedProfileByIdentityId(member.getId());
            String avatar = profile == null ? null : profile.getAvatar();
            panel.getMembers().add(new TeamPanelMemberDto(member.getId(), member.getAccount(), avatar));
        }

        return panel;
    }

    public List<TeamJoinOptionDto> searchJoinOptions(Integer courseId, Integer identityId, String keyword) {
        validateBingoCourse(courseId);
        if (identityId == null || identityId <= 0) {
            throw new IllegalArgumentException("identity_id 无效");
        }
        String key = keyword == null ? "" : keyword.trim().toLowerCase();
        if (key.isEmpty()) {
            return Collections.emptyList();
        }

        List<Team> assigned = teamRepository.findByCourseIdAndTeamIdIsNotNull(courseId);
        Map<Integer, List<Team>> grouped = new HashMap<>();
        for (Team row : assigned) {
            grouped.computeIfAbsent(row.getTeamId(), ignored -> new ArrayList<>()).add(row);
        }

        List<TeamJoinOptionDto> result = new ArrayList<>();
        for (Map.Entry<Integer, List<Team>> entry : grouped.entrySet()) {
            Integer teamId = entry.getKey();
            List<Team> members = entry.getValue();
            TeamJoinOptionDto dto = new TeamJoinOptionDto(teamId, members.size());

            boolean matched = String.valueOf(teamId).contains(key);
            for (Team memberRow : members) {
                Identity member = identityRepository.findById(memberRow.getIdentityId()).orElse(null);
                if (member == null || Boolean.TRUE.equals(member.getIsDeleted())) continue;
                dto.getMemberAccounts().add(member.getAccount());
                if (member.getAccount() != null && member.getAccount().toLowerCase().contains(key)) {
                    matched = true;
                }
            }

            if (matched) {
                result.add(dto);
            }
        }

        result.sort(Comparator.comparing(TeamJoinOptionDto::getTeamId));
        return result;
    }

    @Transactional
    public Integer createTeam(Integer courseId, Integer identityId) {
        validateBingoCourse(courseId);
        if (identityId == null || identityId <= 0) {
            throw new IllegalArgumentException("identity_id 无效");
        }

        ensureIdentityExists(identityId);
        ensureIdentityNotInTeam(courseId, identityId);

        Integer maxTeamId = teamRepository.findMaxTeamIdByCourseId(courseId);
        int newTeamId = (maxTeamId == null ? 0 : maxTeamId) + 1;
        assignIdentityToTeam(courseId, identityId, newTeamId);
        return newTeamId;
    }

    @Transactional
    public void joinTeam(Integer courseId, Integer identityId, Integer teamId) {
        validateBingoCourse(courseId);
        if (identityId == null || identityId <= 0 || teamId == null || teamId <= 0) {
            throw new IllegalArgumentException("参数无效");
        }

        ensureIdentityExists(identityId);
        ensureIdentityNotInTeam(courseId, identityId);

        long memberCount = teamRepository.countByCourseIdAndTeamId(courseId, teamId);
        if (memberCount <= 0) {
            throw new IllegalArgumentException("目标队伍不存在");
        }
        if (memberCount >= 3) {
            throw new IllegalArgumentException("队伍已满");
        }

        assignIdentityToTeam(courseId, identityId, teamId);
    }

    @Transactional
    public void inviteMember(Integer courseId, Integer ownerIdentityId, Integer targetIdentityId) {
        validateBingoCourse(courseId);
        if (ownerIdentityId == null || ownerIdentityId <= 0 || targetIdentityId == null || targetIdentityId <= 0) {
            throw new IllegalArgumentException("参数无效");
        }

        Team ownerRow = teamRepository.findByCourseIdAndIdentityId(courseId, ownerIdentityId).orElse(null);
        if (ownerRow == null || ownerRow.getTeamId() == null) {
            throw new IllegalArgumentException("你当前不在任何队伍中");
        }

        ensureIdentityExists(targetIdentityId);
        ensureIdentityNotInTeam(courseId, targetIdentityId);

        long memberCount = teamRepository.countByCourseIdAndTeamId(courseId, ownerRow.getTeamId());
        if (memberCount >= 3) {
            throw new IllegalArgumentException("队伍已满");
        }

        assignIdentityToTeam(courseId, targetIdentityId, ownerRow.getTeamId());
    }

    @Transactional
    public void leaveTeam(Integer courseId, Integer identityId) {
        validateBingoCourse(courseId);
        if (identityId == null || identityId <= 0) {
            throw new IllegalArgumentException("identity_id 无效");
        }

        Team self = teamRepository.findByCourseIdAndIdentityId(courseId, identityId).orElse(null);
        if (self == null || self.getTeamId() == null) {
            throw new IllegalArgumentException("你当前不在任何队伍中");
        }

        self.setTeamId(null);
        teamRepository.save(self);
    }

    private void ensureIdentityExists(Integer identityId) {
        Identity identity = identityRepository.findById(identityId).orElse(null);
        if (identity == null || Boolean.TRUE.equals(identity.getIsDeleted())) {
            throw new IllegalArgumentException("成员不存在: " + identityId);
        }
    }

    private void ensureIdentityNotInTeam(Integer courseId, Integer identityId) {
        Team existing = teamRepository.findByCourseIdAndIdentityId(courseId, identityId).orElse(null);
        if (existing != null && existing.getTeamId() != null) {
            throw new IllegalArgumentException("该成员已在当前课题的队伍中");
        }
    }

    private void assignIdentityToTeam(Integer courseId, Integer identityId, Integer teamId) {
        Team team = teamRepository.findByCourseIdAndIdentityId(courseId, identityId).orElse(null);
        if (team == null) {
            Integer maxId = teamRepository.findMaxId();
            int nextId = (maxId == null ? 0 : maxId) + 1;
            team = new Team();
            team.setId(nextId);
            team.setCourseId(courseId);
            team.setIdentityId(identityId);
            team.setIsTouched(false);
        }
        team.setTeamId(teamId);
        teamRepository.save(team);
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
