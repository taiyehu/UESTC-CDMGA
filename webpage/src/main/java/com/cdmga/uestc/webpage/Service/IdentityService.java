package com.cdmga.uestc.webpage.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.cdmga.uestc.webpage.Entity.Identity;
import com.cdmga.uestc.webpage.Repository.IdentityRepository;

@Service
public class IdentityService {

    @Autowired
    private IdentityRepository identityRepository;

    private BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    //注册用户
    public Identity registerIdentity(String account, String password){
        Identity existingIdentity = identityRepository.findByAccount(account);
        if(existingIdentity != null){
            throw new IllegalArgumentException("用户名已存在");
        }
        Identity newIdentity = new Identity();
        newIdentity.setAccount(account);
        newIdentity.setPassword(passwordEncoder.encode(password));
        return identityRepository.save(newIdentity);
    }

    //登录
    public boolean validateLogin(String account, String password){
        Identity identity = identityRepository.findByAccount(account);
        if(identity == null){
            return false;
        }
        return passwordEncoder.matches(password, identity.getPassword());
    }

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
