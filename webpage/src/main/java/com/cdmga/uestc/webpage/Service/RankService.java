package com.cdmga.uestc.webpage.Service;

import com.cdmga.uestc.webpage.Dto.RankConfigDto;
import com.cdmga.uestc.webpage.Dto.RankCourseOptionDto;
import com.cdmga.uestc.webpage.Dto.RankSubmissionDto;
import com.cdmga.uestc.webpage.Dto.RankUserDto;
import com.cdmga.uestc.webpage.Entity.Course;
import com.cdmga.uestc.webpage.Entity.Profile;
import com.cdmga.uestc.webpage.Entity.RankConfig;
import com.cdmga.uestc.webpage.Entity.Score;
import com.cdmga.uestc.webpage.Repository.CourseRepository;
import com.cdmga.uestc.webpage.Repository.ProfileRepository;
import com.cdmga.uestc.webpage.Repository.RankConfigRepository;
import com.cdmga.uestc.webpage.Repository.ScoreRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class RankService {

    @Autowired
    private ScoreRepository scoreRepository;

    @Autowired
    private RankConfigRepository rankConfigRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private ProfileRepository profileRepository;

    public List<RankUserDto> getRankBoardByCategory(String category, String mode, Integer courseId) {
        String normalizedCategory = category == null ? "" : category.trim().toLowerCase();
        String normalizedMode = mode == null ? "active" : mode.trim().toLowerCase();
        Set<Integer> targetCourseIds = resolveTargetCourseIds(normalizedCategory, normalizedMode, courseId);
        if (targetCourseIds.isEmpty()) {
            return new ArrayList<>();
        }

        List<Score> scores = scoreRepository.findScoredNotDeletedByCategoryAndCourseIds(normalizedCategory, targetCourseIds);
        Map<Integer, Float> countingRuleByCourse = getCountingRuleByCourse();

        Map<Integer, RankUserDto> userMap = new HashMap<>();
        Map<Integer, boolean[]> userRuleMixMap = new HashMap<>();
        for (Score score : scores) {
            if (score.getIdentity() == null || score.getIdentity().getId() == null || score.getCourse() == null || score.getCourse().getId() == null) {
                continue;
            }

            Integer identityId = score.getIdentity().getId();
            Integer scoreCourseId = score.getCourse().getId();
            float rawScore = score.getScore() == null ? 0f : score.getScore();
            float countingRule = countingRuleByCourse.getOrDefault(scoreCourseId, 0f);
                boolean specialPercentRule = Math.abs(countingRule - 101f) < 0.0001f;
                float displayScore = specialPercentRule ? (rawScore / 10000f) : (rawScore + countingRule);
                String displayScoreText = specialPercentRule
                    ? String.format(Locale.US, "%.4f%%", displayScore)
                    : null;

            RankUserDto userDto = userMap.computeIfAbsent(identityId, key -> {
                RankUserDto dto = new RankUserDto();
                dto.setIdentityId(identityId);
                dto.setAccount(score.getIdentity().getAccount());

                Profile profile = profileRepository.findPassedProfileByIdentityId(identityId);
                dto.setAvatar(profile != null ? profile.getAvatar() : null);
                return dto;
            });

            userDto.setTotalScore(userDto.getTotalScore() + displayScore);

            boolean[] ruleMix = userRuleMixMap.computeIfAbsent(identityId, k -> new boolean[] {false, false});
            if (specialPercentRule) {
                ruleMix[0] = true;
            } else {
                ruleMix[1] = true;
            }

            RankSubmissionDto submissionDto = new RankSubmissionDto();
            submissionDto.setScoreId(score.getId());
            submissionDto.setCourseId(scoreCourseId);
            submissionDto.setCourseTitle(score.getCourse().getTitle());
            submissionDto.setImage(score.getImage());
            submissionDto.setRawScore(rawScore);
            submissionDto.setDisplayScore(displayScore);
            submissionDto.setDisplayScoreText(displayScoreText);
            submissionDto.setSpecialPercentRule(specialPercentRule);
            submissionDto.setUploadTime(score.getUploadTime());
            userDto.getSubmissions().add(submissionDto);
        }

        List<RankUserDto> result = new ArrayList<>(userMap.values());
        for (RankUserDto dto : result) {
            boolean[] ruleMix = userRuleMixMap.get(dto.getIdentityId());
            if (ruleMix != null && ruleMix[0] && !ruleMix[1]) {
                dto.setTotalScoreText(String.format(Locale.US, "%.4f%%", dto.getTotalScore()));
            } else {
                dto.setTotalScoreText(null);
            }
            dto.getSubmissions().sort((a, b) -> {
                LocalDateTime t1 = a.getUploadTime();
                LocalDateTime t2 = b.getUploadTime();
                if (t1 == null && t2 == null) return 0;
                if (t1 == null) return 1;
                if (t2 == null) return -1;
                return t2.compareTo(t1);
            });
        }
        result.sort(Comparator.comparing(RankUserDto::getTotalScore, Comparator.nullsLast(Float::compareTo)).reversed());
        return result;
    }

    public List<RankCourseOptionDto> listCoursesByCategory(String category) {
        String normalizedCategory = category == null ? "" : category.trim().toLowerCase();
        List<Course> courses = courseRepository.findAllByCategory(normalizedCategory);
        List<RankCourseOptionDto> result = new ArrayList<>();
        for (Course course : courses) {
            result.add(toCourseOptionDto(course));
        }
        return result;
    }

    public RankConfigDto saveOrUpdateConfig(Integer courseId, Float countingRules) {
        if (courseId == null || courseId <= 0) {
            throw new IllegalArgumentException("courseId 无效");
        }

        float normalizedRules = countingRules == null ? 0f : countingRules;
        Course course = courseRepository.findById(courseId).orElse(null);
        if (course == null || Boolean.TRUE.equals(course.getIsDeleted())) {
            throw new IllegalArgumentException("课题不存在");
        }

        RankConfig config = rankConfigRepository.findByCourseIdAndIsDeletedFalse(courseId).orElseGet(RankConfig::new);
        LocalDateTime now = LocalDateTime.now();
        if (config.getId() == null) {
            config.setCreatedAt(now);
            config.setIsDeleted(false);
            config.setCourse(course);
        }
        config.setCountingRules(normalizedRules);
        config.setUpdatedAt(now);

        RankConfig saved = rankConfigRepository.save(config);
        return toConfigDto(saved);
    }

    public List<RankConfigDto> listConfigs() {
        List<RankConfig> configs = rankConfigRepository.findByIsDeletedFalse();
        List<RankConfigDto> result = new ArrayList<>();
        for (RankConfig config : configs) {
            result.add(toConfigDto(config));
        }
        return result;
    }

    private Map<Integer, Float> getCountingRuleByCourse() {
        Map<Integer, Float> map = new HashMap<>();
        List<RankConfig> configs = rankConfigRepository.findByIsDeletedFalse();
        for (RankConfig config : configs) {
            if (config.getCourse() == null || config.getCourse().getId() == null) {
                continue;
            }
            map.put(config.getCourse().getId(), config.getCountingRules() == null ? 0f : config.getCountingRules());
        }
        return map;
    }

    private Set<Integer> resolveTargetCourseIds(String category, String mode, Integer courseId) {
        Set<Integer> ids = new LinkedHashSet<>();

        if (courseId != null && courseId > 0) {
            Course one = courseRepository.findById(courseId).orElse(null);
            if (one != null && !Boolean.TRUE.equals(one.getIsDeleted()) && category.equalsIgnoreCase(one.getCategory())) {
                ids.add(one.getId());
            }
            return ids;
        }

        List<Course> courses;
        if ("history".equals(mode)) {
            courses = courseRepository.findAllByCategory(category);
        } else {
            courses = courseRepository.findActiveByCategory(category, LocalDateTime.now());
        }

        for (Course course : courses) {
            if (course.getId() != null) {
                ids.add(course.getId());
            }
        }
        return ids;
    }

    private RankCourseOptionDto toCourseOptionDto(Course course) {
        RankCourseOptionDto dto = new RankCourseOptionDto();
        dto.setId(course.getId());
        dto.setTitle(course.getTitle());
        dto.setCategory(course.getCategory());
        dto.setStartTime(course.getStartTime());
        dto.setEndTime(course.getEndTime());
        return dto;
    }

    private RankConfigDto toConfigDto(RankConfig config) {
        RankConfigDto dto = new RankConfigDto();
        dto.setId(config.getId());
        if (config.getCourse() != null) {
            dto.setCourseId(config.getCourse().getId());
            dto.setCourseTitle(config.getCourse().getTitle());
            dto.setCategory(config.getCourse().getCategory());
        }
        dto.setCountingRules(config.getCountingRules());
        return dto;
    }
}
