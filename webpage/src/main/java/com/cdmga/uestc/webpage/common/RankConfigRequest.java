package com.cdmga.uestc.webpage.common;

public class RankConfigRequest {

    private Integer courseId;
    private Float countingRules;

    public Integer getCourseId() {
        return courseId;
    }

    public void setCourseId(Integer courseId) {
        this.courseId = courseId;
    }

    public Float getCountingRules() {
        return countingRules;
    }

    public void setCountingRules(Float countingRules) {
        this.countingRules = countingRules;
    }
}
