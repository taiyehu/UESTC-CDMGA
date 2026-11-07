package com.cdmga.uestc.webpage.Configuration;

import com.cdmga.uestc.webpage.Controller.IdentityController;
import com.cdmga.uestc.webpage.Controller.ScoreController;
import com.cdmga.uestc.webpage.Controller.TeamController;
import com.cdmga.uestc.webpage.Entity.Identity;
import com.cdmga.uestc.webpage.Entity.Score;
import com.cdmga.uestc.webpage.Repository.IdentityRepository;
import com.cdmga.uestc.webpage.Service.IdentityService;
import com.cdmga.uestc.webpage.Service.IdentitySessionService;
import com.cdmga.uestc.webpage.Service.ScoreService;
import com.cdmga.uestc.webpage.Service.TeamService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = {IdentityController.class, TeamController.class, ScoreController.class})
@AutoConfigureMockMvc(addFilters = false)
@Import({WebConfig.class, ApiAuthorizationInterceptor.class})
class ApiAuthorizationWebMvcTests {
    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private IdentityRepository identities;

    @MockitoBean
    private IdentityService identityService;

    @MockitoBean
    private IdentitySessionService identitySessionService;

    @MockitoBean
    private TeamService teamService;

    @MockitoBean
    private ScoreService scoreService;

    @BeforeEach
    void setUp() {
        when(identities.findById(7)).thenReturn(Optional.of(identity(7, "user")));
        when(identities.findById(1)).thenReturn(Optional.of(identity(1, "admin")));
    }

    @Test
    void protectedAdminReadRejectsAnonymousAndOrdinaryUser() throws Exception {
        mvc.perform(get("/api/identity/allaccount"))
                .andExpect(status().isUnauthorized());

        mvc.perform(get("/api/identity/allaccount").session(session(7)))
                .andExpect(status().isForbidden());
    }

    @Test
    void protectedAdminReadAllowsDatabaseAdmin() throws Exception {
        when(identityService.getIdentitiesByPage(0, 10)).thenReturn(List.of());
        when(identityService.countIdentities()).thenReturn(0L);

        mvc.perform(get("/api/identity/allaccount").session(session(1)))
                .andExpect(status().isOk());
    }

    @Test
    void publicCourseReadRemainsAvailableWithoutSession() throws Exception {
        mvc.perform(get("/api/course/standalone"))
                .andExpect(status().isNotFound());
    }

    @Test
    void teamMutationUsesSessionIdentityInsteadOfSubmittedIdentity() throws Exception {
        when(teamService.createTeam(8, 7)).thenReturn(42);

        mvc.perform(post("/api/team/course/8/create")
                        .session(session(7))
                        .contentType("application/json")
                        .content("{\"identity_id\":1}"))
                .andExpect(status().isOk());

        verify(teamService).createTeam(8, 7);
        verify(teamService, never()).createTeam(8, 1);
    }

    @Test
    void ordinaryUserCannotReadAnotherUsersTeamPanel() throws Exception {
        mvc.perform(get("/api/team/course/8/my")
                        .session(session(7))
                        .param("identityId", "1"))
                .andExpect(status().isForbidden());

        verifyNoInteractions(teamService);
    }

    @Test
    void teamRosterReadIsAdminOnlyWhileInviteSearchRequiresLogin() throws Exception {
        mvc.perform(get("/api/team/course/8"))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/team/course/8").session(session(7)))
                .andExpect(status().isForbidden());

        when(teamService.getCourseTeams(8, 0, 10)).thenReturn(Map.of("list", List.of(), "total", 0));
        mvc.perform(get("/api/team/course/8").session(session(1)))
                .andExpect(status().isOk());

        mvc.perform(get("/api/team/course/8/member-options"))
                .andExpect(status().isUnauthorized());
        when(teamService.searchMemberOptions(8, "", 20)).thenReturn(List.of());
        mvc.perform(get("/api/team/course/8/member-options").session(session(7)))
                .andExpect(status().isOk());
    }

    @Test
    void scoreLookupsAreLimitedToOwnerOrAdministrator() throws Exception {
        mvc.perform(get("/api/score/exists").session(session(7))
                        .param("identityId", "1").param("courseId", "8"))
                .andExpect(status().isForbidden());

        Score otherUsersScore = new Score();
        otherUsersScore.setIdentity(identity(1, "admin"));
        when(scoreService.getScoreById(99L)).thenReturn(otherUsersScore);
        mvc.perform(get("/api/score/99").session(session(7)))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/score/byIdentity/1").session(session(7)))
                .andExpect(status().isForbidden());

        Score ownScore = new Score();
        ownScore.setIdentity(identity(7, "user"));
        when(scoreService.getScoreById(100L)).thenReturn(ownScore);
        when(scoreService.getScoredScoresByIdentityId(7)).thenReturn(List.of(ownScore));
        mvc.perform(get("/api/score/100").session(session(7)))
                .andExpect(status().isOk());
        mvc.perform(get("/api/score/byIdentity/7").session(session(7)))
                .andExpect(status().isOk());

        when(scoreService.existsByIdentityIdAndCourseId(7, 8, null)).thenReturn(true);
        mvc.perform(get("/api/score/exists").session(session(7))
                        .param("identityId", "7").param("courseId", "8"))
                .andExpect(status().isOk());
    }

    @Test
    void rejectsCrossOriginLoginThroughMvcChain() throws Exception {
        mvc.perform(post("/api/identity/login")
                        .header("Origin", "https://attacker.example")
                        .contentType("application/json")
                        .content("{\"account\":\"a\",\"password\":\"b\"}"))
                .andExpect(status().isForbidden());

        verifyNoInteractions(identityService);
    }

    private MockHttpSession session(int identityId) {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("identityId", identityId);
        return session;
    }

    private Identity identity(int id, String role) {
        Identity identity = new Identity();
        identity.setId(id);
        identity.setAccount("user" + id);
        identity.setRole(role);
        identity.setIsDeleted(false);
        return identity;
    }
}
