package com.cdmga.uestc.webpage.Repository;

import com.cdmga.uestc.webpage.Entity.Profile;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ProfileRepository extends JpaRepository<Profile, Integer> {
    Profile findByIdentity_Id(Integer identityId);

    @Query("SELECT p FROM Profile p WHERE p.status = 0")
    List<Profile> findNotPassedProfiles();

    @Query("SELECT p FROM Profile p WHERE p.status = 1")
    List<Profile> findPassedProfiles();

    List<Profile> findByIdentity_IdAndStatus(Integer identityId, Integer status);
}