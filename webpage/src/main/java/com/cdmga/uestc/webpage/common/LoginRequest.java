package com.cdmga.uestc.webpage.common;

import org.springframework.stereotype.Service;

@Service
public class LoginRequest {
    private String account;
    private String password;

    // Getters and Setters
    public String getAccount() {
        return account;
    }

    public void setAccount(String account) {
        this.account = account;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}

