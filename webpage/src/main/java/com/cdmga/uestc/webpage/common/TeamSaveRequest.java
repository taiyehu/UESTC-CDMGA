package com.cdmga.uestc.webpage.common;

import java.util.List;

public class TeamSaveRequest {
    private Integer team_id;
    private List<Integer> member_ids;
    private Integer admin_identity_id;

    public Integer getTeam_id() {
        return team_id;
    }

    public void setTeam_id(Integer team_id) {
        this.team_id = team_id;
    }

    public List<Integer> getMember_ids() {
        return member_ids;
    }

    public void setMember_ids(List<Integer> member_ids) {
        this.member_ids = member_ids;
    }

    public Integer getAdmin_identity_id() {
        return admin_identity_id;
    }

    public void setAdmin_identity_id(Integer admin_identity_id) {
        this.admin_identity_id = admin_identity_id;
    }
}
