-- 把现有“音游社3月Bingo活动”课题挂到同名活动下；不修改课题或已有关联。
-- 可重复执行。若匹配到多个课题或活动，主动报错，避免误关联。
DELIMITER $$

DROP PROCEDURE IF EXISTS link_march_bingo_activity$$
CREATE PROCEDURE link_march_bingo_activity()
BEGIN
    DECLARE v_course_count INT DEFAULT 0;
    DECLARE v_activity_count INT DEFAULT 0;
    DECLARE v_course_id INT;
    DECLARE v_activity_id INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    SELECT COUNT(*), MIN(id) INTO v_course_count, v_course_id
    FROM course
    WHERE LOWER(TRIM(title)) = LOWER('音游社3月bingo活动') AND is_deleted = 0;
    IF v_course_count <> 1 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '需要且只能有一个未删除的音游社3月Bingo活动课题';
    END IF;

    SELECT COUNT(*), MIN(id) INTO v_activity_count, v_activity_id
    FROM activity
    WHERE LOWER(TRIM(name)) = LOWER('音游社3月bingo活动') AND is_deleted = 0;
    IF v_activity_count > 1 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '存在多个同名活动，无法确定关联目标';
    END IF;

    IF v_activity_count = 0 THEN
        INSERT INTO activity
            (name, activity_banner, activity_file, description,
             start_time, end_time, is_deleted, created_at, updated_at)
        SELECT '音游社3月bingo活动', COALESCE(image, ''), '',
               '音游社3月Bingo活动，完整玩法和提交要求请进入关联课题查看。',
               start_time, end_time, 0, NOW(), NOW()
        FROM course WHERE id = v_course_id;
        SET v_activity_id = LAST_INSERT_ID();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM activity_course_assoc
        WHERE activity_id = v_activity_id AND course_id = v_course_id
    ) THEN
        INSERT INTO activity_course_assoc (activity_id, course_id, rule)
        VALUES (v_activity_id, v_course_id, 'Bingo 玩法与提交规则见关联课题页面');
    END IF;

    COMMIT;
END$$

DELIMITER ;
CALL link_march_bingo_activity();
DROP PROCEDURE link_march_bingo_activity;
