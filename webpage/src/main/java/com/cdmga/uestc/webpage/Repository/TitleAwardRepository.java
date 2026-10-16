package com.cdmga.uestc.webpage.Repository;

import com.cdmga.uestc.webpage.Entity.TitleAward;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.Optional;

public interface TitleAwardRepository extends JpaRepository<TitleAward, Integer> {
    List<TitleAward> findByIdentityIdOrderByIdDesc(Integer identityId);
    List<TitleAward> findByStatusOrderByIdAsc(String status);
    Optional<TitleAward> findByIdentityIdAndTitleId(Integer identityId, Integer titleId);
    Page<TitleAward> findAllByOrderByIdDesc(Pageable pageable);
    Page<TitleAward> findByIdentityIdOrderByIdDesc(Integer identityId, Pageable pageable);
}
