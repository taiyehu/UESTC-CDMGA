package com.cdmga.uestc.webpage.Entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "award")
public class Award {

    @Id
    @Column(name = "course_id")
    private Integer courseId;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", referencedColumnName = "id")
    @JsonIgnore
    private Course course;

    @Column(name = "cost", nullable = false)
    private Integer cost;

    @Column(name = "total_stock", nullable = false)
    private Integer totalStock;

    @Column(name = "remaining_stock", nullable = false)
    private Integer remainingStock;

    @Column(name = "sold_out_at")
    private LocalDateTime soldOutAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Integer getCourseId() {
        return courseId;
    }

    public void setCourseId(Integer courseId) {
        this.courseId = courseId;
    }

    public Course getCourse() {
        return course;
    }

    public void setCourse(Course course) {
        this.course = course;
    }

    public Integer getCost() {
        return cost;
    }

    public void setCost(Integer cost) {
        this.cost = cost;
    }

    public Integer getTotalStock() {
        return totalStock;
    }

    public void setTotalStock(Integer totalStock) {
        this.totalStock = totalStock;
    }

    public Integer getRemainingStock() {
        return remainingStock;
    }

    public void setRemainingStock(Integer remainingStock) {
        this.remainingStock = remainingStock;
    }

    public LocalDateTime getSoldOutAt() {
        return soldOutAt;
    }

    public void setSoldOutAt(LocalDateTime soldOutAt) {
        this.soldOutAt = soldOutAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
