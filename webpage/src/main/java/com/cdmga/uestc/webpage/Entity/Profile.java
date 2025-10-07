package com.cdmga.uestc.webpage.Entity;

import jakarta.persistence.*;
import java.io.Serializable;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "profile")
public class Profile implements Serializable {

    /**
     * Id
     */
    @Id
    @Column(name = "id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    /**
     * Avatar (头像)
     */
    @Column(name = "avatar")
    private String avatar;

    /**
     * description (描述)
     */
    @Column(name = "description")
    private String description;

    /**
     * Title (头衔)
     */
    @Column(name = "title")
    private String title;

    @Column(name = "status")
    private Integer status;

    /**
     * Identity Id (外键)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "identity_id", referencedColumnName = "id")
    @JsonIgnore
    private Identity identity;

    // 构造方法
    public Profile() {}

    // Getters and Setters
    public Integer getId() {
        return id;
    }
    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getIdentityId() {
        return identity != null ? identity.getId() : null;
    }
    public void setIdentityId(Integer identityId) {
        if (this.identity == null) {
            this.identity = new Identity();
        }
        this.identity.setId(identityId);
    }

    public String getAvatar() {
        return avatar;
    }
    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }

    public String getDescription() {
        return description;
    }
    public void setDescription(String description) {
        this.description = description;
    }

    public String getTitle() {
        return title;
    }
    public void setTitle(String title) {
        this.title = title;
    }

    public Identity getIdentity() {
        return identity;
    }
    public void setIdentity(Identity identity) {
        this.identity = identity;
    }

    public Integer getStatus() {
        return status;
    }
    public void setStatus(Integer status) {
        this.status = status;
    }
}