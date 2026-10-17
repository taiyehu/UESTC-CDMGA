package com.cdmga.uestc.webpage;

import com.cdmga.uestc.webpage.Entity.Award;
import com.cdmga.uestc.webpage.Entity.Course;
import com.cdmga.uestc.webpage.Repository.AwardRepository;
import com.cdmga.uestc.webpage.Repository.CourseRepository;
import com.cdmga.uestc.webpage.Repository.ScoreRepository;
import com.cdmga.uestc.webpage.Service.CourseService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;

@ExtendWith(MockitoExtension.class)
class CourseAwardStockTests {
    @Mock private CourseRepository courseRepository;
    @Mock private AwardRepository awardRepository;
    @Mock private ScoreRepository scoreRepository;
    @InjectMocks private CourseService courseService;

    @Test
    void increasingTotalStockPreservesRedeemedCount() {
        Course course = courseWithStock(3, 1);
        when(courseRepository.findById(3)).thenReturn(Optional.of(course));
        when(awardRepository.findByCourseIdForUpdate(3)).thenReturn(Optional.of(course.getAward()));
        when(courseRepository.save(course)).thenReturn(course);

        courseService.updateCourse(3, "奖品", "award", course.getStartTime(), course.getEndTime(),
                "描述", "image", 40, 5);

        assertEquals(5, course.getAward().getTotalStock());
        assertEquals(3, course.getAward().getRemainingStock());
    }

    @Test
    void cannotReduceStockBelowRedeemedCount() {
        Course course = courseWithStock(3, 1);
        when(courseRepository.findById(3)).thenReturn(Optional.of(course));
        when(awardRepository.findByCourseIdForUpdate(3)).thenReturn(Optional.of(course.getAward()));

        assertThrows(IllegalArgumentException.class, () -> courseService.updateCourse(3,
                "奖品", "award", course.getStartTime(), course.getEndTime(), "描述", "image", 40, 1));
    }

    @Test
    void reducingStockToRedeemedCountRejectsPendingRequests() {
        Course course = courseWithStock(3, 1);
        when(courseRepository.findById(3)).thenReturn(Optional.of(course));
        when(awardRepository.findByCourseIdForUpdate(3)).thenReturn(Optional.of(course.getAward()));
        when(courseRepository.save(course)).thenReturn(course);

        courseService.updateCourse(3, "奖品", "award", course.getStartTime(), course.getEndTime(),
                "描述", "image", 40, 2);

        assertEquals(0, course.getAward().getRemainingStock());
        verify(scoreRepository).rejectOtherPendingAwardScores(eq(3), eq(-1L), eq("奖品已售罄"), any());
    }

    private Course courseWithStock(int total, int remaining) {
        Course course = new Course();
        course.setId(3);
        course.setTitle("奖品");
        course.setCategory("award");
        course.setStartTime(LocalDateTime.of(2026, 10, 1, 0, 0));
        course.setEndTime(LocalDateTime.of(2026, 12, 1, 0, 0));
        Award award = new Award();
        award.setCourse(course);
        award.setCost(40);
        award.setTotalStock(total);
        award.setRemainingStock(remaining);
        course.setAward(award);
        return course;
    }
}
