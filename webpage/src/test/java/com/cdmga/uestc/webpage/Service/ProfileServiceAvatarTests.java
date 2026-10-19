package com.cdmga.uestc.webpage.Service;

import com.cdmga.uestc.webpage.Entity.Profile;
import com.cdmga.uestc.webpage.Repository.ProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ProfileServiceAvatarTests {
    private final ProfileRepository repository = mock(ProfileRepository.class);
    private final ProfileService service = new ProfileService();

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "profileRepository", repository);
    }

    @Test
    void createsPendingProfileAndFlushesItBeforeReturning() {
        when(repository.findByIdentity_Id(42)).thenReturn(null);
        when(repository.saveAndFlush(org.mockito.ArgumentMatchers.any(Profile.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Profile saved = service.submitAvatarForReview(42, "/avatars/new.webp");

        assertEquals(42, saved.getIdentityId());
        assertEquals("/avatars/new.webp", saved.getAvatar());
        assertEquals(0, saved.getStatus());
        verify(repository).saveAndFlush(saved);
    }

    @Test
    void keepsExistingProfileFieldsWhenSubmittingAvatar() {
        Profile existing = new Profile();
        existing.setIdentityId(42);
        existing.setDescription("原有签名");
        existing.setTitle("原有头衔");
        existing.setStatus(1);
        when(repository.findByIdentity_Id(42)).thenReturn(existing);
        when(repository.saveAndFlush(existing)).thenReturn(existing);

        Profile saved = service.submitAvatarForReview(42, "/avatars/new.png");

        assertSame(existing, saved);
        assertEquals("原有签名", saved.getDescription());
        assertEquals("原有头衔", saved.getTitle());
        assertEquals("/avatars/new.png", saved.getAvatar());
        assertEquals(0, saved.getStatus());
        verify(repository).saveAndFlush(existing);
    }
}
