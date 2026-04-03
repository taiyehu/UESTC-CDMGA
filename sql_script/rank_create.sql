CREATE TABLE `rank_config` (
    `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '排行榜配置主键',
    `course_id` INT NOT NULL COMMENT '课题ID（一个课题一条配置）',
    `counting_rules` FLOAT NOT NULL DEFAULT 0 COMMENT '计分修正值（带符号浮点数，显示分=score+counting_rules）',
    `is_deleted` BOOLEAN NOT NULL DEFAULT FALSE COMMENT '逻辑删除标志（0=未删除，1=已删除）',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    CONSTRAINT `uk_rank_config_course` UNIQUE (`course_id`),
    CONSTRAINT `fk_rank_config_course` FOREIGN KEY (`course_id`) REFERENCES `course`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='排行榜配置表';
