package com.cdmga.uestc.webpage.Configuration;

import com.cdmga.uestc.webpage.Entity.Identity;
import com.cdmga.uestc.webpage.Repository.IdentityRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.beans.factory.annotation.Value;

import java.io.IOException;
import java.net.URI;
import java.util.Optional;

@Component
public class ApiAuthorizationInterceptor implements HandlerInterceptor {
    private final IdentityRepository identities;

    @Value("${cors.allowed-origins:}")
    private String allowedOrigins = "";

    public ApiAuthorizationInterceptor(IdentityRepository identities) {
        this.identities = identities;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws IOException {
        String path = request.getRequestURI();
        if (!path.startsWith("/api/")) return true;

        String method = request.getMethod();
        if ("OPTIONS".equals(method)) return true;
        if (isWriteMethod(method) && !isTrustedOrigin(request)) {
            writeError(response, HttpServletResponse.SC_FORBIDDEN, "请求来源无效");
            return false;
        }
        if (isPublicAuthRoute(method, path)) return true;
        if (isPublicRead(method, path)) return true;

        boolean adminRequired = requiresAdmin(method, path)
                || ("GET".equals(method) && path.startsWith("/api/identity/")
                && "true".equalsIgnoreCase(request.getParameter("role")))
                || ("GET".equals(method) && path.matches("/api/issue/course/\\d+")
                && "true".equalsIgnoreCase(request.getParameter("unmasked")));

        Integer identityId = sessionIdentityId(request.getSession(false));
        if (identityId == null) {
            writeError(response, HttpServletResponse.SC_UNAUTHORIZED, "请先登录");
            return false;
        }

        Optional<Identity> identity = identities.findById(identityId)
                .filter(user -> !Boolean.TRUE.equals(user.getIsDeleted()));
        if (identity.isEmpty()) {
            HttpSession session = request.getSession(false);
            if (session != null) session.invalidate();
            writeError(response, HttpServletResponse.SC_UNAUTHORIZED, "登录状态已失效，请重新登录");
            return false;
        }
        request.setAttribute("authenticatedIdentity", identity.get());

        if (adminRequired && !"admin".equalsIgnoreCase(identity.get().getRole())) {
            writeError(response, HttpServletResponse.SC_FORBIDDEN, "需要管理员权限");
            return false;
        }
        return true;
    }

    private boolean isTrustedOrigin(HttpServletRequest request) {
        String originHeader = request.getHeader("Origin");
        if (originHeader == null || originHeader.isBlank()) return true;
        try {
            URI origin = URI.create(originHeader);
            if (origin.getHost() == null || origin.getRawUserInfo() != null || origin.getRawPath() != null && !origin.getRawPath().isEmpty()
                    || origin.getRawQuery() != null || origin.getRawFragment() != null) return false;
            if (sameOrigin(origin, request.getScheme(), request.getServerName(), request.getServerPort())) return true;
            for (String configured : allowedOrigins.split(",")) {
                if (configured.isBlank()) continue;
                URI allowed = URI.create(configured.trim());
                if (sameOrigin(origin, allowed.getScheme(), allowed.getHost(), allowed.getPort())) return true;
            }
        } catch (IllegalArgumentException ignored) {
            return false;
        }
        return false;
    }

    private boolean sameOrigin(URI origin, String scheme, String host, int port) {
        return scheme != null && host != null && origin.getScheme() != null
                && origin.getScheme().equalsIgnoreCase(scheme)
                && origin.getHost().equalsIgnoreCase(host)
                && normalizedPort(origin.getScheme(), origin.getPort()) == normalizedPort(scheme, port);
    }

    private int normalizedPort(String scheme, int port) {
        if (port >= 0) return port;
        return "https".equalsIgnoreCase(scheme) ? 443 : 80;
    }

    private boolean isWriteMethod(String method) {
        return !"GET".equals(method) && !"HEAD".equals(method) && !"OPTIONS".equals(method);
    }

    private boolean isPublicRead(String method, String path) {
        if (!"GET".equals(method) && !"HEAD".equals(method)) return false;
        if (path.startsWith("/api/course/")) return !path.equals("/api/course/allcourse");
        if (path.equals("/api/activity/list") || path.equals("/api/activity/search")
                || path.equals("/api/activity/all")
                || path.equals("/api/activity/rule") || path.matches("/api/activity/\\d+")) return true;
        if (path.equals("/api/forum/posts") || path.matches("/api/forum/posts/\\d+")
                || path.startsWith("/api/forum/media/") || path.startsWith("/api/forum/file/")) return true;
        if (path.matches("/api/profile/identity/\\d+")) return true;
        if (path.equals("/api/rank/board") || path.equals("/api/rank/courses")) return true;
        if (path.matches("/api/title/user/\\d+")) return true;
        if (path.matches("/api/identity/online/\\d+") || path.startsWith("/api/media/thumb")) return true;
        return false;
    }

    private boolean isPublicAuthRoute(String method, String path) {
        return "POST".equals(method) && ("/api/identity/login".equals(path)
                || "/api/identity/register".equals(path) || "/api/identity/logout".equals(path));
    }

    private Integer sessionIdentityId(HttpSession session) {
        if (session == null) return null;
        Object value = session.getAttribute("identityId");
        return value instanceof Integer id ? id : null;
    }

    private boolean requiresAdmin(String method, String path) {
        boolean write = isWriteMethod(method);
        if (path.equals("/api/identity/allaccount") || path.equals("/api/profile/all")
                || path.equals("/api/profile/all-passed") || path.equals("/api/course/allcourse")
                || path.equals("/api/rank/configs") || path.startsWith("/api/forum/admin/")
                || path.startsWith("/api/title/admin/") || path.equals("/api/score/admin/logs")
                || path.startsWith("/api/score/unscored") || path.equals("/api/score/")) return true;
        if ("GET".equals(method) && path.matches("/api/team/course/\\d+")) return true;
        if (!write) return false;
        if (path.equals("/api/identity/") || path.equals("/api/identity")
                || path.startsWith("/api/course/") || path.equals("/api/course")
                || path.startsWith("/api/activity/") || path.equals("/api/activity")
                || path.startsWith("/api/issue/") || path.equals("/api/issue")
                || path.startsWith("/api/bingo-tip/") || path.equals("/api/bingo-tip")
                || path.equals("/api/rank/config") || path.equals("/api/profile/")
                || path.equals("/api/profile")) return true;
        return (path.matches("/api/identity/\\d+") && "DELETE".equals(method))
                || (path.matches("/api/profile/\\d+") && ("PUT".equals(method) || "DELETE".equals(method)))
                || path.matches("/api/team/course/\\d+/save")
                || path.matches("/api/score/(update/\\d+|delete/\\d+|award/\\d+/reject|\\d+/reject)");
    }

    private void writeError(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setCharacterEncoding("UTF-8");
        response.setContentType("application/json");
        response.getWriter().write("{\"code\":" + status + ",\"message\":\"" + message + "\"}");
    }
}
