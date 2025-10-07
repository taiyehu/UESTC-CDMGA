package com.cdmga.uestc.webpage.Repository;

import com.cdmga.uestc.webpage.Entity.Profile;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProfileRepository extends JpaRepository<Profile, Integer> {
    Profile findByIdentity_Id(Integer identityId);
}