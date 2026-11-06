package com.cdmga.uestc.webpage.Configuration;

import com.cdmga.uestc.webpage.Entity.Identity;
import com.cdmga.uestc.webpage.Repository.IdentityRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ApiAuthorizationInterceptorTests {
    private IdentityRepository identities;
    private ApiAuthorizationInterceptor interceptor;

    @BeforeEach
    void setUp() {
        identities = mock(IdentityRepository.class);
        interceptor = new ApiAuthorizationInterceptor(identities);
    }

    @Test
    void allowsLoginAndRegistrationWithoutSession() throws Exception {
        assertTrue(intercept("POST", "/api/identity/login", null).allowed());
        assertTrue(intercept("POST", "/api/identity/register", null).allowed());
        verifyNoInteractions(identities);
    }

    @Test
    void rejectsCrossOriginStateChanges() throws Exception {
        var result = intercept("POST", "/api/identity/login", null, "https://attacker.example");
        assertFalse(result.allowed());
        assertEquals(403, result.response().getStatus());
    }

    @Test
    void allowsConfiguredDevelopmentOrigin() throws Exception {
        ReflectionTestUtils.setField(interceptor, "allowedOrigins", "http://localhost:5174");
        when(identities.findById(1)).thenReturn(Optional.of(identity(1, "admin", false)));
        var result = intercept("POST", "/api/course/post", authenticatedSession(1), "http://localhost:5174");
        assertTrue(result.allowed());
    }

    @Test
    void rejectsAnonymousApiAccess() throws Exception {
        var result = intercept("GET", "/api/identity/me", null);
        assertFalse(result.allowed());
        assertEquals(401, result.response().getStatus());
    }

    @Test
    void keepsPublicHomeDataReadableWithoutASession() throws Exception {
        assertTrue(intercept("GET", "/api/course/standalone", null).allowed());
        assertTrue(intercept("GET", "/api/forum/posts", null).allowed());
        assertTrue(intercept("GET", "/api/activity/all", null).allowed());
        verifyNoInteractions(identities);
    }

    @Test
    void requiresSessionForPersonalEndpoints() throws Exception {
        var result = intercept("GET", "/api/team/course/12/my", null);
        assertFalse(result.allowed());
        assertEquals(401, result.response().getStatus());
    }

    @Test
    void ordinaryUserCannotWriteAdminResources() throws Exception {
        when(identities.findById(4)).thenReturn(Optional.of(identity(4, "user", false)));
        var result = intercept("POST", "/api/course/post", authenticatedSession(4));
        assertFalse(result.allowed());
        assertEquals(403, result.response().getStatus());
    }

    @Test
    void onlyAdministratorsCanRequestUnmaskedIssues() throws Exception {
        when(identities.findById(4)).thenReturn(Optional.of(identity(4, "user", false)));
        MockHttpServletRequest userRequest = new MockHttpServletRequest();
        userRequest.setMethod("GET");
        userRequest.setRequestURI("/api/issue/course/12");
        userRequest.setParameter("unmasked", "true");
        userRequest.setSession(authenticatedSession(4));
        MockHttpServletResponse userResponse = new MockHttpServletResponse();
        assertFalse(interceptor.preHandle(userRequest, userResponse, new Object()));
        assertEquals(403, userResponse.getStatus());

        when(identities.findById(1)).thenReturn(Optional.of(identity(1, "admin", false)));
        MockHttpServletRequest adminRequest = new MockHttpServletRequest();
        adminRequest.setMethod("GET");
        adminRequest.setRequestURI("/api/issue/course/12");
        adminRequest.setParameter("unmasked", "true");
        adminRequest.setSession(authenticatedSession(1));
        assertTrue(interceptor.preHandle(adminRequest, new MockHttpServletResponse(), new Object()));
    }

    @Test
    void administratorCanWriteAdminResources() throws Exception {
        Identity admin = identity(1, "admin", false);
        when(identities.findById(1)).thenReturn(Optional.of(admin));
        var result = intercept("POST", "/api/course/post", authenticatedSession(1));
        assertTrue(result.allowed());
        assertSame(admin, result.request().getAttribute("authenticatedIdentity"));
    }

    @Test
    void deletedAccountSessionIsInvalidated() throws Exception {
        when(identities.findById(4)).thenReturn(Optional.of(identity(4, "admin", true)));
        MockHttpSession session = authenticatedSession(4);
        var result = intercept("GET", "/api/identity/me", session);
        assertFalse(result.allowed());
        assertEquals(401, result.response().getStatus());
        assertThrows(IllegalStateException.class, session::getAttributeNames);
    }

    private InterceptResult intercept(String method, String path, MockHttpSession session) throws Exception {
        return intercept(method, path, session, null);
    }

    private InterceptResult intercept(String method, String path, MockHttpSession session, String origin) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setMethod(method);
        request.setRequestURI(path);
        if (origin != null) request.addHeader("Origin", origin);
        if (session != null) request.setSession(session);
        MockHttpServletResponse response = new MockHttpServletResponse();
        boolean allowed = interceptor.preHandle(request, response, new Object());
        return new InterceptResult(allowed, request, response);
    }

    private MockHttpSession authenticatedSession(int identityId) {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("identityId", identityId);
        return session;
    }

    private Identity identity(int id, String role, boolean deleted) {
        Identity identity = new Identity();
        identity.setId(id);
        identity.setRole(role);
        identity.setIsDeleted(deleted);
        return identity;
    }

    private record InterceptResult(boolean allowed, MockHttpServletRequest request, MockHttpServletResponse response) {}
}
