package com.cdmga.uestc.webpage.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.cdmga.uestc.webpage.Entity.Identity;

import java.util.List;

@Repository
public interface IdentityRepository extends JpaRepository<Identity, Long> {

    // 可以定义一些自定义查询方法
    Identity findByAccount(String account);

    List<Identity> findByAccountContaining(String keyword);

    @Query("select c from Identity c")
    List<Identity> findAllAccount();
}
