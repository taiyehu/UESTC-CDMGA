package com.cdmga.uestc.webpage.Controller;

import com.cdmga.uestc.webpage.Entity.Identity;
import com.cdmga.uestc.webpage.Entity.IdentityExtraProfile;
import com.cdmga.uestc.webpage.Repository.IdentityExtraProfileRepository;
import com.cdmga.uestc.webpage.Repository.IdentityRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/identity-extra-profile")
public class IdentityExtraProfileController {
    private final IdentityRepository identities;
    private final IdentityExtraProfileRepository extras;

    public IdentityExtraProfileController(IdentityRepository identities, IdentityExtraProfileRepository extras) {
        this.identities = identities;
        this.extras = extras;
    }

    public record ExtraProfileRequest(String qqNumber, String qqEmail, String university) {}
    public record ExtraProfileResponse(String qqNumber, String qqEmail, String university) {}
    public record SchoolResponse(String university) {}

    @GetMapping("/me")
    public ResponseEntity<?> getMine(HttpSession session) {
        if (!(session.getAttribute("identityId") instanceof Integer id))
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(extras.findById(id)
                .map(this::response)
                .orElse(new ExtraProfileResponse("", "", "")));
    }

    @GetMapping("/user/{identityId}/school")
    public ResponseEntity<SchoolResponse> getSchool(@PathVariable Integer identityId) {
        String university = extras.findById(identityId)
                .map(IdentityExtraProfile::getUniversity)
                .orElse(null);
        return ResponseEntity.ok(new SchoolResponse(university));
    }
    @PutMapping("/me")
    public ResponseEntity<?> saveMine(@RequestBody ExtraProfileRequest request, HttpSession session) {
        if (!(session.getAttribute("identityId") instanceof Integer id))
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        String qqNumber = request == null ? null : optionalText(request.qqNumber());
        String qqEmail = request == null ? null : optionalText(request.qqEmail());
        if (request == null) return ResponseEntity.badRequest().body("请求内容不能为空");
        boolean validUniversity = "UESTC".equals(request.university()) || "SWJTU".equals(request.university());
        boolean validQq = qqNumber == null || qqNumber.matches("[1-9][0-9]{4,19}");
        boolean validEmail = qqEmail == null || (qqEmail.length() <= 254 && qqEmail.matches("(?i)[A-Za-z0-9._+-]+@qq[.]com"));
        if (!validQq || !validEmail || !validUniversity)
            return ResponseEntity.badRequest().body("请填写有效的QQ号、QQ邮箱及学校；QQ号和QQ邮箱可留空");
        Identity identity = identities.findById(id).orElse(null);
        if (identity == null || Boolean.TRUE.equals(identity.getIsDeleted()))
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        IdentityExtraProfile extra = extras.findById(id).orElseGet(IdentityExtraProfile::new);
        extra.setIdentity(identity);
        extra.setQqNumber(qqNumber);
        extra.setQqEmail(qqEmail);
        extra.setUniversity(request.university());
        return ResponseEntity.ok(response(extras.save(extra)));
    }

    private String optionalText(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim();
    }

    private ExtraProfileResponse response(IdentityExtraProfile extra) {
        return new ExtraProfileResponse(extra.getQqNumber() == null ? "" : extra.getQqNumber(),
                extra.getQqEmail() == null ? "" : extra.getQqEmail(), extra.getUniversity());
    }
}