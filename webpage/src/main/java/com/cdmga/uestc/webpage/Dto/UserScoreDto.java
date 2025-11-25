package com.cdmga.uestc.webpage.Dto;

public class UserScoreDto {
    private Integer identityId;
    private Float totalScore;
    private String avatar;
    private String account;

    public UserScoreDto(Integer identityId, Float totalScore, String avatar, String account) {
        this.identityId = identityId;
        this.totalScore = totalScore;
        this.avatar = avatar;
        this.account = account;
    }
    

    public Integer getIdentityId() {
        return identityId;
    }

    public void setIdentityId(Integer identityId) {
        this.identityId = identityId;
    }

    public Float getTotalScore() {
        return totalScore;
    }

    public void setTotalScore(Float totalScore) {
        this.totalScore = totalScore;
    }

    public String getAvatar() {
        return avatar;
    }

    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }

    public String getAccount() {
        return account;
    }

    public void setAccount(String account) {
        this.account = account;
    }

    public void setPoint(double point) {
        this.totalScore = (float) point;
    }

    public Double getPoint() {
        return this.totalScore != null ? this.totalScore.doubleValue() : null;
    }
}