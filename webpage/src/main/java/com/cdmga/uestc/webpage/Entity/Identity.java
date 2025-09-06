package com.cdmga.uestc.webpage.Entity;

import java.util.List;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

@Entity
@Table(name = "identity")
public class Identity {
    /**
     * Id
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

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
    // 角色（admin/user），默认为 user
    @Column(nullable = false, columnDefinition = "ENUM('admin','user') DEFAULT 'user' COMMENT '角色：管理员或普通用户'")
    private String role = "user";

    // 逻辑删除标志（false = 未删除，true = 已删除）
    @Column(nullable = false)
    private Boolean isDeleted = false;

    // 创建时间（自动设置）
    @Column(name = "created_at", updatable = false)
    @org.hibernate.annotations.CreationTimestamp
    private LocalDateTime createdAt;

    // 更新时间（每次更新自动设置）
    @Column(name = "updated_at")
    @org.hibernate.annotations.UpdateTimestamp
    private LocalDateTime updatedAt;

    // ========== Getter 和 Setter ==========

    public long getId(){
        return id;
    }
    public void setId(Integer id){
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

    public String getRole() {
        return role;
    }
    public void setRole(String role) {
        this.role = role;
    }

    public Boolean getIsDeleted() {
        return isDeleted;
    }
    public void setIsDeleted(Boolean isDeleted) {
        this.isDeleted = isDeleted;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
