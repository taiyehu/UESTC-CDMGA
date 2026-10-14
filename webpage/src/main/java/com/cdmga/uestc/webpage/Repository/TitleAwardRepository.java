package com.cdmga.uestc.webpage.Repository;

import com.cdmga.uestc.webpage.Entity.TitleAward;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface TitleAwardRepository extends JpaRepository<TitleAward, Integer> {
    List<TitleAward> findByIdentityIdOrderByIdDesc(Integer identityId);
    List<TitleAward> findByStatusOrderByIdAsc(String status);
    Optional<TitleAward> findByIdentityIdAndTitleId(Integer identityId, Integer titleId);
}
