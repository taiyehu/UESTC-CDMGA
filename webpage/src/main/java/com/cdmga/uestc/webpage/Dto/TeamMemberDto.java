package com.cdmga.uestc.webpage.Dto;

public class TeamMemberDto {
    private Integer identityId;
    private String account;

    public TeamMemberDto(Integer identityId, String account) {
        this.identityId = identityId;
        this.account = account;
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
}
