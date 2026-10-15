package com.cdmga.uestc.webpage.Controller;

import com.cdmga.uestc.webpage.Service.DailyCheckinService;
import com.cdmga.uestc.webpage.common.Result;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/checkin")
public class DailyCheckinController {
    @Autowired
    private DailyCheckinService service;

    private Integer currentUser(HttpSession session) {
        Object identityId = session.getAttribute("identityId");
        if (!(identityId instanceof Integer)) throw new IllegalArgumentException("请重新登录");
        return (Integer) identityId;
    }

    @GetMapping("/today")
    public Result today(HttpSession session) {
        try {
            return Result.success(service.today(currentUser(session)));
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping
    public Result checkin(HttpSession session) {
        try {
            return Result.success(service.checkin(currentUser(session)));
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
}
