package com.cdmga.uestc.webpage.Repository;

import com.cdmga.uestc.webpage.Entity.Issue;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface IssueRepository extends JpaRepository<Issue, Long> {
    Page<Issue> findByCourseIdOrderByIssueIdAsc(Integer courseId, Pageable pageable);

    Optional<Issue> findByCourseIdAndIssueId(Integer courseId, Integer issueId);
}
