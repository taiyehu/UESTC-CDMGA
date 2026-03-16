package com.cdmga.uestc.webpage.common;

public class TeamActionRequest {
    private Integer identity_id;
    private Integer team_id;
    private Integer owner_identity_id;
    private Integer target_identity_id;

    public Integer getIdentity_id() {
        return identity_id;
    }

    public void setIdentity_id(Integer identity_id) {
        this.identity_id = identity_id;
    }

    public Integer getTeam_id() {
        return team_id;
    }

    public void setTeam_id(Integer team_id) {
        this.team_id = team_id;
    }

    public Integer getOwner_identity_id() {
        return owner_identity_id;
    }

    public void setOwner_identity_id(Integer owner_identity_id) {
        this.owner_identity_id = owner_identity_id;
    }

    public Integer getTarget_identity_id() {
        return target_identity_id;
    }

    public void setTarget_identity_id(Integer target_identity_id) {
        this.target_identity_id = target_identity_id;
    }
}
