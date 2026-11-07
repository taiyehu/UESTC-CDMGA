package com.cdmga.uestc.webpage;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.core.io.FileSystemResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.support.TransactionTemplate;

import java.net.CookieManager;
import java.net.CookiePolicy;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Path;
import java.time.Duration;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@EnabledIfEnvironmentVariable(named = "DSH_SYNTHETIC_TESTS", matches = "true")
@ActiveProfiles("synthetic-fixture")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class SyntheticDatabaseIntegrationTests {
    @LocalServerPort int port;
    @Autowired JdbcTemplate jdbc;
    @Autowired ObjectMapper json;

    @DynamicPropertySource
    static void isolatedProperties(DynamicPropertyRegistry properties) {
        // The destination is deliberately not configurable through a URL or port environment variable.
        properties.add("spring.datasource.url", () -> "jdbc:mysql://127.0.0.1:13307/CDMGA_SYNTHETIC?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Shanghai");
        properties.add("spring.datasource.username", () -> "synthetic");
        properties.add("spring.datasource.password", () -> System.getenv("DSH_SYNTHETIC_DB_PASSWORD"));
        properties.add("spring.jpa.hibernate.ddl-auto", () -> "update");
        properties.add("spring.jpa.show-sql", () -> "false");
        properties.add("logging.level.root", () -> "WARN");
        properties.add("logging.level.org.springframework", () -> "WARN");
        properties.add("server.address", () -> "127.0.0.1");
        properties.add("server.servlet.session.cookie.secure", () -> "false");
        properties.add("cors.allowed-origins", () -> "http://localhost:5174,http://localhost:8081");
        for (String key : new String[]{"course.upload.directory", "score.upload.directory", "avatar.upload.directory",
                "activity.upload.banner-directory", "activity.upload.file-directory", "forum.upload.directory"}) {
            properties.add(key, () -> Path.of(System.getenv("DSH_SYNTHETIC_ROOT"), "uploads").toString() + "/");
        }
    }

    @BeforeAll
    void generateSyntheticFixtures() {
        assertEquals("CDMGA_SYNTHETIC", jdbc.queryForObject("SELECT DATABASE()", String.class));
        jdbc.execute("CREATE TABLE IF NOT EXISTS synthetic_fixture_version (version INT PRIMARY KEY)");
        if (jdbc.queryForObject("SELECT COUNT(*) FROM synthetic_fixture_version WHERE version=1", Integer.class) == 1) {
            assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM identity WHERE account NOT LIKE 'synthetic\\_%'", Integer.class));
            return;
        }
        assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM identity", Integer.class), "Refusing to seed a database with existing accounts");
        var ddl = new ResourceDatabasePopulator(
                new FileSystemResource("../sql_script/daily_checkin_forum_create.sql"),
                new FileSystemResource("../sql_script/forum_edit_attachment_incremental.sql"));
        ddl.execute(jdbc.getDataSource());
        new TransactionTemplate(new DataSourceTransactionManager(jdbc.getDataSource())).executeWithoutResult(status -> seedRows());
    }

    private void seedRows() {
        String hash = new BCryptPasswordEncoder().encode(System.getenv("DSH_SYNTHETIC_ACCOUNT_PASSWORD"));
        for (int id = 1; id <= 15; id++) {
            String account = id == 1 ? "synthetic_admin" : id == 2 ? "synthetic_member" : "synthetic_user_" + id;
            jdbc.update("INSERT INTO identity (id,account,password,role,is_deleted,created_at,updated_at) VALUES (?,?,?,?,0,NOW(),NOW())",
                    id, account, hash, id == 1 ? "admin" : "user");
            jdbc.update("INSERT INTO profile (identity_id,avatar,description,title,status) VALUES (?,'',?,'Synthetic member',1)",
                    id, "Generated fixture " + id + "; fictional data only");
        }
        String[] categories = {"arc", "contest", "bingo", "arc", "award"};
        for (int id = 1; id <= categories.length; id++) {
            jdbc.update("INSERT INTO course (id,title,category,description,image,start_time,end_time,is_deleted,created_at,updated_at) VALUES (?,?,?,'Generated fixture','',DATE_SUB(NOW(),INTERVAL 7 DAY),DATE_ADD(NOW(),INTERVAL 30 DAY),0,NOW(),NOW())",
                    id, "Synthetic course " + id, categories[id - 1]);
            jdbc.update("INSERT INTO rank_config (course_id,counting_rules,is_deleted) VALUES (?,0,0)", id);
        }
        jdbc.update("INSERT INTO award (course_id,cost,total_stock,remaining_stock) VALUES (5,5,10,10)");
        jdbc.update("INSERT INTO activity (id,name,description,activity_banner,activity_file,start_time,end_time,is_deleted,created_at,updated_at) VALUES (1,'Synthetic activity','Generated fixture','','',DATE_SUB(NOW(),INTERVAL 7 DAY),DATE_ADD(NOW(),INTERVAL 30 DAY),0,NOW(),NOW())");
        jdbc.update("INSERT INTO activity_course_assoc (activity_id,course_id,rule) VALUES (1,2,'Synthetic contest')");
        for (int id = 1; id <= 25; id++) {
            jdbc.update("INSERT INTO issue (course_id,issue_id,text,song_name) VALUES (3,?,?,?)", id, "Synthetic cell " + id, "Synthetic song " + id);
        }
        for (int id = 2; id <= 15; id++) {
            for (int course = 1; course <= 2; course++) {
                jdbc.update("INSERT INTO score (identity_id,course_id,score,is_scored,is_deleted,image,remark,upload_time,created_at,updated_at) VALUES (?,?,?,1,0,'','Synthetic approved',NOW(),NOW(),NOW())", id, course, 20 - id);
            }
        }
        jdbc.update("INSERT INTO score (identity_id,course_id,score,is_scored,is_deleted,remark,upload_time) VALUES (3,1,999,0,0,'Synthetic pending',NOW()),(3,1,998,1,1,'Synthetic deleted',NOW())");
        jdbc.update("INSERT INTO team (id,course_id,team_id,identity_id,is_touched) VALUES (1,3,1,2,0),(2,3,1,3,0)");
        String[] tiers = {"color", "gold", "silver", "normal"};
        for (int id = 1; id <= 4; id++) {
            jdbc.update("INSERT INTO title_definition (id,name,tier,source,identity_id,acquisition_method) VALUES (?,?,?,'admin_created',1,'Generated synthetic fixture')", id, "Synthetic title " + id, tiers[id - 1]);
            jdbc.update("INSERT INTO title_award (title_id,identity_id,status,is_equipped,granted_at) VALUES (?,?,'approved',1,NOW())", id, id + 1);
        }
        for (int id = 1; id <= 23; id++) {
            jdbc.update("INSERT INTO forum_post (id,author_id,title,content) VALUES (?,?,?,?)", id, 2 + id % 14, "Synthetic post " + id, "Generated text " + id + ". ".repeat(80));
        }
        for (int id = 1; id <= 23; id++) {
            jdbc.update("INSERT INTO forum_reply (post_id,author_id,content) VALUES (1,?,?)", 2 + id % 14, "Synthetic comment " + id);
        }
        jdbc.update("INSERT INTO synthetic_fixture_version VALUES (1)");
    }

    @Test
    void realAccountsRespectPublicProfilesAndPrivateHistory() throws Exception {
        var anonymous = client();
        assertEquals(401, request(anonymous, "GET", "/identity/me", null).statusCode());
        assertEquals(200, request(anonymous, "GET", "/activity/all", null).statusCode());
        var member = login("synthetic_member");
        JsonNode profile = payload(request(member, "GET", "/profile/identity/3", null));
        assertEquals("synthetic_user_3", profile.path("account").asText());
        var scores = payload(request(member, "GET", "/score/user-course-scores?identityId=3", null)).path("data");
        assertEquals(1, scores.size());
        assertEquals(17, scores.get(0).path("score").asInt());
        assertFalse(scores.toString().contains("Synthetic pending"));
        assertFalse(scores.toString().contains("Synthetic deleted"));
        assertEquals(200, request(member, "GET", "/score/history?identity_id=2&course_id=1", null).statusCode());
        assertEquals(403, request(member, "GET", "/score/history?identity_id=3&course_id=1", null).statusCode());
        assertEquals(200, request(member, "GET", "/team/course/3/my?identityId=2", null).statusCode());
        assertEquals(403, request(member, "GET", "/team/course/3/my?identityId=3", null).statusCode());
        var titles = success(request(member, "GET", "/title/user/3", null));
        assertEquals(1, titles.size());
        assertEquals("gold", titles.get(0).path("tier").asText());
        success(request(member, "POST", "/identity/logout", Map.of()));
        assertEquals(401, request(member, "GET", "/identity/me", null).statusCode());
    }

    @Test
    void administratorsAndMembersHaveDifferentManagementPermissions() throws Exception {
        var member = login("synthetic_member");
        var admin = login("synthetic_admin");
        for (String path : new String[]{"/identity/allaccount", "/forum/admin/posts", "/course/allcourse", "/profile/all", "/score/unscored", "/team/course/3"}) {
            assertEquals(403, request(member, "GET", path, null).statusCode(), path);
            assertEquals(200, request(admin, "GET", path, null).statusCode(), path);
        }
        assertEquals(200, request(member, "GET", "/issue/course/3", null).statusCode());
        assertEquals(403, request(member, "GET", "/issue/course/3?unmasked=true", null).statusCode());
        assertEquals(200, request(admin, "GET", "/issue/course/3?unmasked=true", null).statusCode());
        var foreign = HttpRequest.newBuilder(URI.create(base() + "/identity/login")).header("Origin", "https://untrusted.invalid")
                .header("Content-Type", "application/json").POST(HttpRequest.BodyPublishers.ofString("{}")).build();
        assertEquals(403, admin.send(foreign, HttpResponse.BodyHandlers.ofString()).statusCode());
    }

    @Test
    void forumPaginationAndPostingUseSyntheticContent() throws Exception {
        var member = login("synthetic_member");
        assertEquals(10, success(request(member, "GET", "/forum/posts?page=0&size=10", null)).path("list").size());
        assertEquals(10, success(request(member, "GET", "/forum/posts?page=1&size=10", null)).path("list").size());
        assertEquals(23, success(request(member, "GET", "/forum/posts/1", null)).path("replies").size());
        var created = success(request(member, "POST", "/forum/posts", Map.of("title", "Synthetic HTTP post", "content", "Generated test content")));
        long id = created.path("id").asLong();
        assertTrue(id > 0);
        success(request(member, "POST", "/forum/posts/" + id + "/replies", Map.of("content", "Synthetic HTTP reply")));
        success(request(member, "DELETE", "/forum/post/" + id, null));
    }

    @Test
    void scoreSubmissionIgnoresForgedOwnerAndAllowsAdminGrading() throws Exception {
        var member = login("synthetic_member");
        var admin = login("synthetic_admin");
        JsonNode submitted = success(request(member, "POST", "/score/post", Map.of("course_id", 4, "identity_id", 3,
                "image", "", "remark", "Synthetic HTTP score")));
        long id = submitted.path("id").asLong();
        assertTrue(id > 0);
        assertEquals(2, submitted.path("identity").path("id").asInt());
        var grade = Map.of("point", 8, "is_scored", true, "remark", "Synthetic graded");
        assertEquals(403, request(member, "PUT", "/score/update/" + id, grade).statusCode());
        success(request(admin, "PUT", "/score/update/" + id, grade));
        assertEquals(1, jdbc.queryForObject("SELECT COUNT(*) FROM score WHERE id=? AND is_scored=1 AND score=8 AND identity_id=2", Integer.class, id));
        success(request(admin, "DELETE", "/score/delete/" + id, null));
    }

    private HttpClient client() {
        return HttpClient.newBuilder().cookieHandler(new CookieManager(null, CookiePolicy.ACCEPT_ALL))
                .connectTimeout(Duration.ofSeconds(10)).build();
    }

    private HttpClient login(String account) throws Exception {
        var client = client();
        var response = request(client, "POST", "/identity/login", Map.of("account", account,
                "password", System.getenv("DSH_SYNTHETIC_ACCOUNT_PASSWORD")));
        success(response);
        assertFalse(payload(response).path("data").has("password"));
        assertTrue(response.headers().allValues("set-cookie").stream().anyMatch(cookie -> cookie.toLowerCase().contains("httponly")));
        return client;
    }

    private String base() { return "http://127.0.0.1:" + port + "/api"; }

    private HttpResponse<String> request(HttpClient client, String method, String path, Object body) throws Exception {
        var request = HttpRequest.newBuilder(URI.create(base() + path)).timeout(Duration.ofSeconds(15))
                .header("Content-Type", "application/json");
        request.method(method, body == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body)));
        return client.send(request.build(), HttpResponse.BodyHandlers.ofString());
    }

    private JsonNode payload(HttpResponse<String> response) throws Exception { return json.readTree(response.body()); }

    private JsonNode success(HttpResponse<String> response) throws Exception {
        assertEquals(200, response.statusCode());
        var body = payload(response);
        assertEquals(0, body.path("code").asInt(-1), body.path("message").asText());
        return body.path("data");
    }
}
