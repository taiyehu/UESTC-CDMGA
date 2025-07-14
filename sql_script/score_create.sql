CREATE TABLE `score` (
                         `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '成绩记录主键',
                         `course_id` INT NOT NULL COMMENT '所属课题ID',
                         `identity_id` INT NOT NULL COMMENT '所属用户ID',
                         `upload_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
                         `image` VARCHAR(255) NOT NULL COMMENT '成绩图路径',
                         `score` FLOAT NOT NULL DEFAULT 0 COMMENT '成绩得分',
                         `is_scored` BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否已评分（0=未评分，1=已评分）',
                         `remark` TEXT DEFAULT NULL COMMENT '备注信息（可选）',
                         `is_deleted` BOOLEAN NOT NULL DEFAULT FALSE COMMENT '逻辑删除标志（0=未删除，1=已删除）',
                         `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                         `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    -- 外键约束
                         CONSTRAINT `fk_score_identity` FOREIGN KEY (`identity_id`) REFERENCES `identity`(`id`) ON DELETE CASCADE,
                         CONSTRAINT `fk_score_course` FOREIGN KEY (`course_id`) REFERENCES `course`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='成绩表';
