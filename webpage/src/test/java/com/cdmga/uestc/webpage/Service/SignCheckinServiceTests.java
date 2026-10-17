package com.cdmga.uestc.webpage.Service;

import static org.junit.jupiter.api.Assertions.*;

import com.cdmga.uestc.webpage.Entity.Activity;
import com.cdmga.uestc.webpage.Entity.ActivityCourseAssoc;
import com.cdmga.uestc.webpage.Entity.Course;
import com.cdmga.uestc.webpage.Entity.Identity;
import com.cdmga.uestc.webpage.Entity.Score;
import com.cdmga.uestc.webpage.Controller.SignController;
import com.cdmga.uestc.webpage.Repository.ActivityCourseAssocRepository;
import com.cdmga.uestc.webpage.Repository.ActivityRepository;
import com.cdmga.uestc.webpage.Repository.CourseRepository;
import com.cdmga.uestc.webpage.Repository.IdentityRepository;
import com.cdmga.uestc.webpage.Repository.ScoreRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.lang.reflect.Proxy;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Function;
import java.lang.reflect.Method;
import java.lang.reflect.Field;
import java.util.Base64;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.mock.web.MockMultipartFile;
import com.cdmga.uestc.webpage.common.Result;
import org.junit.jupiter.api.Test;

class SignCheckinServiceTests {
    private static final String SECRET = "0123456789abcdef0123456789abcdef";

    @Test
    void tokenRejectsWrongActivityTamperingAndExpiry() {
        Instant now = Instant.parse("2026-10-17T04:00:05Z");
        SignTokenService issued = new SignTokenService(SECRET, Clock.fixed(now, ZoneOffset.UTC));
        String token = issued.issue(7).token();
        assertTrue(issued.valid(7, token));
        assertFalse(issued.valid(8, token));
        assertFalse(issued.valid(7, token + "x"));
        SignTokenService grace = new SignTokenService(SECRET, Clock.fixed(now.plusSeconds(60), ZoneOffset.UTC));
        assertTrue(grace.valid(7, token));
        SignTokenService expired = new SignTokenService(SECRET, Clock.fixed(now.plusSeconds(90), ZoneOffset.UTC));
        assertFalse(expired.valid(7, token));
    }

    @Test
    void checkinAwardsTenPointsOnceAndRejectsInvalidToken() {
        SignTokenService tokens = new SignTokenService(SECRET);
        LocalDateTime now = LocalDateTime.now(ZoneId.of("Asia/Shanghai"));
        Activity activity = new Activity();
        activity.setStartTime(now.minusHours(1));
        activity.setEndTime(now.plusHours(1));
        Course course = new Course();
        course.setCategory("sign");
        course.setStartTime(now.minusHours(1));
        course.setEndTime(now.plusHours(1));
        ActivityCourseAssoc assoc = new ActivityCourseAssoc();
        assoc.setCourse(course);
        Identity identity = new Identity();
        identity.setId(5);
        AtomicBoolean already = new AtomicBoolean(false);
        AtomicReference<Score> saved = new AtomicReference<>();
        ActivityRepository activities = repository(ActivityRepository.class, method -> activity);
        ActivityCourseAssocRepository associations = repository(ActivityCourseAssocRepository.class,
                method -> method.getName().equals("findByActivityId") ? List.of(assoc) : List.of());
        IdentityRepository identities = repository(IdentityRepository.class, method -> Optional.of(identity));
        ScoreRepository scores = repository(ScoreRepository.class, method -> {
            if (method.getName().equals("existsSignByIdentityIdAndActivityId")) return already.get();
            return null;
        }, saved);
        SignCheckinService service = new SignCheckinService(activities, associations, identities, scores, tokens);
        String token = tokens.issue(7).token();

        var first = service.checkIn(5, 7, token);
        assertEquals(10, first.pointsAwarded());
        assertFalse(first.alreadyCheckedIn());
        assertNotNull(saved.get());
        assertEquals(10f, saved.get().getScore());
        assertEquals("", saved.get().getImage());
        assertTrue(saved.get().getIsScored());
        assertSame(identity, saved.get().getIdentity());
        assertSame(course, saved.get().getCourse());

        already.set(true);
        saved.set(null);
        var again = service.checkIn(5, 7, token);
        assertTrue(again.alreadyCheckedIn());
        assertEquals(0, again.pointsAwarded());
        assertNull(saved.get());
        assertThrows(IllegalArgumentException.class, () -> service.checkIn(5, 7, token + "x"));
    }

    @Test
    void ordinaryScoreSubmissionCannotAwardSignPoints() throws Exception {
        ScoreService service = new ScoreService();
        Course course = new Course();
        course.setCategory("sign");
        course.setStartTime(LocalDateTime.now().minusHours(1));
        course.setEndTime(LocalDateTime.now().plusHours(1));
        CourseRepository courses = repository(CourseRepository.class, method -> Optional.of(course));
        Field field = ScoreService.class.getDeclaredField("courseRepository");
        field.setAccessible(true);
        field.set(service, courses);
        assertThrows(IllegalArgumentException.class,
                () -> service.postNewScore(7, 5, null, null, 0, false, null));
    }

    @Test
    void qrRequiresAdminAndReturnsPng() {
        LocalDateTime now = LocalDateTime.now(ZoneId.of("Asia/Shanghai"));
        Activity activity = new Activity();
        activity.setStartTime(now.minusHours(1));
        activity.setEndTime(now.plusHours(1));
        Course course = new Course();
        course.setId(9);
        course.setCategory("sign");
        course.setStartTime(now.minusHours(1));
        course.setEndTime(now.plusHours(1));
        ActivityCourseAssoc assoc = new ActivityCourseAssoc();
        assoc.setCourse(course);
        ActivityRepository activities = repository(ActivityRepository.class, method -> activity);
        ActivityCourseAssocRepository associations = repository(ActivityCourseAssocRepository.class,
                method -> method.getName().equals("findByActivityId") ? List.of(assoc) : List.of());
        Identity admin = new Identity();
        admin.setId(1);
        admin.setRole("admin");
        IdentityRepository identities = repository(IdentityRepository.class, method -> Optional.of(admin));
        ScoreRepository scores = repository(ScoreRepository.class, method -> false);
        SignController controller = new SignController(
                new SignCheckinService(activities, associations, identities, scores, new SignTokenService(SECRET)), identities);
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("identityId", 1);
        Result result = controller.qr(7, "https://example.com", session).getBody();
        assertNotNull(result);
        assertEquals(0, result.getCode());
        assertTrue(((SignController.QrResponse) result.getData()).image().startsWith("data:image/png;base64,"));
        String imageData = ((SignController.QrResponse) result.getData()).image().substring("data:image/png;base64,".length());
        MockMultipartFile imageFile = new MockMultipartFile("image", "sign.png", "image/png", Base64.getDecoder().decode(imageData));
        Result decoded = controller.decode(imageFile, session).getBody();
        assertNotNull(decoded);
        assertEquals(0, decoded.getCode(), decoded.getMessage());
        assertTrue(((String) decoded.getData()).startsWith("https://example.com/sign/7?token="));
        admin.setRole("user");
        assertEquals(403, controller.qr(7, "https://example.com", session).getStatusCode().value());
    }

    private static <T> T repository(Class<T> type, Function<Method, Object> handler) {
        return repository(type, handler, null);
    }

    private static <T> T repository(Class<T> type, Function<Method, Object> handler, AtomicReference<Score> saved) {
        return type.cast(Proxy.newProxyInstance(type.getClassLoader(), new Class<?>[] {type}, (proxy, method, args) -> {
            if (method.getName().equals("save") && saved != null) {
                saved.set((Score) args[0]);
                return args[0];
            }
            return handler.apply(method);
        }));
    }
}
