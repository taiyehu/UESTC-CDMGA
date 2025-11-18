package com.cdmga.uestc.webpage.Repository;

import com.cdmga.uestc.webpage.Entity.Activity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ActivityRepository extends JpaRepository<Activity, Integer> {
}