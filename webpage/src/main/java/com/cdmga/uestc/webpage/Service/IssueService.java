package com.cdmga.uestc.webpage.Service;

import com.cdmga.uestc.webpage.Entity.Course;
import com.cdmga.uestc.webpage.Entity.Issue;
import com.cdmga.uestc.webpage.Repository.CourseRepository;
import com.cdmga.uestc.webpage.Repository.IssueRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class IssueService {

    @Autowired
    private IssueRepository issueRepository;

    @Autowired
    private CourseRepository courseRepository;

    public Page<Issue> getCourseIssues(Integer courseId, int page, int size) {
        Page<Issue> issuePage = issueRepository.findByCourseIdOrderByIssueIdAsc(courseId, PageRequest.of(page, size));

        Course course = courseRepository.findById(courseId).orElse(null);
        if (course == null || Boolean.TRUE.equals(course.getIsDeleted())) {
            return issuePage;
        }

        String category = course.getCategory() == null ? "" : course.getCategory().trim().toLowerCase();
        boolean isBingo = "bingo".equals(category);
        LocalDateTime now = LocalDateTime.now();

        if (isBingo && course.getStartTime() != null && now.isBefore(course.getStartTime())) {
            List<Issue> masked = new ArrayList<>();
            for (Issue source : issuePage.getContent()) {
                Issue item = new Issue();
                item.setId(source.getId());
                item.setIssueId(source.getIssueId());
                item.setText("请等待课题开始");
                item.setImage("");
                item.setFile("");
                item.setSongName(source.getSongName());
                masked.add(item);
            }
            return new PageImpl<>(masked, issuePage.getPageable(), issuePage.getTotalElements());
        }

        return issuePage;
    }

    public Issue upsertIssue(Integer courseId, Integer issueId, String image, String text, String file, String songName) {
        if (issueId == null || issueId <= 0) {
            throw new IllegalArgumentException("issue_id 必须是正整数");
        }

        Course course = courseRepository.findById(courseId).orElse(null);
        if (course == null || Boolean.TRUE.equals(course.getIsDeleted())) {
            throw new IllegalArgumentException("课题不存在");
        }

        String category = course.getCategory() == null ? "" : course.getCategory().trim().toLowerCase();
        int maxIssueCount = "bingo".equals(category) ? 25 : 6;

        if (issueId > maxIssueCount) {
            throw new IllegalArgumentException("issue_id 超出课题类别允许范围");
        }

        String normalizedSongName = songName == null ? null : songName.trim();

        if ("typical".equals(category)) {
            if (normalizedSongName == null || normalizedSongName.isEmpty()) {
                throw new IllegalArgumentException("typical 课题必须填写 song_name");
            }
            songName = normalizedSongName;
        } else if ("bingo".equals(category)) {
            if (normalizedSongName == null || normalizedSongName.isEmpty()) {
                throw new IllegalArgumentException("bingo 课题必须填写单个标记字符");
            }
            if (normalizedSongName.codePointCount(0, normalizedSongName.length()) != 1) {
                throw new IllegalArgumentException("bingo 课题 song_name 必须是单个字符");
            }
            songName = normalizedSongName;
        } else {
            songName = null;
        }

        Optional<Issue> existing = issueRepository.findByCourseIdAndIssueId(courseId, issueId);
        Issue issue = existing.orElseGet(Issue::new);

        issue.setCourse(course);
        issue.setIssueId(issueId);
        issue.setImage(image);
        issue.setText(text == null ? "" : text);
        issue.setFile(file);
        issue.setSongName(songName);

        return issueRepository.save(issue);
    }
}
