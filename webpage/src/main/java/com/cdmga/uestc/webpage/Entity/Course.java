package com.cdmga.uestc.webpage.Entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "course")
public class Course {

    /**
     * Id
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    /**
     * Title (课程标题)
     */
    @NotNull(message = "课程标题不能为空")
    @Column(name = "title")
    private String title;

    /**
     * Category (课程类别)
     */
    @NotNull(message = "课程类别不能为空")
    @Column(name = "category")
    private String category;

    /**
     * Start Time (开始时间)
     */
    @NotNull(message = "开始时间不能为空")
    @Column(name = "start_time")
    private LocalDateTime startTime;

    /**
     * End Time (结束时间)
     */
    @NotNull(message = "结束时间不能为空")
    @Column(name = "end_time")
    private LocalDateTime endTime;

    /**
     * Description (课程描述)
     */
    @Column(name = "description")
    private String description;

    /**
     * Image (图片)
     */
    @Column(name = "image")
    private String image;

    /**
     * Is Deleted (是否删除)
     */
    @Column(name = "is_deleted")
    private Boolean isDeleted;

    /**
     * Created At (创建时间)
     */
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    /**
     * Updated At (更新时间)
     */
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * course关联score
     */
    @OneToMany(mappedBy = "course", fetch = FetchType.LAZY)
    private List<Score> scores;

    public Course(){
        isDeleted = false;
    }

    public Course(LocalDateTime createTime){
        createdAt = createTime;
        isDeleted = false;
    }

    // Getters and Setters
    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }

    public Boolean getIsDeleted() {
        return isDeleted;
    }

    public void setIsDeleted(Boolean isDeleted) {
        this.isDeleted = isDeleted;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
