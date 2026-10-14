package com.cdmga.uestc.webpage.Controller;

import com.cdmga.uestc.webpage.Service.TitleService;
import com.cdmga.uestc.webpage.common.Result;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/title")
public class TitleController {
    @Autowired
    private TitleService titleService;

    public record TitleRequest(String name, String tier, Integer identityId, String acquisitionMethod, String grantReason) {}
    public record GrantRequest(Integer titleId, Integer identityId, String grantReason) {}
    public record ReviewRequest(Boolean approved, String tier, String note, String acquisitionMethod, String grantReason) {}
    public record DetailsRequest(String acquisitionMethod, String grantReason) {}

    private Integer currentUser(HttpSession session) {
        Object identityId = session.getAttribute("identityId");
        if (!(identityId instanceof Integer)) {
            throw new IllegalArgumentException("请重新登录");
        }
        return (Integer) identityId;
    }

    @GetMapping("/user/{identityId}")
    public Result listUserTitles(@PathVariable Integer identityId) {
        try {
            return Result.success(titleService.listForIdentity(identityId));
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/mine")
    public Result listMine(HttpSession session) {
        try {
            return Result.success(titleService.listMine(currentUser(session)));
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/apply")
    public Result apply(@RequestBody TitleRequest request, HttpSession session) {
        try {
            return Result.success(titleService.apply(currentUser(session), request.name(), request.acquisitionMethod()));
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/equip/{awardId}")
    public Result equip(@PathVariable Integer awardId, HttpSession session) {
        try {
            titleService.equip(currentUser(session), awardId);
            return Result.success("佩戴成功");
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/unequip")
    public Result unequip(HttpSession session) {
        try {
            titleService.unequip(currentUser(session));
            return Result.success("已取消佩戴");
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/admin/pending")
    public Result listPending(HttpSession session) {
        try {
            return Result.success(titleService.listPending(currentUser(session)));
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/admin/users")
    public Result searchUsers(@RequestParam("keyword") String keyword, HttpSession session) {
        try {
            return Result.success(titleService.searchUsers(currentUser(session), keyword));
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/admin/awards")
    public Result listAll(@RequestParam(value = "identityId", required = false) Integer identityId,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size,
            HttpSession session) {
        try {
            return Result.success(titleService.listAll(currentUser(session), identityId, page, size));
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/admin/definitions")
    public Result listDefinitions(HttpSession session) {
        try {
            return Result.success(titleService.listDefinitions(currentUser(session)));
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/admin/create")
    public Result createAndGrant(@RequestBody TitleRequest request, HttpSession session) {
        try {
            return Result.success(titleService.createAndGrant(currentUser(session), request.identityId(), request.name(), request.tier(),
                    request.acquisitionMethod(), request.grantReason()));
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/admin/grant")
    public Result grant(@RequestBody GrantRequest request, HttpSession session) {
        try {
            return Result.success(titleService.grant(currentUser(session), request.identityId(), request.titleId(), request.grantReason()));
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/admin/review/{awardId}")
    public Result review(@PathVariable Integer awardId, @RequestBody ReviewRequest request, HttpSession session) {
        try {
            return Result.success(titleService.review(currentUser(session), awardId, Boolean.TRUE.equals(request.approved()), request.tier(),
                    request.note(), request.acquisitionMethod(), request.grantReason()));
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/admin/details/{awardId}")
    public Result updateDetails(@PathVariable Integer awardId, @RequestBody DetailsRequest request, HttpSession session) {
        try {
            return Result.success(titleService.updateDetails(currentUser(session), awardId,
                    request.acquisitionMethod(), request.grantReason()));
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/admin/revoke/{awardId}")
    public Result revoke(@PathVariable Integer awardId, HttpSession session) {
        try {
            return Result.success(titleService.revoke(currentUser(session), awardId));
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
}
