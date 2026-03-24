package com.cdmga.uestc.webpage.common;

public class BingoTipRequest {
    private Integer issue_id;
    private String tip;
    private Integer team_id;
    private String team_name;

    public Integer getIssue_id() {
        return issue_id;
    }

    public void setIssue_id(Integer issue_id) {
        this.issue_id = issue_id;
    }

    public String getTip() {
        return tip;
    }

    public void setTip(String tip) {
        this.tip = tip;
    }

    public Integer getTeam_id() {
        return team_id;
    }

    public void setTeam_id(Integer team_id) {
        this.team_id = team_id;
    }

    public String getTeam_name() {
        return team_name;
    }

    public void setTeam_name(String team_name) {
        this.team_name = team_name;
    }
}
