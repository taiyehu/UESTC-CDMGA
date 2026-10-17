package com.cdmga.uestc.webpage;

import com.cdmga.uestc.webpage.Entity.Award;
import com.cdmga.uestc.webpage.Entity.Course;
import com.cdmga.uestc.webpage.Entity.Identity;
import com.cdmga.uestc.webpage.Entity.Score;
import com.cdmga.uestc.webpage.Repository.AwardRepository;
import com.cdmga.uestc.webpage.Repository.CourseRepository;
import com.cdmga.uestc.webpage.Repository.IdentityRepository;
import com.cdmga.uestc.webpage.Repository.ScoreRepository;
import com.cdmga.uestc.webpage.Service.ScoreService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
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
    private AwardRepository awardRepository;

    @Mock
    private IdentityRepository identityRepository;

    @InjectMocks
    private ScoreService scoreService;

    @Test
    void rejectsRedemptionWhenBalanceIsBelowCost() {
        Score pending = pendingAward();
        when(scoreRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(pending));
        when(awardRepository.findByCourseIdForUpdate(3)).thenReturn(Optional.of(pending.getCourse().getAward()));
        when(identityRepository.findByIdForUpdate(2)).thenReturn(Optional.of(pending.getIdentity()));
        when(scoreRepository.sumRegularScoreByIdentityIdSince(eq(2), any(LocalDateTime.class))).thenReturn(30.0);
        when(scoreRepository.sumAwardScoreByIdentityIdSince(eq(2), any(LocalDateTime.class))).thenReturn(0.0);

        assertThrows(IllegalArgumentException.class,
                () -> scoreService.updateScore(1L, null, "", 999f, true, "", null));
        verify(scoreRepository, never()).save(any(Score.class));
    }

    @Test
    void approvesWhenBalanceEqualsConfiguredAwardCost() {
        Score pending = pendingAward();
        when(scoreRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(pending));
        when(awardRepository.findByCourseIdForUpdate(3)).thenReturn(Optional.of(pending.getCourse().getAward()));
        when(identityRepository.findByIdForUpdate(2)).thenReturn(Optional.of(pending.getIdentity()));
        when(scoreRepository.sumRegularScoreByIdentityIdSince(eq(2), any(LocalDateTime.class))).thenReturn(40.0);
        when(scoreRepository.sumAwardScoreByIdentityIdSince(eq(2), any(LocalDateTime.class))).thenReturn(0.0);
        when(scoreRepository.save(pending)).thenReturn(pending);

        Score approved = scoreService.updateScore(1L, null, "", 999f, true, "", null);

        assertEquals(-40f, approved.getScore());
        assertEquals(true, approved.getIsScored());
        assertEquals(0, approved.getCourse().getAward().getRemainingStock());
        assertEquals(true, approved.getCourse().getAward().getSoldOutAt() != null);
        assertEquals(null, approved.getCourse().getEndTime());
        verify(scoreRepository).rejectOtherPendingAwardScores(eq(3), eq(1L), eq("奖品已售罄"), any(LocalDateTime.class));
    }

    @Test
    void approvalConsumesOnlyOneUnitUntilSoldOut() {
        Score pending = pendingAward();
        pending.getCourse().getAward().setTotalStock(3);
        pending.getCourse().getAward().setRemainingStock(3);
        when(scoreRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(pending));
        when(awardRepository.findByCourseIdForUpdate(3)).thenReturn(Optional.of(pending.getCourse().getAward()));
        when(identityRepository.findByIdForUpdate(2)).thenReturn(Optional.of(pending.getIdentity()));
        when(scoreRepository.sumRegularScoreByIdentityIdSince(eq(2), any(LocalDateTime.class))).thenReturn(40.0);
        when(scoreRepository.sumAwardScoreByIdentityIdSince(eq(2), any(LocalDateTime.class))).thenReturn(0.0);
        when(scoreRepository.save(pending)).thenReturn(pending);

        scoreService.updateScore(1L, null, "", -40f, true, "", null);

        assertEquals(2, pending.getCourse().getAward().getRemainingStock());
        assertEquals(null, pending.getCourse().getAward().getSoldOutAt());
        verify(scoreRepository, never()).rejectOtherPendingAwardScores(eq(3), eq(1L), any(), any());
    }

    @Test
    void rejectionDoesNotConsumeStockOrPoints() {
        Score pending = pendingAward();
        when(scoreRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(pending));
        when(scoreRepository.save(pending)).thenReturn(pending);

        Score rejected = scoreService.rejectAwardScore(1L, "信息不完整");

        assertEquals(true, rejected.getIsScored());
        assertEquals(0f, rejected.getScore());
        assertEquals("信息不完整", rejected.getRemark());
        assertEquals(1, rejected.getCourse().getAward().getRemainingStock());
        verify(awardRepository, never()).save(any(Award.class));
    }

    @Test
    void rejectsSecondApplicationForSamePrize() {
        Course course = awardCourse();
        when(courseRepository.findById(3)).thenReturn(Optional.of(course));
        when(awardRepository.findByCourseIdForUpdate(3)).thenReturn(Optional.of(course.getAward()));
        when(identityRepository.findByIdForUpdate(2)).thenReturn(Optional.of(new Identity()));
        when(scoreRepository.existsAwardByIdentityIdAndCourseId(2, 3)).thenReturn(true);

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

    @Test
    void usesOctoberToSeptemberRankingWindow() {
        when(scoreRepository.findScoredRegularScoresBetween(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of());

        scoreService.calculateTotalScoreForAllUsers(2025);

        ArgumentCaptor<LocalDateTime> startCaptor = ArgumentCaptor.forClass(LocalDateTime.class);
        ArgumentCaptor<LocalDateTime> endCaptor = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(scoreRepository).findScoredRegularScoresBetween(startCaptor.capture(), endCaptor.capture());
        assertEquals(LocalDateTime.of(2025, 10, 1, 0, 0), startCaptor.getValue());
        assertEquals(LocalDateTime.of(2026, 10, 1, 0, 0), endCaptor.getValue());
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
        Award award = new Award();
        award.setCourse(course);
        award.setCost(40);
        award.setTotalStock(1);
        award.setRemainingStock(1);
        course.setAward(award);
        return course;
    }
}
