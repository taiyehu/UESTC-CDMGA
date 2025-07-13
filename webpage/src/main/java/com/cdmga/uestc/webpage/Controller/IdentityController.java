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
import com.cdmga.uestc.webpage.Entity.RegisterRequest;
import com.cdmga.uestc.webpage.Service.IdentityService;
import com.cdmga.uestc.webpage.common.Result;

@CrossOrigin(origins = "http://localhost:8081")
@RestController
@RequestMapping("/api/identity")
public class IdentityController {

    @Autowired
    private IdentityService identityService;

    
    // 注册接口
    @CrossOrigin(origins = "http://localhost:8081")
    @PostMapping("/register")
    public Result register(@RequestBody RegisterRequest registerRequest) {
        try {
            // 调用服务层注册，获取注册成功的用户信息（可选，根据业务需求）
            Identity newIdentity = identityService.register(
                    registerRequest.getAccount(),
                    registerRequest.getPassword());
            // 成功时返回 code=0，携带用户信息（或成功提示）
            return Result.success(newIdentity); // 若无需用户信息，可改为 Result.success("注册成功")
        } catch (Exception e) {
            // 失败时返回 code=1，携带错误信息（如“账号已存在”）
            return Result.error(e.getMessage());
        }
    }
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
