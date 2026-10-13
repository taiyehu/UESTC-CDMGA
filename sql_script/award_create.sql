CREATE TABLE IF NOT EXISTS `award` (
  `course_id` INT NOT NULL COMMENT '奖品对应的课题ID',
  `cost` INT NOT NULL COMMENT '兑换所需积分',
  `total_stock` INT NOT NULL DEFAULT 1 COMMENT '总库存；当前每个课题固定为1',
  `remaining_stock` INT NOT NULL DEFAULT 1 COMMENT '剩余库存',
  `sold_out_at` DATETIME DEFAULT NULL COMMENT '售罄时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`course_id`),
  CONSTRAINT `fk_award_course` FOREIGN KEY (`course_id`) REFERENCES `course` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ck_award_cost_positive` CHECK (`cost` > 0),
  CONSTRAINT `ck_award_stock_range` CHECK (`total_stock` = 1 AND `remaining_stock` BETWEEN 0 AND 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='奖品配置表';

-- 兼容升级前已经存在的一、二、三等奖课题；新奖品请在后台填写实际名称和价格。
INSERT INTO `award` (`course_id`, `cost`, `total_stock`, `remaining_stock`, `sold_out_at`, `created_at`, `updated_at`)
SELECT
  c.`id`,
  CASE TRIM(c.`title`)
    WHEN '一等奖' THEN 40
    WHEN '二等奖' THEN 20
    WHEN '三等奖' THEN 10
  END,
  1,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM `score` s
      WHERE s.`course_id` = c.`id`
        AND s.`is_scored` = TRUE
        AND s.`is_deleted` = FALSE
        AND s.`score` < 0
    ) THEN 0
    ELSE 1
  END,
  (
    SELECT MAX(s.`updated_at`)
    FROM `score` s
    WHERE s.`course_id` = c.`id`
      AND s.`is_scored` = TRUE
      AND s.`is_deleted` = FALSE
      AND s.`score` < 0
  ),
  COALESCE(c.`created_at`, CURRENT_TIMESTAMP),
  COALESCE(c.`updated_at`, CURRENT_TIMESTAMP)
FROM `course` c
WHERE LOWER(TRIM(c.`category`)) = 'award'
  AND TRIM(c.`title`) IN ('一等奖', '二等奖', '三等奖')
ON DUPLICATE KEY UPDATE `course_id` = VALUES(`course_id`);
