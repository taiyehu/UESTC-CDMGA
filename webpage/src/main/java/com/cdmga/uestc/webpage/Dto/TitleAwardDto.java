package com.cdmga.uestc.webpage.Dto;

import java.time.LocalDateTime;

public class TitleAwardDto {
    private Integer id;
    private Integer titleId;
    private String name;
    private String tier;
    private String source;
    private Integer identityId;
    private String account;
    private String status;
    private Boolean isEquipped;
    private Integer reviewerId;
    private String reviewNote;
    private LocalDateTime createdAt;
    private LocalDateTime reviewedAt;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public Integer getTitleId() { return titleId; }
    public void setTitleId(Integer titleId) { this.titleId = titleId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getTier() { return tier; }
    public void setTier(String tier) { this.tier = tier; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public Integer getIdentityId() { return identityId; }
    public void setIdentityId(Integer identityId) { this.identityId = identityId; }
    public String getAccount() { return account; }
    public void setAccount(String account) { this.account = account; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Boolean getIsEquipped() { return isEquipped; }
    public void setIsEquipped(Boolean isEquipped) { this.isEquipped = isEquipped; }
    public Integer getReviewerId() { return reviewerId; }
    public void setReviewerId(Integer reviewerId) { this.reviewerId = reviewerId; }
    public String getReviewNote() { return reviewNote; }
    public void setReviewNote(String reviewNote) { this.reviewNote = reviewNote; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; }
}
