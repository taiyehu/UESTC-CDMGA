package com.cdmga.uestc.webpage.Dto;

public class UserScoreDto {
    private Integer identityId;
    private Float totalScore;
    private String avatar;
    private String description;
    private String account;
    private String titleName;
    private String titleTier;
    private String titleAcquisitionMethod;

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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getAccount() {
        return account;
    }

    public void setAccount(String account) {
        this.account = account;
    }

    public String getTitleName() { return titleName; }
    public void setTitleName(String titleName) { this.titleName = titleName; }
    public String getTitleTier() { return titleTier; }
    public void setTitleTier(String titleTier) { this.titleTier = titleTier; }
    public String getTitleAcquisitionMethod() { return titleAcquisitionMethod; }
    public void setTitleAcquisitionMethod(String titleAcquisitionMethod) { this.titleAcquisitionMethod = titleAcquisitionMethod; }

    public void setPoint(double point) {
        this.totalScore = (float) point;
    }

    public Double getPoint() {
        return this.totalScore != null ? this.totalScore.doubleValue() : null;
    }
}
