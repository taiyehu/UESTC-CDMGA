package com.cdmga.uestc.webpage.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.cdmga.uestc.webpage.Entity.Identity;
import com.cdmga.uestc.webpage.Repository.IdentityRepository;

@Service
public class IdentityService {

    @Autowired
    private IdentityRepository identityRepository;

    public IdentityService(IdentityRepository identityRepository) {
        this.identityRepository = identityRepository;
    }

    // 根据用户名查找用户信息
    public Identity getIdentityByAccount(String account) {
        return identityRepository.findByAccount(account);
    }

    // 创建新的用户
    public Identity createIdentity(Identity identity) {
        return identityRepository.save(identity);
    }

    // 更新用户信息
    public Identity updateIdentity(Identity identity) {
        return identityRepository.save(identity);
    }

    // 删除用户
    public void deleteIdentity(Long id) {
        identityRepository.deleteById(id);
    }
}
