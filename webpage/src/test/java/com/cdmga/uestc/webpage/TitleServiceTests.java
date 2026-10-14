package com.cdmga.uestc.webpage;

import com.cdmga.uestc.webpage.Entity.Identity;
import com.cdmga.uestc.webpage.Entity.TitleAward;
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
                () -> service.createAndGrant(1, 2, "测试称号", "gold"));

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
}
