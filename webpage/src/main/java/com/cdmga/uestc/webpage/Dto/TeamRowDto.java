package com.cdmga.uestc.webpage.Dto;

import java.util.ArrayList;
import java.util.List;

public class TeamRowDto {
    private Integer teamId;
    private List<TeamMemberDto> members = new ArrayList<>();

    public TeamRowDto(Integer teamId) {
        this.teamId = teamId;
    }

    public Integer getTeamId() {
        return teamId;
    }

    public void setTeamId(Integer teamId) {
        this.teamId = teamId;
    }

    public List<TeamMemberDto> getMembers() {
        return members;
    }

    public void setMembers(List<TeamMemberDto> members) {
        this.members = members;
    }
}
