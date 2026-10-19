package com.cdmga.uestc.webpage.Service;

import com.cdmga.uestc.webpage.Entity.Profile;
import com.cdmga.uestc.webpage.Repository.ProfileRepository;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProfileService {
    @Autowired
    private ProfileRepository profileRepository;

    public Profile getProfileById(Integer id) {
        return profileRepository.findById(id).orElse(null);
    }

    public List<Profile> getAllNotPassedProfiles() {
        return profileRepository.findNotPassedProfiles();
    }

    public List<Profile> getAllPassedProfiles() {
        return profileRepository.findPassedProfiles();
    }

    public Profile getProfileByIdentityId(Integer identityId) {
        return profileRepository.findByIdentity_Id(identityId);
    }

    public Profile saveProfile(Profile profile) {
        return profileRepository.save(profile);
    }

    @Transactional
    public Profile submitAvatarForReview(Integer identityId, String avatarUrl) {
        Profile profile = profileRepository.findByIdentity_Id(identityId);
        if (profile == null) {
            profile = new Profile();
            profile.setIdentityId(identityId);
        }
        profile.setAvatar(avatarUrl);
        profile.setStatus(0);
        // 刷入数据库后再向前端报告成功，避免只上传了文件却没有进入审核队列。
        return profileRepository.saveAndFlush(profile);
    }

    public void deleteProfile(Integer id) {
        profileRepository.deleteById(id);
    }

    public void setOldProfilesToHistory(Integer identityId) {
    List<Profile> oldProfiles = profileRepository.findByIdentity_IdAndStatus(identityId, 1);
    for (Profile p : oldProfiles) {
        p.setStatus(2); // 2=历史
        profileRepository.save(p);
    }
}
}
