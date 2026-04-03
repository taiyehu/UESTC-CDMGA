package com.cdmga.uestc.webpage.Repository;

import com.cdmga.uestc.webpage.Entity.RankConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RankConfigRepository extends JpaRepository<RankConfig, Integer> {

    Optional<RankConfig> findByCourseIdAndIsDeletedFalse(Integer courseId);

    List<RankConfig> findByIsDeletedFalse();
}
