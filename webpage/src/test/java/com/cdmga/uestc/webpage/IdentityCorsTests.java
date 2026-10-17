package com.cdmga.uestc.webpage;

import com.cdmga.uestc.webpage.Controller.IdentityController;
import com.cdmga.uestc.webpage.Entity.Identity;
import com.cdmga.uestc.webpage.Service.IdentityService;
import com.cdmga.uestc.webpage.Service.IdentitySessionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockFilterConfig;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.filter.ForwardedHeaderFilter;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class IdentityCorsTests {
    private MockMvc mvc;

    @BeforeEach
    void setUp() throws Exception {
        IdentityController controller = new IdentityController();
        IdentityService identityService = new IdentityService(null) {
            @Override
            public Identity validateLogin(String account, String password) {
                throw new IllegalArgumentException("invalid credentials");
            }
        };
        ReflectionTestUtils.setField(controller, "identityService", identityService);
        ReflectionTestUtils.setField(controller, "identitySessionService", new IdentitySessionService());

        ForwardedHeaderFilter forwardedHeaderFilter = new ForwardedHeaderFilter();
        forwardedHeaderFilter.init(new MockFilterConfig());
        mvc = MockMvcBuilders.standaloneSetup(controller).addFilters(forwardedHeaderFilter).build();
    }

    @Test
    void httpsSameOriginLoginReachesController() throws Exception {
        mvc.perform(post("/api/identity/login")
                        .header("Host", "cdmga.top")
                        .header("Origin", "https://cdmga.top")
                        .header("X-Forwarded-Proto", "https")
                        .header("X-Forwarded-Host", "cdmga.top")
                        .header("X-Forwarded-Port", "443")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"account\":\"test\",\"password\":\"wrong\"}"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("invalid credentials")));
    }

    @Test
    void unrelatedOriginDoesNotReceiveCorsPermission() throws Exception {
        mvc.perform(post("/api/identity/login")
                        .header("Host", "cdmga.top")
                        .header("Origin", "https://other.example")
                        .header("X-Forwarded-Proto", "https")
                        .header("X-Forwarded-Host", "cdmga.top")
                        .header("X-Forwarded-Port", "443")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"account\":\"test\",\"password\":\"wrong\"}"))
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }
}
