package com.cdmga.uestc.webpage.Repository;

import com.cdmga.uestc.webpage.Entity.BingoTip;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BingoTipRepository extends JpaRepository<BingoTip, Integer> {
    Page<BingoTip> findByCourseIdOrderByCreatedAtAscIdAsc(Integer courseId, Pageable pageable);

    Page<BingoTip> findByCourseIdAndIssueIdOrderByCreatedAtAscIdAsc(Integer courseId, Integer issueId, Pageable pageable);

    List<BingoTip> findByCourseIdAndIssueIdOrderByCreatedAtAscIdAsc(Integer courseId, Integer issueId);

    Optional<BingoTip> findByIdAndCourseId(Integer id, Integer courseId);
}
