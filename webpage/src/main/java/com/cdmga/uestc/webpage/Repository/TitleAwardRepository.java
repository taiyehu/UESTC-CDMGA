package com.cdmga.uestc.webpage.Repository;

import com.cdmga.uestc.webpage.Entity.TitleAward;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface TitleAwardRepository extends JpaRepository<TitleAward, Integer> {
    List<TitleAward> findByIdentityIdOrderByIdDesc(Integer identityId);
    List<TitleAward> findByStatusOrderByIdAsc(String status);
    Optional<TitleAward> findByIdentityIdAndTitleId(Integer identityId, Integer titleId);
    Page<TitleAward> findAllByOrderByIdDesc(Pageable pageable);
    Page<TitleAward> findByIdentityIdOrderByIdDesc(Integer identityId, Pageable pageable);
    @Query(value = "SELECT a.identity_id, d.name, d.tier, d.acquisition_method "
            + "FROM title_award a JOIN title_definition d ON d.id = a.title_id "
            + "WHERE a.identity_id IN (:identityIds) AND a.status = 'approved' AND a.is_equipped = 1",
            nativeQuery = true)
    List<Object[]> findEquippedForIdentityIds(@Param("identityIds") Collection<Integer> identityIds);
}
