package com.cdmga.uestc.webpage.Service;

import com.cdmga.uestc.webpage.Entity.Identity;
import com.cdmga.uestc.webpage.Repository.IdentityRepository;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class DailyMemberService {
    private static final ZoneId BEIJING = ZoneId.of("Asia/Shanghai");

    @Autowired private IdentityRepository identityRepository;

    public Identity getDailyMember(Integer viewerId) {
        return pickMember(identityRepository.findByIsDeletedFalseOrderByIdAsc(), viewerId, LocalDate.now(BEIJING));
    }

    static Identity pickMember(List<Identity> allMembers, Integer viewerId, LocalDate date) {
        List<Identity> members = eligibleMembers(allMembers, viewerId);
        if (members.isEmpty()) return null;
        long seed = date.toEpochDay() ^ (viewerId.longValue() * 0x9E3779B97F4A7C15L);
        seed ^= seed >>> 33;
        seed *= 0xff51afd7ed558ccdL;
        seed ^= seed >>> 33;
        seed *= 0xc4ceb9fe1a85ec53L;
        seed ^= seed >>> 33;
        return members.get((int) Math.floorMod(seed, members.size()));
    }

    static List<Identity> eligibleMembers(List<Identity> members, Integer viewerId) {
        return members.stream().filter(member -> !member.getId().equals(viewerId)).toList();
    }
}
