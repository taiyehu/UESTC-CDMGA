package com.cdmga.uestc.webpage.Entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "identity")
public class Identity {
    @Id
    private Long id;

    private String account;
    private String password;

    public long getId(){
        return id;
    }

    public void setId(Long id){
        this.id = id;
    }
    
    public String getAccount(){
        return account;
    }

    public void setAccount(String account){
        this.account = account;
    }

    public String getPassword(){
        return password;
    }

    public void setPassword(String password){
        this.password = password;
    }
}
