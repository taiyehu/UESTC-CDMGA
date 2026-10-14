package com.cdmga.uestc.webpage.Entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "title_definition")
public class TitleDefinition {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "name", nullable = false, length = 32)
    private String name;

    @Column(name = "tier", nullable = false, length = 16)
    private String tier;

    @Column(name = "source", nullable = false, length = 24)
    private String source;

    @Column(name = "identity_id", nullable = false)
    private Integer identityId;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getTier() { return tier; }
    public void setTier(String tier) { this.tier = tier; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public Integer getIdentityId() { return identityId; }
    public void setIdentityId(Integer identityId) { this.identityId = identityId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
