package com.cdmga.uestc.webpage.Controller;

import com.cdmga.uestc.webpage.Entity.Identity;
import com.cdmga.uestc.webpage.Entity.IdentityExtraProfile;
import com.cdmga.uestc.webpage.Repository.IdentityExtraProfileRepository;
import com.cdmga.uestc.webpage.Repository.IdentityRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpSession;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.when;

class IdentityExtraProfileControllerTests {
    private final IdentityRepository identities = mock(IdentityRepository.class);
    private final IdentityExtraProfileRepository extras = mock(IdentityExtraProfileRepository.class);
    private final IdentityExtraProfileController controller = new IdentityExtraProfileController(identities, extras);

    @Test
    void onlyLoggedInIdentityCanAccessOwnDetails() {
        MockHttpSession session = new MockHttpSession();
        assertEquals(HttpStatus.UNAUTHORIZED, controller.getMine(session).getStatusCode());
        assertEquals(HttpStatus.UNAUTHORIZED, controller.saveMine(
                new IdentityExtraProfileController.ExtraProfileRequest("123456789", "123456789@qq.com", "UESTC"), session).getStatusCode());
        verify(extras, never()).save(any());
    }

    @Test
    void validatesQqEmailAndUniversityBeforeSaving() {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("identityId", 42);
        assertEquals(HttpStatus.BAD_REQUEST, controller.saveMine(
                new IdentityExtraProfileController.ExtraProfileRequest("123456789", "other@example.com", "UESTC"), session).getStatusCode());
        assertEquals(HttpStatus.BAD_REQUEST, controller.saveMine(
                new IdentityExtraProfileController.ExtraProfileRequest("123456789", "123456789@qq.com", "OTHER"), session).getStatusCode());
        verify(extras, never()).save(any());
    }

    @Test
    void savesDetailsForSessionIdentity() {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("identityId", 42);
        Identity identity = new Identity();
        identity.setId(42);
        when(identities.findById(42)).thenReturn(Optional.of(identity));
        when(extras.findById(42)).thenReturn(Optional.empty());
        when(extras.save(any(IdentityExtraProfile.class))).thenAnswer(call -> call.getArgument(0));

        var result = controller.saveMine(new IdentityExtraProfileController.ExtraProfileRequest(
                "123456789", "123456789@qq.com", "SWJTU"), session);
        assertEquals(HttpStatus.OK, result.getStatusCode());
        var saved = assertInstanceOf(IdentityExtraProfileController.ExtraProfileResponse.class, result.getBody());
        assertEquals("SWJTU", saved.university());
        org.mockito.ArgumentCaptor<IdentityExtraProfile> captor = org.mockito.ArgumentCaptor.forClass(IdentityExtraProfile.class);
        verify(extras).save(captor.capture());
        assertEquals(42, captor.getValue().getIdentity().getId());
    }
    @Test
    void allowsEmptyQqFieldsAndStoresNull() {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("identityId", 42);
        Identity identity = new Identity();
        identity.setId(42);
        when(identities.findById(42)).thenReturn(Optional.of(identity));
        when(extras.findById(42)).thenReturn(Optional.empty());
        when(extras.save(any(IdentityExtraProfile.class))).thenAnswer(call -> call.getArgument(0));

        var result = controller.saveMine(new IdentityExtraProfileController.ExtraProfileRequest(
                "", "  ", "UESTC"), session);
        assertEquals(HttpStatus.OK, result.getStatusCode());
        var saved = assertInstanceOf(IdentityExtraProfileController.ExtraProfileResponse.class, result.getBody());
        assertEquals("", saved.qqNumber());
        assertEquals("", saved.qqEmail());
        org.mockito.ArgumentCaptor<IdentityExtraProfile> captor = org.mockito.ArgumentCaptor.forClass(IdentityExtraProfile.class);
        verify(extras).save(captor.capture());
        assertEquals(null, captor.getValue().getQqNumber());
        assertEquals(null, captor.getValue().getQqEmail());
    }

    @Test
    void publicSchoolResponseDoesNotExposeQqContacts() {
        IdentityExtraProfile extra = new IdentityExtraProfile();
        extra.setUniversity("SWJTU");
        extra.setQqNumber("123456789");
        extra.setQqEmail("alias@qq.com");
        when(extras.findById(42)).thenReturn(Optional.of(extra));
        var response = controller.getSchool(42);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("SWJTU", response.getBody().university());
        assertEquals(null, controller.getSchool(43).getBody().university());
    }}