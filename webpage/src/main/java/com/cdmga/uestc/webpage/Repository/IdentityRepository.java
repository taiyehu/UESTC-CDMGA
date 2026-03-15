package com.cdmga.uestc.webpage.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.cdmga.uestc.webpage.Entity.Identity;

import java.util.List;

@Repository
public interface IdentityRepository extends JpaRepository<Identity, Integer> {

    // 统计所有生效用户
    long countByIsDeletedFalse();

    // 可以定义一些自定义查询方法
    Identity findByAccount(String account);

    List<Identity> findByAccountContaining(String keyword);

    @Query("select c from Identity c")
    List<Identity> findAllAccount();

    @Query("select i from Identity i where i.isDeleted = false and (str(i.id) like concat('%', :keyword, '%') or i.account like concat('%', :keyword, '%')) order by i.id asc")
    List<Identity> searchByIdOrAccount(@Param("keyword") String keyword, Pageable pageable);

    @Query(value = "select * from identity i where i.is_deleted = 0 and (cast(i.id as char) like concat('%', :keyword, '%') or i.account like concat('%', :keyword, '%')) order by i.id asc limit :limit", nativeQuery = true)
    List<Identity> searchByIdOrAccountNative(@Param("keyword") String keyword, @Param("limit") Integer limit);


}
