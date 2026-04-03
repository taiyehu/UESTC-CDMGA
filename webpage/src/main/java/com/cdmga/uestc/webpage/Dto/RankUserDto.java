package com.cdmga.uestc.webpage.Dto;

import java.util.ArrayList;
import java.util.List;

public class RankUserDto {

    private Integer identityId;
    private Float totalScore;
    private String totalScoreText;
    private String avatar;
    private String account;
    private List<RankSubmissionDto> submissions;

    public RankUserDto() {
        this.totalScore = 0f;
        this.submissions = new ArrayList<>();
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

    public String getTotalScoreText() {
        return totalScoreText;
    }

    public void setTotalScoreText(String totalScoreText) {
        this.totalScoreText = totalScoreText;
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

    public List<RankSubmissionDto> getSubmissions() {
        return submissions;
    }

    public void setSubmissions(List<RankSubmissionDto> submissions) {
        this.submissions = submissions;
    }
}
