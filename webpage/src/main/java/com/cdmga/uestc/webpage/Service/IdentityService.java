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
    public Identity register(String account, String password) throws Exception {
        // 检查账号是否已存在
        Identity existingIdentity = identityRepository.findByAccount(account);
        if (existingIdentity != null) {
            throw new Exception("账号已存在"); // 抛出异常，由控制器捕获
        }
        // 创建新用户并加密密码
        Identity newIdentity = new Identity();
        newIdentity.setAccount(account);
        newIdentity.setPassword(passwordEncoder.encode(password)); // 密码加密
        // 保存用户并返回完整的 Identity 对象（包含 ID 等信息）
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
