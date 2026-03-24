package com.cdmga.uestc.webpage.Service;

import com.cdmga.uestc.webpage.Entity.BingoTip;
import com.cdmga.uestc.webpage.Entity.Course;
import com.cdmga.uestc.webpage.Entity.Issue;
import com.cdmga.uestc.webpage.Repository.BingoTipRepository;
import com.cdmga.uestc.webpage.Repository.CourseRepository;
import com.cdmga.uestc.webpage.Repository.IssueRepository;
import com.cdmga.uestc.webpage.Repository.TeamRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.HashMap;

@Service
public class BingoTipService {

    @Autowired
    private BingoTipRepository bingoTipRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private IssueRepository issueRepository;

    @Autowired
    private TeamRepository teamRepository;

    private static final Pattern TEAM_ID_PATTERN = Pattern.compile("(\\d+)");

    private Course validateBingoCourse(Integer courseId) {
        if (courseId == null || courseId <= 0) {
            throw new IllegalArgumentException("course_id 无效");
        }

        Course course = courseRepository.findById(courseId).orElse(null);
        if (course == null || Boolean.TRUE.equals(course.getIsDeleted())) {
            throw new IllegalArgumentException("课题不存在");
        }

        String category = course.getCategory() == null ? "" : course.getCategory().trim().toLowerCase();
        if (!"bingo".equals(category)) {
            throw new IllegalArgumentException("仅 bingo 课题支持提示配置");
        }

        return course;
    }

    private void validateIssueExists(Integer courseId, Integer issueId) {
        if (issueId == null || issueId <= 0 || issueId > 25) {
            throw new IllegalArgumentException("issue_id 无效");
        }

        Issue issue = issueRepository.findByCourseIdAndIssueId(courseId, issueId).orElse(null);
        if (issue == null) {
            throw new IllegalArgumentException("对应子题不存在");
        }
    }

    private int resolveTeamId(Integer courseId, Integer teamId, String teamName) {
        Integer resolvedTeamId = teamId;

        if ((resolvedTeamId == null || resolvedTeamId <= 0) && teamName != null && !teamName.trim().isEmpty()) {
            Matcher matcher = TEAM_ID_PATTERN.matcher(teamName);
            if (matcher.find()) {
                resolvedTeamId = Integer.valueOf(matcher.group(1));
            }
        }

        if (resolvedTeamId == null || resolvedTeamId <= 0) {
            throw new IllegalArgumentException("team_id 或 team_name 无效");
        }

        if (teamRepository.countByCourseIdAndTeamId(courseId, resolvedTeamId) <= 0) {
            throw new IllegalArgumentException("解锁队伍不存在");
        }

        return resolvedTeamId;
    }

    private void fillTeamName(List<BingoTip> list) {
        if (list == null || list.isEmpty()) return;

        Map<Integer, String> teamNameMap = new HashMap<>();
        for (BingoTip item : list) {
            Integer teamId = item.getTeamId();
            if (teamId == null) continue;
            teamNameMap.put(teamId, "TEAM #" + teamId);
        }

        for (BingoTip item : list) {
            Integer teamId = item.getTeamId();
            if (teamId != null) {
                item.setTeamName(teamNameMap.getOrDefault(teamId, "TEAM #" + teamId));
            }
        }
    }

    public Page<BingoTip> getCourseTips(Integer courseId, Integer issueId, int page, int size) {
        validateBingoCourse(courseId);
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, size);
        Page<BingoTip> result;
        if (issueId != null) {
            validateIssueExists(courseId, issueId);
            result = bingoTipRepository.findByCourseIdAndIssueIdOrderByCreatedAtAscIdAsc(courseId, issueId, PageRequest.of(safePage, safeSize));
        } else {
            result = bingoTipRepository.findByCourseIdOrderByCreatedAtAscIdAsc(courseId, PageRequest.of(safePage, safeSize));
        }
        fillTeamName(result.getContent());
        return result;
    }

    public List<BingoTip> getCourseIssueTips(Integer courseId, Integer issueId) {
        validateBingoCourse(courseId);
        validateIssueExists(courseId, issueId);
        List<BingoTip> list = bingoTipRepository.findByCourseIdAndIssueIdOrderByCreatedAtAscIdAsc(courseId, issueId);
        fillTeamName(list);
        return list;
    }

    public BingoTip createTip(Integer courseId, Integer issueId, String tip, Integer teamId, String teamName) {
        Course course = validateBingoCourse(courseId);
        validateIssueExists(courseId, issueId);

        String normalizedTip = tip == null ? "" : tip.trim();
        if (normalizedTip.isEmpty()) {
            throw new IllegalArgumentException("tip 不能为空");
        }

        int resolvedTeamId = resolveTeamId(courseId, teamId, teamName);

        BingoTip bingoTip = new BingoTip();
        bingoTip.setCourse(course);
        bingoTip.setIssueId(issueId);
        bingoTip.setTip(normalizedTip);
        bingoTip.setTeamId(resolvedTeamId);
        BingoTip saved = bingoTipRepository.save(bingoTip);
        saved.setTeamName("TEAM #" + resolvedTeamId);
        return saved;
    }

    public void deleteTip(Integer courseId, Integer tipId) {
        validateBingoCourse(courseId);

        BingoTip target = bingoTipRepository.findByIdAndCourseId(tipId, courseId).orElse(null);
        if (target == null) {
            throw new IllegalArgumentException("提示不存在");
        }

        bingoTipRepository.delete(target);
    }
}
