package com.cdmga.uestc.webpage.Service;

import com.cdmga.uestc.webpage.Dto.TitleAwardDto;
import com.cdmga.uestc.webpage.Entity.Identity;
import com.cdmga.uestc.webpage.Entity.TitleAward;
import com.cdmga.uestc.webpage.Entity.TitleDefinition;
import com.cdmga.uestc.webpage.Repository.IdentityRepository;
import com.cdmga.uestc.webpage.Repository.TitleAwardRepository;
import com.cdmga.uestc.webpage.Repository.TitleDefinitionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class TitleService {
    @Autowired
    private TitleDefinitionRepository titleDefinitionRepository;

    @Autowired
    private TitleAwardRepository titleAwardRepository;

    @Autowired
    private IdentityRepository identityRepository;

    public Identity requireUser(Integer identityId) {
        Identity user = identityId == null ? null : identityRepository.findById(identityId).orElse(null);
        if (user == null || Boolean.TRUE.equals(user.getIsDeleted())) {
            throw new IllegalArgumentException("请重新登录");
        }
        return user;
    }

    public Identity requireAdmin(Integer identityId) {
        Identity user = requireUser(identityId);
        if (!"admin".equals(user.getRole())) {
            throw new IllegalArgumentException("需要管理员权限");
        }
        return user;
    }

    private String validName(String name) {
        String value = name == null ? "" : name.trim();
        if (value.isEmpty() || value.codePointCount(0, value.length()) > 32) {
            throw new IllegalArgumentException("称号文字应为1到32字");
        }
        return value;
    }

    private String validTier(String tier) {
        if (!"color".equals(tier) && !"gold".equals(tier)
                && !"silver".equals(tier) && !"normal".equals(tier)) {
            throw new IllegalArgumentException("称号等级无效");
        }
        return tier;
    }

    private String optionalText(String value, String field) {
        String trimmed = value == null ? "" : value.trim();
        if (trimmed.length() > 255) {
            throw new IllegalArgumentException(field + "不能超过255字");
        }
        return trimmed.isEmpty() ? null : trimmed;
    }

    private Identity requireRecipient(Integer identityId) {
        if (identityId == null || identityId <= 0) {
            throw new IllegalArgumentException("用户ID无效");
        }
        return requireUser(identityId);
    }

    @Transactional
    public TitleAwardDto apply(Integer identityId, String name, String acquisitionMethod) {
        Identity user = requireUser(identityId);
        TitleDefinition title = new TitleDefinition();
        title.setName(validName(name));
        title.setTier("normal");
        title.setSource("user_application");
        title.setAcquisitionMethod(optionalText(acquisitionMethod, "获得方式"));
        title.setIdentityId(user.getId());
        title = titleDefinitionRepository.save(title);
        TitleAward award = new TitleAward();
        award.setTitleId(title.getId());
        award.setIdentityId(user.getId());
        award.setStatus("pending");
        award.setIsEquipped(false);
        award = titleAwardRepository.save(award);
        return toDto(award, title, user);
    }

    @Transactional
    public TitleAwardDto createAndGrant(Integer adminId, Integer recipientId, String name, String tier,
            String acquisitionMethod, String grantReason) {
        Identity admin = requireAdmin(adminId);
        Identity recipient = requireRecipient(recipientId);
        TitleDefinition title = new TitleDefinition();
        title.setName(validName(name));
        title.setTier(validTier(tier));
        title.setSource("admin_created");
        title.setAcquisitionMethod(optionalText(acquisitionMethod, "获得方式"));
        title.setIdentityId(admin.getId());
        title = titleDefinitionRepository.save(title);
        return grantSavedTitle(admin, recipient, title, grantReason);
    }

    @Transactional
    public TitleAwardDto grant(Integer adminId, Integer recipientId, Integer titleId, String grantReason) {
        Identity admin = requireAdmin(adminId);
        Identity recipient = requireRecipient(recipientId);
        TitleDefinition title = titleDefinitionRepository.findById(titleId)
                .orElseThrow(() -> new IllegalArgumentException("称号不存在"));
        if ("user_application".equals(title.getSource())) {
            throw new IllegalArgumentException("用户申请的称号不能发放给其他用户");
        }
        return grantSavedTitle(admin, recipient, title, grantReason);
    }

    private TitleAwardDto grantSavedTitle(Identity admin, Identity recipient, TitleDefinition title, String grantReason) {
        if (titleAwardRepository.findByIdentityIdAndTitleId(recipient.getId(), title.getId()).isPresent()) {
            throw new IllegalArgumentException("该用户已拥有此称号");
        }
        TitleAward award = new TitleAward();
        award.setTitleId(title.getId());
        award.setIdentityId(recipient.getId());
        award.setStatus("approved");
        award.setIsEquipped(false);
        award.setReviewerId(admin.getId());
        award.setReviewedAt(LocalDateTime.now());
        award.setGrantedAt(award.getReviewedAt());
        award.setGrantReason(optionalText(grantReason, "发放原因"));
        award = titleAwardRepository.save(award);
        return toDto(award, title, recipient);
    }

    @Transactional
    public TitleAwardDto review(Integer adminId, Integer awardId, boolean approved, String tier, String note,
            String acquisitionMethod, String grantReason) {
        Identity admin = requireAdmin(adminId);
        TitleAward award = titleAwardRepository.findById(awardId)
                .orElseThrow(() -> new IllegalArgumentException("申请不存在"));
        if (!"pending".equals(award.getStatus())) {
            throw new IllegalArgumentException("该申请已处理");
        }
        TitleDefinition title = titleDefinitionRepository.findById(award.getTitleId())
                .orElseThrow(() -> new IllegalArgumentException("称号不存在"));
        if (approved) {
            title.setTier(validTier(tier));
            title.setAcquisitionMethod(optionalText(acquisitionMethod, "获得方式"));
            titleDefinitionRepository.save(title);
        }
        award.setStatus(approved ? "approved" : "rejected");
        award.setReviewerId(admin.getId());
        award.setReviewedAt(LocalDateTime.now());
        award.setReviewNote(optionalText(note, "审核备注"));
        if (approved) {
            award.setGrantedAt(award.getReviewedAt());
            award.setGrantReason(optionalText(grantReason, "发放原因"));
        }
        award = titleAwardRepository.save(award);
        return toDto(award, title, requireUser(award.getIdentityId()));
    }

    @Transactional
    public void equip(Integer identityId, Integer awardId) {
        Identity user = requireUser(identityId);
        identityRepository.findByIdForUpdate(user.getId());
        TitleAward chosen = titleAwardRepository.findById(awardId)
                .orElseThrow(() -> new IllegalArgumentException("称号不存在"));
        if (!user.getId().equals(chosen.getIdentityId()) || !"approved".equals(chosen.getStatus())) {
            throw new IllegalArgumentException("只能佩戴自己已通过的称号");
        }
        for (TitleAward award : titleAwardRepository.findByIdentityIdOrderByIdDesc(user.getId())) {
            if (Boolean.TRUE.equals(award.getIsEquipped()) && !award.getId().equals(chosen.getId())) {
                award.setIsEquipped(false);
                titleAwardRepository.saveAndFlush(award);
            }
        }
        chosen.setIsEquipped(true);
        titleAwardRepository.save(chosen);
    }

    @Transactional
    public void unequip(Integer identityId) {
        Identity user = requireUser(identityId);
        identityRepository.findByIdForUpdate(user.getId());
        for (TitleAward award : titleAwardRepository.findByIdentityIdOrderByIdDesc(user.getId())) {
            if (Boolean.TRUE.equals(award.getIsEquipped())) {
                award.setIsEquipped(false);
                titleAwardRepository.save(award);
            }
        }
    }

    public List<TitleAwardDto> listForIdentity(Integer identityId) {
        Identity user = requireRecipient(identityId);
        List<TitleAwardDto> result = new ArrayList<>();
        for (TitleAward award : titleAwardRepository.findByIdentityIdOrderByIdDesc(user.getId())) {
            if (!"approved".equals(award.getStatus())) continue;
            TitleDefinition title = titleDefinitionRepository.findById(award.getTitleId()).orElse(null);
            if (title != null) result.add(toDto(award, title, user));
        }
        return result;
    }

    public List<TitleAwardDto> listMine(Integer identityId) {
        Identity user = requireUser(identityId);
        List<TitleAwardDto> result = new ArrayList<>();
        for (TitleAward award : titleAwardRepository.findByIdentityIdOrderByIdDesc(user.getId())) {
            TitleDefinition title = titleDefinitionRepository.findById(award.getTitleId()).orElse(null);
            if (title != null) result.add(toDto(award, title, user));
        }
        return result;
    }

    public List<TitleAwardDto> listPending(Integer adminId) {
        requireAdmin(adminId);
        List<TitleAwardDto> result = new ArrayList<>();
        for (TitleAward award : titleAwardRepository.findByStatusOrderByIdAsc("pending")) {
            TitleDefinition title = titleDefinitionRepository.findById(award.getTitleId()).orElse(null);
            Identity user = identityRepository.findById(award.getIdentityId()).orElse(null);
            if (title != null && user != null) result.add(toDto(award, title, user));
        }
        return result;
    }

    public List<Map<String, Object>> listDefinitions(Integer adminId) {
        requireAdmin(adminId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (TitleDefinition title : titleDefinitionRepository.findAllByOrderByIdDesc()) {
            if (!"admin_created".equals(title.getSource())) continue;
            Map<String, Object> row = new HashMap<>();
            row.put("id", title.getId());
            row.put("name", title.getName());
            row.put("tier", title.getTier());
            row.put("acquisitionMethod", title.getAcquisitionMethod());
            result.add(row);
        }
        return result;
    }

    public List<Map<String, Object>> searchUsers(Integer adminId, String keyword) {
        requireAdmin(adminId);
        String query = keyword == null ? "" : keyword.trim();
        if (query.isEmpty()) return new ArrayList<>();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Identity user : identityRepository.searchActiveByAccount(query, PageRequest.of(0, 20))) {
            Map<String, Object> row = new HashMap<>();
            row.put("id", user.getId());
            row.put("account", user.getAccount());
            result.add(row);
        }
        return result;
    }

    public Map<String, Object> listAll(Integer adminId, Integer identityId, int page, int size) {
        requireAdmin(adminId);
        if (page < 0 || size < 1 || size > 100) throw new IllegalArgumentException("分页参数无效");
        Page<TitleAward> awards = identityId == null
                ? titleAwardRepository.findAllByOrderByIdDesc(PageRequest.of(page, size))
                : titleAwardRepository.findByIdentityIdOrderByIdDesc(identityId, PageRequest.of(page, size));
        List<TitleAwardDto> rows = new ArrayList<>();
        for (TitleAward award : awards.getContent()) {
            TitleDefinition title = titleDefinitionRepository.findById(award.getTitleId()).orElse(null);
            Identity user = identityRepository.findById(award.getIdentityId()).orElse(null);
            if (title != null && user != null) rows.add(toDto(award, title, user));
        }
        Map<String, Object> result = new HashMap<>();
        result.put("list", rows);
        result.put("total", awards.getTotalElements());
        return result;
    }

    @Transactional
    public TitleAwardDto updateDetails(Integer adminId, Integer awardId, String acquisitionMethod, String grantReason) {
        requireAdmin(adminId);
        TitleAward award = titleAwardRepository.findById(awardId)
                .orElseThrow(() -> new IllegalArgumentException("称号记录不存在"));
        TitleDefinition title = titleDefinitionRepository.findById(award.getTitleId())
                .orElseThrow(() -> new IllegalArgumentException("称号不存在"));
        title.setAcquisitionMethod(optionalText(acquisitionMethod, "获得方式"));
        award.setGrantReason(optionalText(grantReason, "发放原因"));
        titleDefinitionRepository.save(title);
        titleAwardRepository.save(award);
        return toDto(award, title, requireUser(award.getIdentityId()));
    }

    @Transactional
    public TitleAwardDto revoke(Integer adminId, Integer awardId) {
        Identity admin = requireAdmin(adminId);
        TitleAward award = titleAwardRepository.findById(awardId)
                .orElseThrow(() -> new IllegalArgumentException("称号记录不存在"));
        if (!"approved".equals(award.getStatus())) {
            throw new IllegalArgumentException("只能撤销已发放的称号");
        }
        award.setStatus("revoked");
        award.setIsEquipped(false);
        award.setRevokedBy(admin.getId());
        award.setRevokedAt(LocalDateTime.now());
        award = titleAwardRepository.save(award);
        TitleDefinition title = titleDefinitionRepository.findById(award.getTitleId()).orElseThrow();
        return toDto(award, title, requireUser(award.getIdentityId()));
    }

    private TitleAwardDto toDto(TitleAward award, TitleDefinition title, Identity user) {
        TitleAwardDto dto = new TitleAwardDto();
        dto.setId(award.getId());
        dto.setTitleId(title.getId());
        dto.setName(title.getName());
        dto.setTier(title.getTier());
        dto.setSource(title.getSource());
        dto.setAcquisitionMethod(title.getAcquisitionMethod());
        dto.setIdentityId(user.getId());
        dto.setAccount(user.getAccount());
        dto.setStatus(award.getStatus());
        dto.setIsEquipped(award.getIsEquipped());
        dto.setReviewerId(award.getReviewerId());
        dto.setReviewNote(award.getReviewNote());
        dto.setGrantReason(award.getGrantReason());
        dto.setGrantedAt(award.getGrantedAt());
        dto.setRevokedBy(award.getRevokedBy());
        dto.setRevokedAt(award.getRevokedAt());
        dto.setCreatedAt(award.getCreatedAt());
        dto.setReviewedAt(award.getReviewedAt());
        return dto;
    }
}
