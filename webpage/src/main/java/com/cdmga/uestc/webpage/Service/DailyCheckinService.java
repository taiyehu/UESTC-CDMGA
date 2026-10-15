package com.cdmga.uestc.webpage.Service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DailyCheckinService {
    private static final ZoneId BEIJING = ZoneId.of("Asia/Shanghai");
    private static final String[][] FORTUNES = {
        {"大吉", "今天适合大胆尝试新谱面，手感可能比想象中更好。", "挑战新曲", "忘记休息"},
        {"中吉", "稳稳地完成一首熟悉的歌，也会有新的收获。", "练习基础", "急于求成"},
        {"小吉", "一次小小的进步，值得为自己开心。", "和群友交流", "和别人比较"},
        {"吉", "灵感可能在不经意间出现，试试新的节奏。", "尝试新节奏", "熬夜"},
        {"平", "按自己的节奏来，今天也会是不错的一天。", "放松游玩", "给自己压力"},
        {"末吉", "先调整状态，再出发也不迟。", "适度休息", "连续硬打"}
    };

    @Autowired
    private JdbcTemplate jdbc;

    public Map<String, Object> today(Integer identityId) {
        LocalDate date = LocalDate.now(BEIJING);
        List<Map<String, Object>> rows = jdbc.queryForList(
            "SELECT fortune_level AS fortuneLevel, fortune_text AS fortuneText, fortune_payload AS fortunePayload, created_at AS createdAt FROM daily_checkin WHERE identity_id = ? AND checkin_date = ?",
            identityId, date);
        return rows.isEmpty() ? Map.of("date", date.toString(), "checkedIn", false) :
            Map.of("date", date.toString(), "checkedIn", true, "fortune", rows.get(0));
    }

    @Transactional
    public Map<String, Object> checkin(Integer identityId) {
        LocalDate date = LocalDate.now(BEIJING);
        String[] fortune = FORTUNES[ThreadLocalRandom.current().nextInt(FORTUNES.length)];
        jdbc.update("INSERT INTO daily_checkin (identity_id, checkin_date, fortune_level, fortune_text, fortune_payload) VALUES (?, ?, ?, ?, JSON_OBJECT('good', ?, 'avoid', ?)) ON DUPLICATE KEY UPDATE id = id",
            identityId, date, fortune[0], fortune[1], fortune[2], fortune[3]);
        return today(identityId);
    }
}
