package com.cdmga.uestc.webpage.Entity;

import java.util.List;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "identity")
public class Identity {
    /**
     * Id
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotEmpty(message = "用户名不能为空")
    @Size(min = 1, max = 20, message = "用户名长度在1到20个字符之间")
    private String account;

    @NotEmpty(message = "密码不能为空")
    @Size(min = 6, message = "密码长度必须至少为6个字符")
    private String password;

    /**
     * identity关联score
     */
    @OneToMany(mappedBy = "identity", fetch = FetchType.LAZY)
    private List<Score> scores;

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
