SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1) 删除旧的唯一约束：同一 course + issue 仅一条提示（旧逻辑）
SET @drop_unique_sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = 'bingo_tips'
        AND index_name = 'uk_bingo_tip_course_issue'
        AND non_unique = 0
    ),
    'ALTER TABLE `bingo_tips` DROP INDEX `uk_bingo_tip_course_issue`',
    'SELECT 1'
  )
);
PREPARE stmt_drop_unique FROM @drop_unique_sql;
EXECUTE stmt_drop_unique;
DEALLOCATE PREPARE stmt_drop_unique;

-- 2) 补齐新结构字段（若已存在则跳过）
SET @add_created_at_sql = (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'bingo_tips'
        AND column_name = 'created_at'
    ),
    'SELECT 1',
    'ALTER TABLE `bingo_tips` ADD COLUMN `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP'
  )
);
PREPARE stmt_add_created_at FROM @add_created_at_sql;
EXECUTE stmt_add_created_at;
DEALLOCATE PREPARE stmt_add_created_at;

SET @add_team_id_sql = (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'bingo_tips'
        AND column_name = 'team_id'
    ),
    'SELECT 1',
    'ALTER TABLE `bingo_tips` ADD COLUMN `team_id` int NOT NULL DEFAULT 1'
  )
);
PREPARE stmt_add_team_id FROM @add_team_id_sql;
EXECUTE stmt_add_team_id;
DEALLOCATE PREPARE stmt_add_team_id;

-- 3) 添加时间顺序查询索引（若已存在则跳过）
SET @add_timeline_idx_sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = 'bingo_tips'
        AND index_name = 'idx_bingo_tip_course_issue_created'
    ),
    'SELECT 1',
    'ALTER TABLE `bingo_tips` ADD INDEX `idx_bingo_tip_course_issue_created`(`course_id`, `issue_id`, `created_at`, `id`)'
  )
);
PREPARE stmt_add_timeline_idx FROM @add_timeline_idx_sql;
EXECUTE stmt_add_timeline_idx;
DEALLOCATE PREPARE stmt_add_timeline_idx;

-- 4) 添加 team 外键（若已存在则跳过）
SET @add_team_fk_sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.table_constraints
      WHERE table_schema = DATABASE()
        AND table_name = 'bingo_tips'
        AND constraint_name = 'team_tip'
        AND constraint_type = 'FOREIGN KEY'
    ),
    'SELECT 1',
    'ALTER TABLE `bingo_tips` ADD CONSTRAINT `team_tip` FOREIGN KEY (`team_id`) REFERENCES `team` (`team_id`) ON DELETE CASCADE ON UPDATE CASCADE'
  )
);
PREPARE stmt_add_team_fk FROM @add_team_fk_sql;
EXECUTE stmt_add_team_fk;
DEALLOCATE PREPARE stmt_add_team_fk;

SET FOREIGN_KEY_CHECKS = 1;
