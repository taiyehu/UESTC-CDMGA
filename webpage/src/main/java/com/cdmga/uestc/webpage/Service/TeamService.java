package com.cdmga.uestc.webpage.Service;

import com.cdmga.uestc.webpage.Dto.TeamMemberDto;
import com.cdmga.uestc.webpage.Dto.TeamRowDto;
import com.cdmga.uestc.webpage.Dto.TeamJoinOptionDto;
import com.cdmga.uestc.webpage.Dto.TeamPanelDto;
import com.cdmga.uestc.webpage.Dto.TeamPanelMemberDto;
import com.cdmga.uestc.webpage.Entity.Course;
import com.cdmga.uestc.webpage.Entity.Identity;
import com.cdmga.uestc.webpage.Entity.Profile;
import com.cdmga.uestc.webpage.Entity.Score;
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

    private static final List<int[]> BINGO_LINES = buildBingoLines();

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

        Double totalScore = calculateBingoLineScore(courseId, memberIds);
        TeamPanelDto panel = new TeamPanelDto(teamId, totalScore);

        for (Team row : teamRows) {
            Identity member = identityRepository.findById(row.getIdentityId()).orElse(null);
            if (member == null || Boolean.TRUE.equals(member.getIsDeleted())) continue;
            Profile profile = profileRepository.findPassedProfileByIdentityId(member.getId());
            String avatar = profile == null ? null : profile.getAvatar();
            panel.getMembers().add(new TeamPanelMemberDto(member.getId(), member.getAccount(), avatar));
        }

        return panel;
    }

    public Double getMyTeamTotalScore(Integer courseId, Integer identityId) {
        validateBingoCourse(courseId);
        if (identityId == null || identityId <= 0) {
            throw new IllegalArgumentException("identity_id 无效");
        }

        Team self = teamRepository.findByCourseIdAndIdentityId(courseId, identityId).orElse(null);
        if (self == null || self.getTeamId() == null) {
            return 0D;
        }

        List<Team> teamRows = teamRepository.findByCourseIdAndTeamId(courseId, self.getTeamId());
        Set<Integer> memberIds = new LinkedHashSet<>();
        for (Team row : teamRows) {
            memberIds.add(row.getIdentityId());
        }
        return calculateBingoLineScore(courseId, memberIds);
    }

    public Map<String, Object> getBingoBoardState(Integer courseId, Integer identityId) {
        validateBingoCourse(courseId);
        if (identityId == null || identityId <= 0) {
            throw new IllegalArgumentException("identity_id 无效");
        }

        List<Team> teamRows = teamRepository.findByCourseIdAndTeamIdIsNotNull(courseId);
        Map<Integer, Integer> identityToTeam = new HashMap<>();
        for (Team row : teamRows) {
            if (row.getTeamId() != null) {
                identityToTeam.put(row.getIdentityId(), row.getTeamId());
            }
        }

        Integer myTeamId = identityToTeam.get(identityId);
        Map<Integer, Map<Integer, Float>> teamIssueBestScore = new HashMap<>();

        List<Score> scores = scoreRepository.findByCourse_Id(courseId);
        for (Score score : scores) {
            if (score == null || Boolean.TRUE.equals(score.getIsDeleted())) continue;
            if (!Boolean.TRUE.equals(score.getIsScored())) continue;

            Integer issueId = score.getIssueId();
            Float point = score.getScore();
            Integer who = score.getIdentity() == null ? null : score.getIdentity().getId();
            Integer teamId = who == null ? null : identityToTeam.get(who);

            if (teamId == null) continue;
            if (issueId == null || issueId < 1 || issueId > 25) continue;
            if (point == null || point <= 0f) continue;

            teamIssueBestScore
                    .computeIfAbsent(teamId, ignored -> new HashMap<>())
                    .merge(issueId, point, Math::max);
        }

        Map<Integer, Integer> completedTeamCountByIssue = new HashMap<>();
        for (Map<Integer, Float> issueScoreMap : teamIssueBestScore.values()) {
            for (Integer issueId : issueScoreMap.keySet()) {
                completedTeamCountByIssue.merge(issueId, 1, Integer::sum);
            }
        }

        Map<Integer, Float> myIssueScoreMap = myTeamId == null
                ? Collections.emptyMap()
                : teamIssueBestScore.getOrDefault(myTeamId, Collections.emptyMap());

        List<Map<String, Object>> cells = new ArrayList<>();
        for (int issueId = 1; issueId <= 25; issueId += 1) {
            int completedTeams = completedTeamCountByIssue.getOrDefault(issueId, 0);
            int maxScore = completedTeams == 0 ? 5 : (completedTeams <= 2 ? 3 : 2);

            Float myScoreValue = myIssueScoreMap.get(issueId);
            boolean myCompleted = myScoreValue != null && myScoreValue > 0f;

            Map<String, Object> cell = new HashMap<>();
            cell.put("issueId", issueId);
            cell.put("maxScore", maxScore);
            cell.put("myCompleted", myCompleted);
            cell.put("myScore", myCompleted ? myScoreValue.intValue() : 0);
            cells.add(cell);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("hasTeam", myTeamId != null);
        result.put("teamId", myTeamId);
        result.put("cells", cells);
        return result;
    }

    private static List<int[]> buildBingoLines() {
        List<int[]> lines = new ArrayList<>();

        for (int i = 0; i < 5; i += 1) {
            int start = 5 * i + 1;
            lines.add(new int[]{start, start + 1, start + 2, start + 3, start + 4});
        }

        for (int i = 1; i <= 5; i += 1) {
            lines.add(new int[]{i, i + 5, i + 10, i + 15, i + 20});
        }

        lines.add(new int[]{1, 7, 13, 19, 25});
        lines.add(new int[]{5, 9, 13, 17, 21});
        return lines;
    }

    private Double calculateBingoLineScore(Integer courseId, Set<Integer> memberIds) {
        if (memberIds == null || memberIds.isEmpty()) {
            return 0D;
        }

        List<com.cdmga.uestc.webpage.Entity.Score> submissions =
                scoreRepository.findByIdentityIdInAndCourseIdAndIsDeletedFalseOrderByUploadTimeDescIdDesc(memberIds, courseId);

        Map<Integer, Float> approvedBestScoreByIssue = new HashMap<>();
        for (com.cdmga.uestc.webpage.Entity.Score submission : submissions) {
            Integer issueId = submission.getIssueId();
            Float point = submission.getScore();
            if (!Boolean.TRUE.equals(submission.getIsScored())) continue;
            if (point == null || point <= 0f) continue;
            if (issueId == null || issueId < 1 || issueId > 25) continue;

            approvedBestScoreByIssue.merge(issueId, point, Math::max);
        }

        Set<Integer> countedIssueIds = new LinkedHashSet<>();
        for (int[] line : BINGO_LINES) {
            boolean completed = true;
            for (int issueId : line) {
                if (!approvedBestScoreByIssue.containsKey(issueId)) {
                    completed = false;
                    break;
                }
            }
            if (completed) {
                for (int issueId : line) {
                    countedIssueIds.add(issueId);
                }
            }
        }

        double total = 0D;
        for (Integer issueId : countedIssueIds) {
            total += approvedBestScoreByIssue.getOrDefault(issueId, 0f);
        }
        return total;
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
