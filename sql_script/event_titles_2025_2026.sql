-- 适用于 MySQL 8.0；称号表须为当前结构（含 acquisition_method、grant_reason、granted_at 等字段）。
-- 活动和课题 ID 依据现有数据：Arcaea 皇牌空战 activity.id=8，预选课题 68/69/70；三月 Bingo course.id=83。
-- 可重复执行：同一用户、同一定义不会重复发放；已撤销的获得记录不会被重新激活。
-- 使用 ID 最小的未注销管理员作为称号创建者和发放审核者，发放后不自动佩戴。

DELIMITER $$

DROP PROCEDURE IF EXISTS `grant_event_titles_2025_2026`$$
CREATE PROCEDURE `grant_event_titles_2025_2026`()
BEGIN
    DECLARE v_admin_id INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        DROP TEMPORARY TABLE IF EXISTS `tmp_title_recipients`;
        DROP TEMPORARY TABLE IF EXISTS `tmp_title_specs`;
        DROP TEMPORARY TABLE IF EXISTS `tmp_contest_scores`;
        DROP TEMPORARY TABLE IF EXISTS `tmp_contest_rank`;
        DROP TEMPORARY TABLE IF EXISTS `tmp_bingo_best`;
        DROP TEMPORARY TABLE IF EXISTS `tmp_bingo_lines`;
        DROP TEMPORARY TABLE IF EXISTS `tmp_bingo_completed_lines`;
        DROP TEMPORARY TABLE IF EXISTS `tmp_bingo_line_issues`;
        DROP TEMPORARY TABLE IF EXISTS `tmp_bingo_totals`;
        DROP TEMPORARY TABLE IF EXISTS `tmp_bingo_rank`;
        DROP TEMPORARY TABLE IF EXISTS `tmp_title_ids`;
        RESIGNAL;
    END;

    SELECT MIN(`id`) INTO v_admin_id
    FROM `identity`
    WHERE `role` = 'admin' AND `is_deleted` = 0;
    IF v_admin_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '找不到未注销的管理员，已取消发放';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM `activity` WHERE `id` = 8 AND `name` LIKE '%Arcaea%' AND `is_deleted` = 0)
       OR (SELECT COUNT(*) FROM `activity_course_assoc` WHERE `activity_id` = 8) <> 3
       OR (SELECT COUNT(DISTINCT `course_id`) FROM `activity_course_assoc` WHERE `activity_id` = 8 AND `course_id` IN (68, 69, 70)) <> 3
       OR (SELECT COUNT(*) FROM `course` WHERE `id` IN (68, 69, 70) AND `category` = 'contest' AND `is_deleted` = 0) <> 3 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '皇牌空战活动及三门预选课题不匹配，已取消发放';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM `course` WHERE `id` = 83 AND `title` = '音游社3月Bingo活动' AND `category` = 'bingo' AND `is_deleted` = 0) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '三月 Bingo 课题不匹配，已取消发放';
    END IF;

    START TRANSACTION;

    CREATE TEMPORARY TABLE `tmp_title_specs` (
        `code` VARCHAR(32) PRIMARY KEY,
        `name` VARCHAR(32) NOT NULL,
        `tier` VARCHAR(16) NOT NULL,
        `acquisition_method` VARCHAR(255) NOT NULL
    );
    INSERT INTO `tmp_title_specs` VALUES
        ('arcaea_participant', '见习飞行员', 'silver', '2025.11 皇牌空战Arcaea团队赛预选 参与'),
        ('arcaea_top3', '皇家飞行员', 'gold', '2025.11 皇牌空战Arcaea团队赛预选 前三名'),
        ('arcaea_top10', '皇家飞行员', 'silver', '2025.11 皇牌空战Arcaea团队赛预选 前十名'),
        ('bingo_participant', '宾果爱好者', 'silver', '2026.3 音游社3月bingo活动 参与'),
        ('bingo_top3', '宾果大神', 'gold', '2026.3 音游社3月bingo活动 前三名'),
        ('bingo_winner', '宾果大神', 'color', '2026.3 音游社3月bingo活动 优胜');

    -- 比赛榜：沿用 RankService 的每条有效成绩加计分修正值后，按用户求和。
    CREATE TEMPORARY TABLE `tmp_contest_scores` AS
    SELECT s.`identity_id`, SUM(s.`score` + COALESCE(rc.`counting_rules`, 0)) AS `total_score`
    FROM `score` s
    JOIN `activity_course_assoc` aca ON aca.`course_id` = s.`course_id` AND aca.`activity_id` = 8
    JOIN `course` c ON c.`id` = s.`course_id` AND c.`category` = 'contest' AND c.`is_deleted` = 0
    LEFT JOIN `rank_config` rc ON rc.`course_id` = s.`course_id` AND rc.`is_deleted` = 0
    WHERE s.`is_scored` = 1 AND s.`is_deleted` = 0
    GROUP BY s.`identity_id`;
    CREATE TEMPORARY TABLE `tmp_contest_rank` AS
    SELECT `identity_id`, `total_score`, RANK() OVER (ORDER BY `total_score` DESC) AS `place`
    FROM `tmp_contest_scores`;
    IF (SELECT COUNT(*) FROM `tmp_contest_rank`) = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '皇牌空战没有有效成绩，已取消发放';
    END IF;

    -- Bingo 榜：每队每题取最高有效正分；完成的行、列、对角线所含题目各加分一次。
    CREATE TEMPORARY TABLE `tmp_bingo_best` AS
    SELECT t.`team_id`, s.`issue_id`, MAX(s.`score`) AS `best_score`
    FROM `team` t
    JOIN `score` s ON s.`identity_id` = t.`identity_id` AND s.`course_id` = t.`course_id`
    WHERE t.`course_id` = 83 AND t.`team_id` IS NOT NULL
      AND s.`is_scored` = 1 AND s.`is_deleted` = 0
      AND s.`issue_id` BETWEEN 1 AND 25 AND s.`score` > 0
    GROUP BY t.`team_id`, s.`issue_id`;
    IF (SELECT COUNT(*) FROM `tmp_bingo_best`) = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '三月 Bingo 没有有效成绩，已取消发放';
    END IF;

    CREATE TEMPORARY TABLE `tmp_bingo_lines` (
        `line_id` INT PRIMARY KEY, `i1` INT, `i2` INT, `i3` INT, `i4` INT, `i5` INT
    );
    INSERT INTO `tmp_bingo_lines` VALUES
        (1, 1, 2, 3, 4, 5), (2, 6, 7, 8, 9, 10), (3, 11, 12, 13, 14, 15),
        (4, 16, 17, 18, 19, 20), (5, 21, 22, 23, 24, 25),
        (6, 1, 6, 11, 16, 21), (7, 2, 7, 12, 17, 22), (8, 3, 8, 13, 18, 23),
        (9, 4, 9, 14, 19, 24), (10, 5, 10, 15, 20, 25),
        (11, 1, 7, 13, 19, 25), (12, 5, 9, 13, 17, 21);
    CREATE TEMPORARY TABLE `tmp_bingo_completed_lines` AS
    SELECT b.`team_id`, l.`line_id`
    FROM `tmp_bingo_best` b
    JOIN `tmp_bingo_lines` l ON b.`issue_id` IN (l.`i1`, l.`i2`, l.`i3`, l.`i4`, l.`i5`)
    GROUP BY b.`team_id`, l.`line_id`
    HAVING COUNT(DISTINCT b.`issue_id`) = 5;
    CREATE TEMPORARY TABLE `tmp_bingo_line_issues` AS
    SELECT DISTINCT cl.`team_id`, b.`issue_id`
    FROM `tmp_bingo_completed_lines` cl
    JOIN `tmp_bingo_lines` l ON l.`line_id` = cl.`line_id`
    JOIN `tmp_bingo_best` b ON b.`team_id` = cl.`team_id`
        AND b.`issue_id` IN (l.`i1`, l.`i2`, l.`i3`, l.`i4`, l.`i5`);
    CREATE TEMPORARY TABLE `tmp_bingo_totals` AS
    SELECT t.`team_id`,
           COALESCE(SUM(b.`best_score`), 0)
           + COALESCE(SUM(CASE WHEN li.`issue_id` IS NULL THEN 0 ELSE b.`best_score` END), 0) AS `total_score`
    FROM (SELECT DISTINCT `team_id` FROM `team` WHERE `course_id` = 83 AND `team_id` IS NOT NULL) t
    LEFT JOIN `tmp_bingo_best` b ON b.`team_id` = t.`team_id`
    LEFT JOIN `tmp_bingo_line_issues` li ON li.`team_id` = b.`team_id` AND li.`issue_id` = b.`issue_id`
    GROUP BY t.`team_id`;
    CREATE TEMPORARY TABLE `tmp_bingo_rank` AS
    SELECT `team_id`, `total_score`, RANK() OVER (ORDER BY `total_score` DESC) AS `place`
    FROM `tmp_bingo_totals`;
    IF (SELECT COUNT(*) FROM `tmp_bingo_rank`) = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '三月 Bingo 没有参赛队伍，已取消发放';
    END IF;

    CREATE TEMPORARY TABLE `tmp_title_recipients` (
        `code` VARCHAR(32) NOT NULL,
        `identity_id` INT NOT NULL,
        PRIMARY KEY (`code`, `identity_id`)
    );
    -- 参与奖只统计至少有一条已审核、未删除成绩的用户。
    INSERT INTO `tmp_title_recipients`
    SELECT DISTINCT 'arcaea_participant', s.`identity_id`
    FROM `score` s
    JOIN `activity_course_assoc` aca ON aca.`course_id` = s.`course_id` AND aca.`activity_id` = 8
    JOIN `identity` i ON i.`id` = s.`identity_id` AND i.`is_deleted` = 0
    WHERE s.`is_scored` = 1 AND s.`is_deleted` = 0;
    INSERT INTO `tmp_title_recipients`
    SELECT 'arcaea_top3', r.`identity_id`
    FROM `tmp_contest_rank` r JOIN `identity` i ON i.`id` = r.`identity_id` AND i.`is_deleted` = 0
    WHERE r.`place` <= 3;
    INSERT INTO `tmp_title_recipients`
    SELECT 'arcaea_top10', r.`identity_id`
    FROM `tmp_contest_rank` r JOIN `identity` i ON i.`id` = r.`identity_id` AND i.`is_deleted` = 0
    WHERE r.`place` <= 10;
    INSERT INTO `tmp_title_recipients`
    SELECT DISTINCT 'bingo_participant', t.`identity_id`
    FROM `team` t JOIN `identity` i ON i.`id` = t.`identity_id` AND i.`is_deleted` = 0
    WHERE t.`course_id` = 83 AND t.`team_id` IS NOT NULL;
    INSERT INTO `tmp_title_recipients`
    SELECT DISTINCT 'bingo_top3', t.`identity_id`
    FROM `team` t JOIN `tmp_bingo_rank` r ON r.`team_id` = t.`team_id`
    JOIN `identity` i ON i.`id` = t.`identity_id` AND i.`is_deleted` = 0
    WHERE t.`course_id` = 83 AND r.`place` <= 3;
    INSERT INTO `tmp_title_recipients`
    SELECT DISTINCT 'bingo_winner', t.`identity_id`
    FROM `team` t JOIN `tmp_bingo_rank` r ON r.`team_id` = t.`team_id`
    JOIN `identity` i ON i.`id` = t.`identity_id` AND i.`is_deleted` = 0
    WHERE t.`course_id` = 83 AND r.`place` = 1;

    INSERT INTO `title_definition` (`name`, `tier`, `source`, `acquisition_method`, `identity_id`)
    SELECT s.`name`, s.`tier`, 'admin_created', s.`acquisition_method`, v_admin_id
    FROM `tmp_title_specs` s
    WHERE NOT EXISTS (
        SELECT 1 FROM `title_definition` d
        WHERE d.`name` = s.`name` AND d.`tier` = s.`tier`
          AND d.`source` = 'admin_created' AND d.`acquisition_method` = s.`acquisition_method`
    );
    CREATE TEMPORARY TABLE `tmp_title_ids` AS
    SELECT s.`code`, MIN(d.`id`) AS `title_id`
    FROM `tmp_title_specs` s
    JOIN `title_definition` d ON d.`name` = s.`name` AND d.`tier` = s.`tier`
        AND d.`source` = 'admin_created' AND d.`acquisition_method` = s.`acquisition_method`
    GROUP BY s.`code`;

    INSERT INTO `title_award`
        (`title_id`, `identity_id`, `status`, `is_equipped`, `reviewer_id`, `reviewed_at`, `grant_reason`, `granted_at`)
    SELECT ti.`title_id`, r.`identity_id`, 'approved', 0, v_admin_id, NOW(), s.`acquisition_method`, NOW()
    FROM `tmp_title_recipients` r
    JOIN `tmp_title_ids` ti ON ti.`code` = r.`code`
    JOIN `tmp_title_specs` s ON s.`code` = r.`code`
    WHERE NOT EXISTS (
        SELECT 1 FROM `title_award` a
        WHERE a.`title_id` = ti.`title_id` AND a.`identity_id` = r.`identity_id`
    );

    COMMIT;

    SELECT s.`name`, s.`tier`, s.`acquisition_method`, COUNT(r.`identity_id`) AS `eligible_users`,
           COUNT(a.`id`) AS `award_records`
    FROM `tmp_title_specs` s
    LEFT JOIN `tmp_title_recipients` r ON r.`code` = s.`code`
    LEFT JOIN `tmp_title_ids` ti ON ti.`code` = s.`code`
    LEFT JOIN `title_award` a ON a.`title_id` = ti.`title_id` AND a.`identity_id` = r.`identity_id`
    GROUP BY s.`code`, s.`name`, s.`tier`, s.`acquisition_method`
    ORDER BY s.`code`;

    DROP TEMPORARY TABLE `tmp_title_recipients`, `tmp_title_specs`, `tmp_contest_scores`,
        `tmp_contest_rank`, `tmp_bingo_best`, `tmp_bingo_lines`, `tmp_bingo_completed_lines`,
        `tmp_bingo_line_issues`, `tmp_bingo_totals`, `tmp_bingo_rank`, `tmp_title_ids`;
END$$

CALL `grant_event_titles_2025_2026`()$$
DROP PROCEDURE `grant_event_titles_2025_2026`$$

DELIMITER ;
