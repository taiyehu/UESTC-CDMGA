package com.cdmga.uestc.webpage.Controller;

import com.cdmga.uestc.webpage.common.Result;
import com.cdmga.uestc.webpage.Dto.ProfileDto;
import com.cdmga.uestc.webpage.Entity.Profile;
import com.cdmga.uestc.webpage.Service.ProfileService;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {
    @Autowired
    private ProfileService profileService;

    @Value("${avatar.upload.directory}")
    private String uploadDir;

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
        if (p == null) return null;
        ProfileDto dto = new ProfileDto();
        dto.setId(p.getId());
        dto.setIdentityId(p.getIdentity() != null ? p.getIdentity().getId() : null);
        dto.setAccount(p.getIdentity() != null ? p.getIdentity().getAccount() : null);
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

    // 获取文件扩展名
    private String getFileExtension(String fileName) {
        int index = fileName.lastIndexOf('.');
        if (index == -1) {
            return ""; // 没有扩展名
        }
        return fileName.substring(index + 1);
    }

    @PostMapping("/upload-avatar")
    public Result uploadAvatar(@RequestParam("avatar") MultipartFile avatar) {
        try {
            String fileName = UUID.randomUUID().toString() + "." + getFileExtension(avatar.getOriginalFilename());
            Path targetLocation = Paths.get(uploadDir, fileName);
            Files.createDirectories(targetLocation.getParent());
            Files.copy(avatar.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            String avatarUrl = "/avatars/" + fileName;
            return Result.success(avatarUrl);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/submit-avatar-review")
    public Result submitAvatarReview(@RequestBody Map<String, Object> payload) {
        Integer userId = (Integer) payload.get("userId");
        String avatarUrl = (String) payload.get("avatar");
        Profile profile = profileService.getProfileByIdentityId(userId);
        if (profile == null) {
            profile = new Profile();
            profile.setIdentityId(userId);
        }
        profile.setAvatar(avatarUrl);
        profile.setStatus(0); // 0=审核中
        profileService.saveProfile(profile);
        return Result.success("已提交审核");
    }
}
