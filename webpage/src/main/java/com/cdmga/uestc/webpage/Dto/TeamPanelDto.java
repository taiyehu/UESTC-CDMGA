package com.cdmga.uestc.webpage.Dto;

import java.util.ArrayList;
import java.util.List;

public class TeamPanelDto {
    private Integer teamId;
    private Double totalScore;
    private List<TeamPanelMemberDto> members = new ArrayList<>();

    public TeamPanelDto(Integer teamId, Double totalScore) {
        this.teamId = teamId;
        this.totalScore = totalScore;
    }

    public Integer getTeamId() {
        return teamId;
    }

    public void setTeamId(Integer teamId) {
        this.teamId = teamId;
    }

    public Double getTotalScore() {
        return totalScore;
    }

    public void setTotalScore(Double totalScore) {
        this.totalScore = totalScore;
    }

    public List<TeamPanelMemberDto> getMembers() {
        return members;
    }

    public void setMembers(List<TeamPanelMemberDto> members) {
        this.members = members;
    }
}
