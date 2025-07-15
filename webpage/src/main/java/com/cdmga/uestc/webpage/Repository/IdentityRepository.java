package com.cdmga.uestc.webpage.Repository;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.cdmga.uestc.webpage.Entity.Identity;

import java.util.List;

@Repository
public interface IdentityRepository extends JpaRepository<Identity, Long> {

    // 可以定义一些自定义查询方法
    Identity findByAccount(String account);
    List<Identity> findByAccountContaining(String keyword);
}
