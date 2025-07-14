package com.cdmga.uestc.webpage.Entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Entity
@Table(name = "score")
public class Score {

    /**
     * Id
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Upload Time (上传时间)
     */
    @NotNull(message = "上传时间不能为空")
    @Column(name = "upload_time")
    private LocalDateTime uploadTime;

    /**
     * Image (图片)
     */
    @Column(name = "image")
    private String image;

    /**
     * Score (得分)
     */
    @Column(name = "score")
    private Float score;

    /**
     * Is Scored (是否评分)
     */
    @Column(name = "is_scored")
    private Boolean isScored;

    /**
     * Remark (备注)
     */
    @Column(name = "remark")
    private String remark;

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
     * Course ID (课程ID)
     */
    @NotNull(message = "课程ID不能为空")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", referencedColumnName = "id", insertable = false, updatable = false)
    private Course course;

    /**
     * Identity ID (用户身份ID)
     */
    @NotNull(message = "身份ID不能为空")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "identity_id", referencedColumnName = "id", insertable = false, updatable = false)
    private Identity identity;

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Course getCourse() {
        return course;
    }

    public void setCourse(Course course) {
        this.course = course;
    }

    public Identity getIdentity() {
        return identity;
    }

    public void setIdentity(Identity identity) {
        this.identity = identity;
    }

    public LocalDateTime getUploadTime() {
        return uploadTime;
    }

    public void setUploadTime(LocalDateTime uploadTime) {
        this.uploadTime = uploadTime;
    }

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }

    public Float getScore() {
        return score;
    }

    public void setScore(Float score) {
        this.score = score;
    }

    public Boolean getIsScored() {
        return isScored;
    }

    public void setIsScored(Boolean isScored) {
        this.isScored = isScored;
    }

    public String getRemark() {
        return remark;
    }

    public void setRemark(String remark) {
        this.remark = remark;
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
