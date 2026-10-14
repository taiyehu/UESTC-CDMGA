package com.cdmga.uestc.webpage;

import com.cdmga.uestc.webpage.Entity.Identity;
import com.cdmga.uestc.webpage.Entity.TitleAward;
import com.cdmga.uestc.webpage.Entity.TitleDefinition;
import com.cdmga.uestc.webpage.Repository.IdentityRepository;
import com.cdmga.uestc.webpage.Repository.TitleAwardRepository;
import com.cdmga.uestc.webpage.Repository.TitleDefinitionRepository;
import com.cdmga.uestc.webpage.Service.TitleService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

public class TitleServiceTests {
    private TitleService service;
    private IdentityRepository identityRepository;
    private TitleDefinitionRepository titleDefinitionRepository;
    private TitleAwardRepository titleAwardRepository;

    @BeforeEach
    void setUp() {
        service = new TitleService();
        identityRepository = mock(IdentityRepository.class);
        titleDefinitionRepository = mock(TitleDefinitionRepository.class);
        titleAwardRepository = mock(TitleAwardRepository.class);
        ReflectionTestUtils.setField(service, "identityRepository", identityRepository);
        ReflectionTestUtils.setField(service, "titleDefinitionRepository", titleDefinitionRepository);
        ReflectionTestUtils.setField(service, "titleAwardRepository", titleAwardRepository);
    }

    @Test
    void userCannotCreateAndGrantTitle() {
        Identity user = new Identity();
        user.setId(1);
        user.setRole("user");
        when(identityRepository.findById(1)).thenReturn(Optional.of(user));

        IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
                () -> service.createAndGrant(1, 2, "测试称号", "gold", null, null));

        assertEquals("需要管理员权限", error.getMessage());
        verifyNoInteractions(titleDefinitionRepository, titleAwardRepository);
    }

    @Test
    void userCannotEquipAnotherUsersTitle() {
        Identity user = new Identity();
        user.setId(1);
        when(identityRepository.findById(1)).thenReturn(Optional.of(user));
        TitleAward award = new TitleAward();
        award.setId(10);
        award.setIdentityId(2);
        award.setStatus("approved");
        when(titleAwardRepository.findById(10)).thenReturn(Optional.of(award));

        IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
                () -> service.equip(1, 10));

        assertEquals("只能佩戴自己已通过的称号", error.getMessage());
    }

    @Test
    void revokedTitleIsNoLongerEquipped() {
        Identity admin = new Identity();
        admin.setId(1);
        admin.setRole("admin");
        Identity recipient = new Identity();
        recipient.setId(2);
        recipient.setAccount("群友");
        when(identityRepository.findById(1)).thenReturn(Optional.of(admin));
        when(identityRepository.findById(2)).thenReturn(Optional.of(recipient));
        TitleAward award = new TitleAward();
        award.setId(10);
        award.setTitleId(20);
        award.setIdentityId(2);
        award.setStatus("approved");
        award.setIsEquipped(true);
        when(titleAwardRepository.findById(10)).thenReturn(Optional.of(award));
        when(titleAwardRepository.save(award)).thenReturn(award);
        TitleDefinition title = new TitleDefinition();
        title.setId(20);
        title.setName("测试称号");
        when(titleDefinitionRepository.findById(20)).thenReturn(Optional.of(title));

        service.revoke(1, 10);

        assertEquals("revoked", award.getStatus());
        assertFalse(award.getIsEquipped());
    }
}
