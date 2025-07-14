package com.cdmga.uestc.webpage.Common;

import java.time.LocalDateTime;

public class CourseRequest {
    private String title;
    private String category;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String description;
    private String image;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;

    private void update(){
        this.updateTime = LocalDateTime.now();
    }

    public CourseRequest(){
        updateTime = createTime;
    }

    // Getters and Setters
    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
        update();
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
        update();
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public LocalDateTime getStartTime(){
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime){
        this.startTime = startTime;
        update();
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
        update();
    }

    public void setDescription(String description){
        this.description = description;
        update();
    }

    public String getDescription(){
        return description;
    }

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
        update();
    }

    public LocalDateTime getCreateTime(){
        return this.createTime;
    }

    public LocalDateTime getUpdateTime(){
        return this.updateTime;
    }
}
