package com.cdmga.uestc.webpage.Entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;

@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
@Entity
@Table(name = "activity")
public class Activity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "activity_banner", nullable = false)
    private String activityBanner;

    @Column(name = "activity_file", nullable = false)
    private String activityFile;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false)
    private String name;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;


    @JsonIgnore
    @OneToMany(mappedBy = "activity", fetch = FetchType.LAZY)
    private List<ActivityCourseAssoc> courseAssocs;

    // Getters and Setters

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getActivityBanner() { return activityBanner; }
    public void setActivityBanner(String activityBanner) { this.activityBanner = activityBanner; }

    public String getActivityFile() { return activityFile; }
    public void setActivityFile(String activityFile) { this.activityFile = activityFile; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }

    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }

    public Boolean getIsDeleted() { return isDeleted; }
    public void setIsDeleted(Boolean isDeleted) { this.isDeleted = isDeleted; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public List<ActivityCourseAssoc> getCourseAssocs() { return courseAssocs; }
    public void setCourseAssocs(List<ActivityCourseAssoc> courseAssocs) { this.courseAssocs = courseAssocs; }
}
