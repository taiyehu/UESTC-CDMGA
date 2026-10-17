package com.cdmga.uestc.webpage.Service;

import com.cdmga.uestc.webpage.Entity.Activity;
import com.cdmga.uestc.webpage.Entity.ActivityCourseAssoc;
import com.cdmga.uestc.webpage.Entity.Course;
import com.cdmga.uestc.webpage.Entity.Identity;
import com.cdmga.uestc.webpage.Entity.Score;
import com.cdmga.uestc.webpage.Repository.ActivityCourseAssocRepository;
import com.cdmga.uestc.webpage.Repository.ActivityRepository;
import com.cdmga.uestc.webpage.Repository.IdentityRepository;
import com.cdmga.uestc.webpage.Repository.ScoreRepository;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SignCheckinService {
    private static final ZoneId SITE_ZONE = ZoneId.of("Asia/Shanghai");
    private static final float POINTS = 10f;
    private final ActivityRepository activities;
    private final ActivityCourseAssocRepository associations;
    private final IdentityRepository identities;
    private final ScoreRepository scores;
    private final SignTokenService tokens;

    public SignCheckinService(ActivityRepository activities, ActivityCourseAssocRepository associations,
            IdentityRepository identities, ScoreRepository scores, SignTokenService tokens) {
        this.activities = activities;
        this.associations = associations;
        this.identities = identities;
        this.scores = scores;
        this.tokens = tokens;
    }

    public SignTokenService.IssuedToken issue(int activityId) {
        eligibleCourse(activityId, LocalDateTime.now(SITE_ZONE));
        return tokens.issue(activityId);
    }

    @Transactional
    public CheckinResult checkIn(int identityId, int activityId, String token) {
        if (!tokens.valid(activityId, token)) {
            throw new IllegalArgumentException("签到码已过期或无效，请扫描现场最新二维码");
        }
        LocalDateTime now = LocalDateTime.now(SITE_ZONE);
        Course course = eligibleCourse(activityId, now);
        Identity identity = identities.findByIdForUpdate(identityId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        if (Boolean.TRUE.equals(identity.getIsDeleted())) {
            throw new IllegalArgumentException("用户不可签到");
        }
        if (scores.existsSignByIdentityIdAndActivityId(identityId, activityId)) {
            return new CheckinResult(true, 0);
        }
        Score score = new Score(now);
        score.setIdentity(identity);
        score.setCourse(course);
        score.setUploadTime(now);
        score.setImage("");
        score.setUpdatedAt(now);
        score.setScore(POINTS);
        score.setIsScored(true);
        score.setRemark("现场签到自动计分");
        scores.save(score);
        return new CheckinResult(false, 10);
    }

    private Course eligibleCourse(int activityId, LocalDateTime now) {
        Activity activity = activities.findByIdAndIsDeletedFalse(activityId);
        if (activity == null) throw new IllegalArgumentException("活动不存在");
        if (activity.getStartTime() == null || activity.getEndTime() == null
                || now.isBefore(activity.getStartTime()) || now.isAfter(activity.getEndTime())) {
            throw new IllegalArgumentException("当前不在活动签到时间内");
        }
        List<Course> signCourses = associations.findByActivityId(activityId).stream()
                .map(ActivityCourseAssoc::getCourse)
                .filter(course -> course != null && !Boolean.TRUE.equals(course.getIsDeleted())
                        && "sign".equalsIgnoreCase(course.getCategory() == null ? "" : course.getCategory().trim()))
                .distinct().toList();
        if (signCourses.size() != 1) {
            throw new IllegalArgumentException("该活动需要且只能关联一个签到课题");
        }
        Course course = signCourses.get(0);
        boolean linkedElsewhere = associations.findByCourseId(course.getId()).stream()
                .map(ActivityCourseAssoc::getActivity)
                .anyMatch(linkedActivity -> linkedActivity != null && !activityIdEquals(linkedActivity.getId(), activityId));
        if (linkedElsewhere) throw new IllegalArgumentException("签到课题已关联其他活动");
        if (course.getStartTime() == null || course.getEndTime() == null
                || now.isBefore(course.getStartTime()) || now.isAfter(course.getEndTime())) {
            throw new IllegalArgumentException("当前不在签到课题开放时间内");
        }
        return course;
    }

    private boolean activityIdEquals(Integer left, int right) {
        return left != null && left == right;
    }

    public record CheckinResult(boolean alreadyCheckedIn, int pointsAwarded) {}
}
