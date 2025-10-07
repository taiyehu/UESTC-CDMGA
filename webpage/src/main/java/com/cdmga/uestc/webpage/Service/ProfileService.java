package com.cdmga.uestc.webpage.Service;

import com.cdmga.uestc.webpage.Entity.Profile;
import com.cdmga.uestc.webpage.Repository.ProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ProfileService {
    @Autowired
    private ProfileRepository profileRepository;

    public Profile getProfileById(Integer id) {
        return profileRepository.findById(id).orElse(null);
    }

    public Profile getProfileByIdentityId(Integer identityId) {
        return profileRepository.findByIdentity_Id(identityId);
    }

    public Profile saveProfile(Profile profile) {
        return profileRepository.save(profile);
    }

    public void deleteProfile(Integer id) {
        profileRepository.deleteById(id);
    }
}