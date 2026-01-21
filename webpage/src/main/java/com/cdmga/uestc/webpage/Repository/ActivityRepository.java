package com.cdmga.uestc.webpage.Repository;

import com.cdmga.uestc.webpage.Entity.Activity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ActivityRepository extends JpaRepository<Activity, Integer> {
    Activity findByIdAndIsDeletedFalse(int id);



    List<Activity> findByNameContainingIgnoreCaseAndIsDeletedFalse(String name);

    // 分页模糊匹配
    Page<Activity> findByNameContainingIgnoreCaseAndIsDeletedFalse(String name, Pageable pageable);
}
