package com.cdmga.uestc.webpage.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.cdmga.uestc.webpage.Entity.Identity;

@Repository
public interface IdentityRepository extends JpaRepository<Identity, Long> {

    // 可以定义一些自定义查询方法
    Identity findByAccount(String account);
}
