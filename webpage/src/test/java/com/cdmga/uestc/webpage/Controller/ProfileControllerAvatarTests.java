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
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
    void combinedSubmissionCreatesPendingProfileBeforeReportingSuccess() throws Exception {
        MockMultipartFile avatar = new MockMultipartFile("avatar", "photo.png", "image/png", new byte[] {1, 2, 3});

        ResponseEntity<Result> response = controller.submitProfile(42, "新签名", avatar, session);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(0, response.getBody().getCode());
        String url = (String) response.getBody().getData();
        assertTrue(url.matches("/avatars/[0-9a-f-]+\\.png"));
        assertArrayEquals(new byte[] {1, 2, 3}, Files.readAllBytes(uploadDir.resolve(url.substring("/avatars/".length()))));
        assertNotNull(profileService.saved);
        assertEquals(42, profileService.saved.getIdentityId());
        assertEquals(0, profileService.saved.getStatus());
        assertEquals(url, profileService.saved.getAvatar());
        assertEquals("新签名", profileService.saved.getDescription());
    }

    @Test
    void failedSaveReturnsErrorAndRemovesUploadedFile() throws Exception {
        profileService.failSave = true;
        MockMultipartFile avatar = new MockMultipartFile("avatar", "photo.webp", "image/webp", new byte[] {1});

        ResponseEntity<Result> response = controller.submitProfile(42, "新签名", avatar, session);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertEquals(1, response.getBody().getCode());
        try (var files = Files.list(uploadDir)) {
            assertEquals(0, files.count());
        }
    }

    @Test
    void combinedSubmissionUpdatesExistingProfile() {
        Profile existing = new Profile();
        existing.setIdentityId(42);
        existing.setDescription("原有签名");
        existing.setStatus(1);
        profileService.existing = existing;
        MockMultipartFile avatar = new MockMultipartFile("avatar", "photo.png", "image/png", new byte[] {1});

        ResponseEntity<Result> response = controller.submitProfile(42, "新签名", avatar, session);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(existing, profileService.saved);
        assertEquals("新签名", profileService.saved.getDescription());
        assertEquals(0, profileService.saved.getStatus());
    }

    @Test
    void descriptionOnlySubmissionPreservesExistingAvatar() {
        Profile existing = new Profile();
        existing.setIdentityId(42);
        existing.setAvatar("/avatars/old.png");
        profileService.existing = existing;

        ResponseEntity<Result> response = controller.submitProfile(42, "新签名", null, session);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("/avatars/old.png", profileService.saved.getAvatar());
        assertEquals("新签名", profileService.saved.getDescription());
    }

    @Test
    void multipartPutReachesCombinedSubmission() throws Exception {
        MockMvc mvc = MockMvcBuilders.standaloneSetup(controller).build();
        MockMultipartFile avatar = new MockMultipartFile("avatar", "photo.png", "image/png", new byte[] {1});

        mvc.perform(MockMvcRequestBuilders.multipart("/api/profile/42")
                .file(avatar)
                .param("description", "新签名")
                .session(session)
                .with(request -> { request.setMethod("PUT"); return request; }))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0));

        assertEquals("新签名", profileService.saved.getDescription());
        assertEquals(0, profileService.saved.getStatus());
    }

    @Test
    void unauthenticatedUploadDoesNotWriteFileOrProfile() throws Exception {
        session.removeAttribute("identityId");
        MockMultipartFile avatar = new MockMultipartFile("avatar", "photo.png", "image/png", new byte[] {1});

        ResponseEntity<Result> response = controller.submitProfile(42, "新签名", avatar, session);

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

        @Override
        public Profile getProfileByIdentityId(Integer identityId) {
            return existing;
        }

        @Override
        public Profile saveProfile(Profile profile) {
            if (failSave) throw new RuntimeException("database unavailable");
            saved = profile;
            return profile;
        }
    }
}
