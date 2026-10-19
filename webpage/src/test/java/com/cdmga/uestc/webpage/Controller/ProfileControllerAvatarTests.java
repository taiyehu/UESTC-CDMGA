package com.cdmga.uestc.webpage.Controller;

import com.cdmga.uestc.webpage.Entity.Profile;
import com.cdmga.uestc.webpage.Service.ProfileService;
import com.cdmga.uestc.webpage.common.Result;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class ProfileControllerAvatarTests {
    @TempDir Path uploadDir;

    private final ProfileController controller = new ProfileController();
    private final RecordingProfileService profileService = new RecordingProfileService();
    private final MockHttpSession session = new MockHttpSession();

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(controller, "profileService", profileService);
        ReflectionTestUtils.setField(controller, "uploadDir", uploadDir.toString());
        session.setAttribute("identityId", 42);
    }

    @Test
    void uploadCreatesPendingProfileBeforeReportingSuccess() throws Exception {
        MockMultipartFile avatar = new MockMultipartFile("avatar", "photo.png", "image/png", new byte[] {1, 2, 3});

        ResponseEntity<Result> response = controller.uploadAvatar(avatar, session);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(0, response.getBody().getCode());
        String url = (String) response.getBody().getData();
        assertTrue(url.matches("/avatars/[0-9a-f-]+\\.png"));
        assertArrayEquals(new byte[] {1, 2, 3}, Files.readAllBytes(uploadDir.resolve(url.substring("/avatars/".length()))));
        assertEquals(42, profileService.submittedIdentityId);
        assertEquals(url, profileService.submittedAvatarUrl);
    }

    @Test
    void failedSaveReturnsErrorAndRemovesUploadedFile() throws Exception {
        profileService.failSave = true;
        MockMultipartFile avatar = new MockMultipartFile("avatar", "photo.webp", "image/webp", new byte[] {1});

        ResponseEntity<Result> response = controller.uploadAvatar(avatar, session);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertEquals(1, response.getBody().getCode());
        try (var files = Files.list(uploadDir)) {
            assertEquals(0, files.count());
        }
    }

    @Test
    void uploadKeepsExistingDescriptionWhilePuttingAvatarInReview() {
        Profile existing = new Profile();
        existing.setIdentityId(42);
        existing.setDescription("原有签名");
        existing.setStatus(1);
        profileService.existing = existing;
        MockMultipartFile avatar = new MockMultipartFile("avatar", "photo.png", "image/png", new byte[] {1});

        ResponseEntity<Result> response = controller.uploadAvatar(avatar, session);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(existing, profileService.saved);
        assertEquals("原有签名", profileService.saved.getDescription());
        assertEquals(0, profileService.saved.getStatus());
    }

    @Test
    void unauthenticatedUploadDoesNotWriteFileOrProfile() throws Exception {
        session.removeAttribute("identityId");
        MockMultipartFile avatar = new MockMultipartFile("avatar", "photo.png", "image/png", new byte[] {1});

        ResponseEntity<Result> response = controller.uploadAvatar(avatar, session);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertNull(profileService.saved);
        try (var files = Files.list(uploadDir)) {
            assertEquals(0, files.count());
        }
    }

    private static class RecordingProfileService extends ProfileService {
        Profile saved;
        Profile existing;
        boolean failSave;
        Integer submittedIdentityId;
        String submittedAvatarUrl;

        @Override
        public Profile getProfileByIdentityId(Integer identityId) {
            return existing;
        }

        @Override
        public Profile submitAvatarForReview(Integer identityId, String avatarUrl) {
            if (failSave) throw new RuntimeException("database unavailable");
            submittedIdentityId = identityId;
            submittedAvatarUrl = avatarUrl;
            Profile profile = existing;
            if (profile == null) {
                profile = new Profile();
                profile.setIdentityId(identityId);
            }
            profile.setAvatar(avatarUrl);
            profile.setStatus(0);
            saved = profile;
            return saved;
        }
    }
}
