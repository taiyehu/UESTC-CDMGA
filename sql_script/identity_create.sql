CREATE TABLE `identity` (
                        `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '用户主键',
                        `name` VARCHAR(50) NOT NULL COMMENT '用户名',
                        `password` VARCHAR(100) NOT NULL COMMENT '密码',
                        `role` ENUM('admin', 'user') NOT NULL DEFAULT 'user' COMMENT '角色：管理员或普通用户',
                        `is_deleted` BOOLEAN NOT NULL DEFAULT FALSE COMMENT '逻辑删除标志（0=未删除，1=已删除）',
                        `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                        `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';
