package com.cdmga.uestc.webpage.Controller;

import com.cdmga.uestc.webpage.Service.MailService;
import com.cdmga.uestc.webpage.common.Result;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/mail")
public class MailController {
    @Autowired private MailService mail;

    private int user(HttpSession session) { return (Integer) session.getAttribute("identityId"); }

    @GetMapping public Result inbox(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size,
                                   @RequestParam(defaultValue = "all") String category, HttpSession session) {
        return Result.success(mail.inbox(user(session), page, size, category));
    }
    @GetMapping("/counts") public Result counts(HttpSession session) { return Result.success(mail.counts(user(session))); }
    @GetMapping("/forum-unread") public Result forumUnread(HttpSession session) { return Result.success(mail.unreadForumPosts(user(session))); }
    @PostMapping("/{id}/read") public Result read(@PathVariable long id, HttpSession session) { mail.read(user(session), id); return Result.success("已读"); }
    @PostMapping("/forum/{postId}/read") public Result readForum(@PathVariable long postId, HttpSession session) { mail.readForumPost(user(session), postId); return Result.success("已读"); }
}
