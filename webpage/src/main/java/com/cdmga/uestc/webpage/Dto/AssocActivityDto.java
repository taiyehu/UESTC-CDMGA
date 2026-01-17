package com.cdmga.uestc.webpage.Dto;

import java.time.LocalDateTime;

public class AssocActivityDto {
    private Integer id;

    private String activityBanner;

    private String activityFile;

    private String description;

    private String name;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private String rule;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getActivityBanner() {
        return activityBanner;
    }

    public void setActivityBanner(String activityBanner) {
        this.activityBanner = activityBanner;
    }

    public String getActivityFile() {
        return activityFile;
    }

    public void setActivityFile(String activityFile) {
        this.activityFile = activityFile;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }

    public String getRule() {
        return rule;
    }

    public void setRule(String rule) {
        this.rule = rule;
    }
}
