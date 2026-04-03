package com.cdmga.uestc.webpage.Dto;

public class RankConfigDto {

    private Integer id;
    private Integer courseId;
    private String courseTitle;
    private String category;
    private Float countingRules;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
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

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Float getCountingRules() {
        return countingRules;
    }

    public void setCountingRules(Float countingRules) {
        this.countingRules = countingRules;
    }
}
