package com.cdmga.uestc.webpage.Service;

import com.cdmga.uestc.webpage.Entity.Identity;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DailyMemberServiceTests {
    @Test
    void excludesTheViewerFromTheDailyMemberPool() {
        List<Identity> candidates = DailyMemberService.eligibleMembers(
            List.of(identity(2), identity(7), identity(9)), 2);
        assertEquals(List.of(7, 9), candidates.stream().map(Identity::getId).toList());
    }

    @Test
    void returnsNoCandidateWhenOnlyTheViewerExists() {
        assertTrue(DailyMemberService.eligibleMembers(List.of(identity(2)), 2).isEmpty());
    }

    @Test
    void sameViewerAndDateAlwaysGetTheSameOtherMember() {
        List<Identity> members = List.of(identity(2), identity(7), identity(9), identity(11));
        LocalDate date = LocalDate.of(2026, 10, 16);
        Identity selected = DailyMemberService.pickMember(members, 2, date);
        assertEquals(selected.getId(), DailyMemberService.pickMember(members, 2, date).getId());
        assertTrue(selected.getId() != 2);
    }

    private static Identity identity(int id) {
        Identity identity = new Identity();
        identity.setId(id);
        return identity;
    }
}
