package com.cdmga.uestc.webpage.Dto;

public class TeamPanelMemberDto {
    private Integer identityId;
    private String account;
    private String avatar;

    public TeamPanelMemberDto(Integer identityId, String account, String avatar) {
        this.identityId = identityId;
        this.account = account;
        this.avatar = avatar;
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
}
