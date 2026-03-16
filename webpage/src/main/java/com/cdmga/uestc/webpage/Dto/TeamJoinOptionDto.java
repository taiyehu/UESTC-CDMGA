package com.cdmga.uestc.webpage.Dto;

import java.util.ArrayList;
import java.util.List;

public class TeamJoinOptionDto {
    private Integer teamId;
    private Integer memberCount;
    private List<String> memberAccounts = new ArrayList<>();

    public TeamJoinOptionDto(Integer teamId, Integer memberCount) {
        this.teamId = teamId;
        this.memberCount = memberCount;
    }

    public Integer getTeamId() {
        return teamId;
    }

    public void setTeamId(Integer teamId) {
        this.teamId = teamId;
    }

    public Integer getMemberCount() {
        return memberCount;
    }

    public void setMemberCount(Integer memberCount) {
        this.memberCount = memberCount;
    }

    public List<String> getMemberAccounts() {
        return memberAccounts;
    }

    public void setMemberAccounts(List<String> memberAccounts) {
        this.memberAccounts = memberAccounts;
    }
}
