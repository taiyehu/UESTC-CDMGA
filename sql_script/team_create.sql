CREATE TABLE `team` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键',
  `course_id` INT NOT NULL COMMENT '所属课题ID',
  `team_id` INT NOT NULL COMMENT '队伍编号',
  `identity_id` INT NOT NULL COMMENT '成员用户ID',
  `is_touched` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '后续使用标记，默认0',
  CONSTRAINT `fk_team_course` FOREIGN KEY (`course_id`) REFERENCES `course`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_team_identity` FOREIGN KEY (`identity_id`) REFERENCES `identity`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_team_course_identity` (`course_id`, `identity_id`),
  KEY `idx_team_course_team` (`course_id`, `team_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='bingo课题队伍管理表';
