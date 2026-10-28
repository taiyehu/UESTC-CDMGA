package com.cdmga.uestc.webpage.Entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "identity_extra_profile")
public class IdentityExtraProfile {
    @Id
    @Column(name = "identity_id")
    private Integer identityId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId
    @JoinColumn(name = "identity_id")
    private Identity identity;

    @Column(name = "qq_number", nullable = true, length = 20)
    private String qqNumber;

    @Column(name = "qq_email", nullable = true, length = 254)
    private String qqEmail;

    @Column(name = "university", nullable = false, length = 16)
    private String university;

    public Integer getIdentityId() { return identityId; }
    public Identity getIdentity() { return identity; }
    public void setIdentity(Identity identity) { this.identity = identity; }
    public String getQqNumber() { return qqNumber; }
    public void setQqNumber(String qqNumber) { this.qqNumber = qqNumber; }
    public String getQqEmail() { return qqEmail; }
    public void setQqEmail(String qqEmail) { this.qqEmail = qqEmail; }
    public String getUniversity() { return university; }
    public void setUniversity(String university) { this.university = university; }
}