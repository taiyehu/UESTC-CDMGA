package com.cdmga.uestc.webpage.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cdmga.uestc.webpage.Entity.Identity;
import com.cdmga.uestc.webpage.Entity.LoginRequest;
import com.cdmga.uestc.webpage.Service.IdentityService;

@CrossOrigin(origins = "http://localhost:8081")
@RestController
@RequestMapping("/api/identity")
public class IdentityController {

    @Autowired
    private IdentityService identityService;

    
    //注册
    @PostMapping("/register")
    public String register(@RequestBody String account, @RequestBody String password) {
        try {
            identityService.registerIdentity(account, password);
            return "注册成功";
        } catch (Exception e) {
            return e.getMessage();
        }
    }
    
    //登录
    // 修改为接收 JSON 请求体
    @CrossOrigin(origins = "http://localhost:8081")
    @PostMapping("/login")
    public String login(@RequestBody LoginRequest loginRequest) {
        try {
            identityService.validateLogin(loginRequest.getAccount(), loginRequest.getPassword());
            return "登录成功";
        } catch (Exception e) {
            return e.getMessage();
        }
}

    

    // 获取用户信息
    @GetMapping("/{account}")
    public ResponseEntity<Identity> getIdentity(@PathVariable String account) {
        Identity identity = identityService.getIdentityByAccount(account);
        if (identity != null) {
            return ResponseEntity.ok(identity);
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
    }

    // 创建用户
    @PostMapping("/")
    public ResponseEntity<Identity> createIdentity(@RequestBody Identity identity) {
        Identity createdIdentity = identityService.createIdentity(identity);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdIdentity);
    }

    // 更新用户信息
    @PutMapping("/")
    public ResponseEntity<Identity> updateIdentity(@RequestBody Identity identity) {
        Identity updatedIdentity = identityService.updateIdentity(identity);
        return ResponseEntity.ok(updatedIdentity);
    }

    // 删除用户
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteIdentity(@PathVariable Long id) {
        identityService.deleteIdentity(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
