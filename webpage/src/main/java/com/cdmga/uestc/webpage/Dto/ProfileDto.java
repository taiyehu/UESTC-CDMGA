package com.cdmga.uestc.webpage.Dto;

public class ProfileDto {
    private Integer id;
    private Integer identityId;
    private String account; // 用户名
    private String avatar;
    private String description;
    private String title;
    private Integer status;

    public Integer getId() {
        return id;
    }
    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getIdentityId() {
        return identityId;
    }
    public void setIdentityId(Integer identityId) {
        this.identityId = identityId;
    }

    public String getAccount() {
        return account;
    }
    public void setAccount(String account) {
        this.account = account;
    }

    public String getAvatar() {
        return avatar;
    }
    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }

    public String getDescription() {
        return description;
    }
    public void setDescription(String description) {
        this.description = description;
    }

    public String getTitle() {
        return title;
    }
    public void setTitle(String title) {
        this.title = title;
    }

    public Integer getStatus() {
        return status;
    }
    public void setStatus(Integer status) {
        this.status = status;
    }
}