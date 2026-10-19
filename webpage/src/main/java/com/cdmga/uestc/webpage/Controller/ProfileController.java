package com.cdmga.uestc.webpage.Controller;

import com.cdmga.uestc.webpage.common.Result;
import com.cdmga.uestc.webpage.Dto.ProfileDto;
import com.cdmga.uestc.webpage.Entity.Identity;
import com.cdmga.uestc.webpage.Entity.Profile;
import com.cdmga.uestc.webpage.Service.IdentityService;
import com.cdmga.uestc.webpage.Service.DailyMemberService;
import com.cdmga.uestc.webpage.Service.ProfileService;

import jakarta.servlet.http.HttpSession;
import jakarta.servlet.http.HttpServletResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {
    @Autowired
    private ProfileService profileService;

    @Autowired
    private IdentityService identityService;

    @Autowired
    private DailyMemberService dailyMemberService;

    @Value("${avatar.upload.directory}")
    private String uploadDir;

    @GetMapping("/daily")
    public ProfileDto getDailyMember(HttpSession session, HttpServletResponse response) {
        response.setHeader("Cache-Control", "private, no-store");
        Object viewerId = session.getAttribute("identityId");
        if (!(viewerId instanceof Integer)) throw new IllegalArgumentException("请重新登录");
        Identity member = dailyMemberService.getDailyMember((Integer) viewerId);
        if (member == null) return null;
        Profile profile = profileService.getProfileByIdentityId(member.getId());
        ProfileDto dto = new ProfileDto();
        dto.setIdentityId(member.getId());
        dto.setAccount(member.getAccount());
        if (profile != null && Integer.valueOf(1).equals(profile.getStatus())) {
            dto.setAvatar(profile.getAvatar());
            dto.setDescription(profile.getDescription());
        }
        return dto;
    }

    @GetMapping("/{id}")
    public Profile getProfile(@PathVariable Integer id) {
        return profileService.getProfileById(id);
    }

    @GetMapping("/all")
    public List<ProfileDto> getAllProfiles() {
        List<Profile> profiles = profileService.getAllNotPassedProfiles();
        List<ProfileDto> dtos = new ArrayList<>();
        for (Profile p : profiles) {
            ProfileDto dto = new ProfileDto();
            dto.setId(p.getId());
            dto.setIdentityId(p.getIdentity() != null ? p.getIdentity().getId() : null);
            dto.setAccount(p.getIdentity() != null ? p.getIdentity().getAccount() : null);
            dto.setAvatar(p.getAvatar());
            dto.setDescription(p.getDescription());
            dto.setTitle(p.getTitle());
            dto.setStatus(p.getStatus());
            dtos.add(dto);
        }
        return dtos;
    }

    @GetMapping("/all-passed")
    public List<ProfileDto> getAllPassedProfiles() {
        List<Profile> profiles = profileService.getAllPassedProfiles();
        List<ProfileDto> dtos = new ArrayList<>();
        for (Profile p : profiles) {
            ProfileDto dto = new ProfileDto();
            dto.setId(p.getId());
            dto.setIdentityId(p.getIdentity() != null ? p.getIdentity().getId() : null);
            dto.setAccount(p.getIdentity() != null ? p.getIdentity().getAccount() : null);
            dto.setAvatar(p.getAvatar());
            dto.setDescription(p.getDescription());
            dto.setTitle(p.getTitle());
            dto.setStatus(p.getStatus());
            dtos.add(dto);
        }
        return dtos;
    }

    @GetMapping("/identity/{identityId}")
    public ProfileDto getProfileByIdentity(@PathVariable Integer identityId) {
        Profile p = profileService.getProfileByIdentityId(identityId);

        ProfileDto dto = new ProfileDto();

        // 用户存在，但还没有创建个人资料
        if (p == null) {
            Identity identity = identityService.getIdentityById(identityId);

            // identity 本身也不存在
            if (identity == null) {
                return null;
            }

            dto.setIdentityId(identity.getId());
            dto.setAccount(identity.getAccount());
            dto.setAvatar(null);
            dto.setDescription(null);
            dto.setTitle(null);
            dto.setStatus(-1);

            return dto;
        }

        dto.setId(p.getId());
        dto.setIdentityId(
            p.getIdentity() != null ? p.getIdentity().getId() : identityId
        );
        dto.setAccount(
            p.getIdentity() != null ? p.getIdentity().getAccount() : null
        );
        dto.setAvatar(p.getAvatar());
        dto.setDescription(p.getDescription());
        dto.setTitle(p.getTitle());
        dto.setStatus(p.getStatus());

        return dto;
    }

    @PostMapping("/")
    public Profile createProfile(@RequestBody Profile profile) {
        return profileService.saveProfile(profile);
    }

    @PutMapping("/{id}")
    public Profile updateProfile(@PathVariable Integer id, @RequestBody Profile profile) {
        Profile dbProfile = profileService.getProfileByIdentityId(profile.getIdentityId());
        if (dbProfile == null) {
            dbProfile = new Profile();
            dbProfile.setIdentityId(profile.getIdentityId());
        }
        dbProfile.setAvatar(profile.getAvatar());
        dbProfile.setDescription(profile.getDescription());
        dbProfile.setStatus(profile.getStatus());

        // 如果本次是审核通过（status==1），先将旧的status=1设为2
        //if (profile.getStatus() != null && profile.getStatus() == 1) {
        //    profileService.setOldProfilesToHistory(profile.getIdentityId());
        //}

        return profileService.saveProfile(dbProfile);
    }

    @DeleteMapping("/{id}")
    public void deleteProfile(@PathVariable Integer id) {
        profileService.deleteProfile(id);
    }

    @PostMapping("/upload-avatar")
    public ResponseEntity<Result> uploadAvatar(@RequestParam("avatar") MultipartFile avatar, HttpSession session) {
        Object identityId = session.getAttribute("identityId");
        if (!(identityId instanceof Integer userId)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Result.error("请重新登录"));
        }
        String extension = switch (avatar.getContentType() == null ? "" : avatar.getContentType()) {
            case "image/png" -> "png";
            case "image/jpeg" -> "jpg";
            case "image/webp" -> "webp";
            default -> null;
        };
        if (avatar.isEmpty() || extension == null) {
            return ResponseEntity.badRequest().body(Result.error("请选择 PNG、JPEG 或 WebP 图片"));
        }

        Path targetLocation = null;
        try {
            String fileName = UUID.randomUUID() + "." + extension;
            targetLocation = Paths.get(uploadDir, fileName);
            Files.createDirectories(targetLocation.getParent());
            Files.copy(avatar.getInputStream(), targetLocation);
            String avatarUrl = "/avatars/" + fileName;
            profileService.submitAvatarForReview(userId, avatarUrl);
            return ResponseEntity.ok(Result.success(avatarUrl));
        } catch (Exception e) {
            if (targetLocation != null) {
                try {
                    Files.deleteIfExists(targetLocation);
                } catch (Exception cleanupError) {
                    e.addSuppressed(cleanupError);
                }
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Result.error("头像提交审核失败"));
        }
    }
}
