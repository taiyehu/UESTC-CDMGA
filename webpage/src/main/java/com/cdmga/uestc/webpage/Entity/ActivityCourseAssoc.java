package com.cdmga.uestc.webpage.Entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

@Entity
@Table(name = "activity_course_assoc")
public class ActivityCourseAssoc {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // 可选关联到 Activity
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "activity_id", referencedColumnName = "id", nullable = true)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "courseAssocs"})
    private Activity activity;

    // 可选关联到 Course
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", referencedColumnName = "id", nullable = true)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "activityAssocs"})
    private Course course;

    @Column(name = "rule", length = 255)
    private String rule;

    // getters / setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Activity getActivity() { return activity; }
    public void setActivity(Activity activity) { this.activity = activity; }

    public Course getCourse() { return course; }
    public void setCourse(Course course) { this.course = course; }

    public String getRule() { return rule; }
    public void setRule(String rule) { this.rule = rule; }
}

