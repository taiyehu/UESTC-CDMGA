package com.cdmga.uestc.webpage.Dto;

import java.time.LocalDateTime;

public class RankSubmissionDto {

    private Long scoreId;
    private Integer courseId;
    private String courseTitle;
    private String image;
    private Float rawScore;
    private Float displayScore;
    private String displayScoreText;
    private Boolean specialPercentRule;
    private LocalDateTime uploadTime;

    public Long getScoreId() {
        return scoreId;
    }

    public void setScoreId(Long scoreId) {
        this.scoreId = scoreId;
    }

    public Integer getCourseId() {
        return courseId;
    }

    public void setCourseId(Integer courseId) {
        this.courseId = courseId;
    }

    public String getCourseTitle() {
        return courseTitle;
    }

    public void setCourseTitle(String courseTitle) {
        this.courseTitle = courseTitle;
    }

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }

    public Float getRawScore() {
        return rawScore;
    }

    public void setRawScore(Float rawScore) {
        this.rawScore = rawScore;
    }

    public Float getDisplayScore() {
        return displayScore;
    }

    public void setDisplayScore(Float displayScore) {
        this.displayScore = displayScore;
    }

    public String getDisplayScoreText() {
        return displayScoreText;
    }

    public void setDisplayScoreText(String displayScoreText) {
        this.displayScoreText = displayScoreText;
    }

    public Boolean getSpecialPercentRule() {
        return specialPercentRule;
    }

    public void setSpecialPercentRule(Boolean specialPercentRule) {
        this.specialPercentRule = specialPercentRule;
    }

    public LocalDateTime getUploadTime() {
        return uploadTime;
    }

    public void setUploadTime(LocalDateTime uploadTime) {
        this.uploadTime = uploadTime;
    }
}
