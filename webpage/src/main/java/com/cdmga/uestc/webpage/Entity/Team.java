package com.cdmga.uestc.webpage.Entity;

import jakarta.persistence.*;

@Entity
@Table(name = "team")
public class Team {

    @Id
    private Integer id;

    @Column(name = "course_id", nullable = false)
    private Integer courseId;

    @Column(name = "team_id")
    private Integer teamId;

    @Column(name = "identity_id", nullable = false)
    private Integer identityId;

    @Column(name = "is_touched", nullable = false)
    private Boolean isTouched = false;

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

    public Integer getTeamId() {
        return teamId;
    }

    public void setTeamId(Integer teamId) {
        this.teamId = teamId;
    }

    public Integer getIdentityId() {
        return identityId;
    }

    public void setIdentityId(Integer identityId) {
        this.identityId = identityId;
    }

    public Boolean getIsTouched() {
        return isTouched;
    }

    public void setIsTouched(Boolean isTouched) {
        this.isTouched = isTouched;
    }
}
