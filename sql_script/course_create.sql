CREATE TABLE `course` (
                        `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '课题主键',
                        `title` VARCHAR(100) NOT NULL COMMENT '课题名称',
                        `category` VARCHAR(50) DEFAULT NULL COMMENT '课题类别',
                        `start_time` DATETIME NOT NULL COMMENT '开始时间',
                        `end_time` DATETIME NOT NULL COMMENT '结束时间',
                        `description` TEXT DEFAULT NULL COMMENT '课题描述',
                        `image` VARCHAR(255) DEFAULT NULL COMMENT '课题配图路径',
                        `is_deleted` BOOLEAN NOT NULL DEFAULT FALSE COMMENT '逻辑删除标志（0=未删除，1=已删除）',
                        `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                        `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='课题表';
