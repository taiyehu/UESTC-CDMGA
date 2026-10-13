package com.cdmga.uestc.webpage;

import com.cdmga.uestc.webpage.Entity.Course;
import com.cdmga.uestc.webpage.Entity.Identity;
import com.cdmga.uestc.webpage.Entity.Score;
import com.cdmga.uestc.webpage.Repository.CourseRepository;
import com.cdmga.uestc.webpage.Repository.IdentityRepository;
import com.cdmga.uestc.webpage.Repository.ScoreRepository;
import com.cdmga.uestc.webpage.Service.ScoreService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ScoreAwardServiceTests {

    @Mock
    private ScoreRepository scoreRepository;

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private IdentityRepository identityRepository;

    @InjectMocks
    private ScoreService scoreService;

    @Test
    void rejectsRedemptionWhenBalanceWouldReachZero() {
        Score pending = pendingAward();
        when(scoreRepository.findById(1L)).thenReturn(Optional.of(pending));
        when(identityRepository.findByIdForUpdate(2)).thenReturn(Optional.of(pending.getIdentity()));
        when(scoreRepository.sumRegularScoreByIdentityId(2)).thenReturn(50.0);
        when(scoreRepository.sumAwardScoreByIdentityId(2)).thenReturn(-10.0);

        assertThrows(IllegalArgumentException.class,
                () -> scoreService.updateScore(1L, null, "", 999f, true, "", null));
        verify(scoreRepository, never()).save(any(Score.class));
    }

    @Test
    void approvesWithFixedAwardCost() {
        Score pending = pendingAward();
        when(scoreRepository.findById(1L)).thenReturn(Optional.of(pending));
        when(identityRepository.findByIdForUpdate(2)).thenReturn(Optional.of(pending.getIdentity()));
        when(scoreRepository.sumRegularScoreByIdentityId(2)).thenReturn(41.0);
        when(scoreRepository.sumAwardScoreByIdentityId(2)).thenReturn(0.0);
        when(scoreRepository.save(pending)).thenReturn(pending);

        Score approved = scoreService.updateScore(1L, null, "", 999f, true, "", null);

        assertEquals(-40f, approved.getScore());
        assertEquals(true, approved.getIsScored());
    }

    @Test
    void rejectsSecondApplicationForSamePrize() {
        Course course = awardCourse();
        when(courseRepository.findById(3)).thenReturn(Optional.of(course));
        when(identityRepository.findByIdForUpdate(2)).thenReturn(Optional.of(new Identity()));
        when(scoreRepository.existsAwardByIdentityIdAndTitle(2, "一等奖")).thenReturn(true);

        assertThrows(IllegalArgumentException.class,
                () -> scoreService.postNewScore(3, 2, null, "", 0f, false, ""));
        verify(scoreRepository, never()).save(any(Score.class));
    }

    @Test
    void cannotDeleteApprovedAward() {
        Score approved = pendingAward();
        approved.setIsScored(true);
        approved.setScore(-40f);
        when(scoreRepository.findById(1L)).thenReturn(Optional.of(approved));

        assertThrows(IllegalArgumentException.class, () -> scoreService.deleteScore(1L));
        verify(scoreRepository, never()).save(any(Score.class));
    }

    private Score pendingAward() {
        Score score = new Score(LocalDateTime.now());
        score.setId(1L);
        score.setCourse(awardCourse());
        Identity identity = new Identity();
        identity.setId(2);
        score.setIdentity(identity);
        score.setUploadTime(LocalDateTime.now());
        score.setScore(0f);
        score.setIsScored(false);
        return score;
    }

    private Course awardCourse() {
        Course course = new Course();
        course.setId(3);
        course.setTitle("一等奖");
        course.setCategory("award");
        return course;
    }
}
