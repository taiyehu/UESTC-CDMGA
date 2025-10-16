package com.cdmga.uestc.webpage.Common;

import java.time.LocalDateTime;

public class ScoreRequest {
    private Integer course_id;
    private Integer identity_id;
    private LocalDateTime upload_time;
    private String image;
    private float point;
    private Boolean is_scored;
    private String remark;
    private LocalDateTime created_at;
    private LocalDateTime updated_at;

    private void update(){
        this.updated_at = LocalDateTime.now();
    }

    public ScoreRequest(){
        updated_at = created_at;
    }

    // Getters and Setters
    public Integer getCourse_id() {
        return course_id;
    }

    public void setCourse_id(Integer course_id) {
        this.course_id = course_id;
        update();
    }

    public Integer getIdentity_id() {
        return identity_id;
    }

    public void setIdentity_id(Integer identity_id) {
        this.identity_id = identity_id;
        update();
    }

    public LocalDateTime getUpload_time() {
        return upload_time;
    }

    public void setUpload_time(LocalDateTime upload_time) {
        this.upload_time = upload_time;
        update();
    }

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
        update();
    }

    public float getPoint() {
        return point;
    }

    public void setPoint(float point) {
        this.point = point;
        update();
    }

    public Boolean getIs_scored() {
        return is_scored;
    }

    public void setIs_scored(Boolean is_scored) {
        this.is_scored = is_scored;
        update();
    }

    public String getRemark() {
        return remark;
    }

    public void setRemark(String remark) {
        this.remark = remark;
        update();
    }

    public LocalDateTime getCreated_at() {
        return created_at;
    }

    public void setCreated_at(LocalDateTime created_at) {
        this.created_at = created_at;
    }

    public LocalDateTime getUpdated_at() {
        return updated_at;
    }
}
