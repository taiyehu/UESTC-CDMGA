CREATE TABLE IF NOT EXISTS `identity_session` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `identity_id` INT NOT NULL,
    `session_key_hash` CHAR(64) NOT NULL,
    `login_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `last_seen_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `expires_at` DATETIME NOT NULL,
    `logged_out_at` DATETIME NULL,
    CONSTRAINT `fk_identity_session_identity` FOREIGN KEY (`identity_id`) REFERENCES `identity` (`id`),
    UNIQUE KEY `uk_identity_session_key` (`session_key_hash`),
    INDEX `idx_identity_session_online` (`identity_id`, `logged_out_at`, `last_seen_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户登录会话状态';

CREATE TABLE IF NOT EXISTS `daily_checkin` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `identity_id` INT NOT NULL,
    `checkin_date` DATE NOT NULL COMMENT '北京时间日期',
    `fortune_level` VARCHAR(16) NOT NULL,
    `fortune_text` VARCHAR(255) NOT NULL,
    `fortune_payload` JSON NULL COMMENT '后续可扩展的运势内容',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_daily_checkin_identity` FOREIGN KEY (`identity_id`) REFERENCES `identity` (`id`),
    UNIQUE KEY `uk_daily_checkin_identity_date` (`identity_id`, `checkin_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='每日签到及运势';

CREATE TABLE IF NOT EXISTS `forum_post` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `author_id` INT NOT NULL,
    `title` VARCHAR(120) NOT NULL,
    `content` TEXT NOT NULL,
    `status` VARCHAR(16) NOT NULL DEFAULT 'visible',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` DATETIME NULL,
    CONSTRAINT `fk_forum_post_author` FOREIGN KEY (`author_id`) REFERENCES `identity` (`id`),
    CONSTRAINT `ck_forum_post_status` CHECK (`status` IN ('visible', 'hidden', 'deleted')),
    INDEX `idx_forum_post_list` (`status`, `created_at`, `id`),
    INDEX `idx_forum_post_author` (`author_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='论坛帖子';

CREATE TABLE IF NOT EXISTS `forum_reply` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `post_id` BIGINT NOT NULL,
    `parent_reply_id` BIGINT NULL,
    `author_id` INT NOT NULL,
    `content` TEXT NOT NULL,
    `status` VARCHAR(16) NOT NULL DEFAULT 'visible',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` DATETIME NULL,
    CONSTRAINT `fk_forum_reply_post` FOREIGN KEY (`post_id`) REFERENCES `forum_post` (`id`),
    CONSTRAINT `fk_forum_reply_parent` FOREIGN KEY (`parent_reply_id`) REFERENCES `forum_reply` (`id`),
    CONSTRAINT `fk_forum_reply_author` FOREIGN KEY (`author_id`) REFERENCES `identity` (`id`),
    CONSTRAINT `ck_forum_reply_status` CHECK (`status` IN ('visible', 'hidden', 'deleted')),
    INDEX `idx_forum_reply_post` (`post_id`, `status`, `created_at`),
    INDEX `idx_forum_reply_parent` (`parent_reply_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='论坛回复';

CREATE TABLE IF NOT EXISTS `forum_image` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `post_id` BIGINT NULL,
    `reply_id` BIGINT NULL,
    `storage_path` VARCHAR(255) NOT NULL,
    `sort_order` INT NOT NULL DEFAULT 0,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_forum_image_post` FOREIGN KEY (`post_id`) REFERENCES `forum_post` (`id`),
    CONSTRAINT `fk_forum_image_reply` FOREIGN KEY (`reply_id`) REFERENCES `forum_reply` (`id`),
    CONSTRAINT `ck_forum_image_target` CHECK ((`post_id` IS NULL) <> (`reply_id` IS NULL)),
    UNIQUE KEY `uk_forum_image_reply` (`reply_id`),
    INDEX `idx_forum_image_post` (`post_id`, `sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='论坛图片';

CREATE TABLE IF NOT EXISTS `forum_post_like` (
    `post_id` BIGINT NOT NULL,
    `identity_id` INT NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`post_id`, `identity_id`),
    CONSTRAINT `fk_forum_post_like_post` FOREIGN KEY (`post_id`) REFERENCES `forum_post` (`id`),
    CONSTRAINT `fk_forum_post_like_identity` FOREIGN KEY (`identity_id`) REFERENCES `identity` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='帖子点赞';

CREATE TABLE IF NOT EXISTS `forum_reply_like` (
    `reply_id` BIGINT NOT NULL,
    `identity_id` INT NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`reply_id`, `identity_id`),
    CONSTRAINT `fk_forum_reply_like_reply` FOREIGN KEY (`reply_id`) REFERENCES `forum_reply` (`id`),
    CONSTRAINT `fk_forum_reply_like_identity` FOREIGN KEY (`identity_id`) REFERENCES `identity` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='回复点赞';

CREATE TABLE IF NOT EXISTS `forum_report` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `post_id` BIGINT NULL,
    `reply_id` BIGINT NULL,
    `reporter_id` INT NOT NULL,
    `reason` VARCHAR(100) NOT NULL,
    `detail` VARCHAR(500) NULL,
    `status` VARCHAR(16) NOT NULL DEFAULT 'pending',
    `handled_by` INT NULL,
    `handled_at` DATETIME NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_forum_report_post` FOREIGN KEY (`post_id`) REFERENCES `forum_post` (`id`),
    CONSTRAINT `fk_forum_report_reply` FOREIGN KEY (`reply_id`) REFERENCES `forum_reply` (`id`),
    CONSTRAINT `fk_forum_report_reporter` FOREIGN KEY (`reporter_id`) REFERENCES `identity` (`id`),
    CONSTRAINT `fk_forum_report_handler` FOREIGN KEY (`handled_by`) REFERENCES `identity` (`id`),
    CONSTRAINT `ck_forum_report_target` CHECK ((`post_id` IS NULL) <> (`reply_id` IS NULL)),
    CONSTRAINT `ck_forum_report_status` CHECK (`status` IN ('pending', 'retained', 'deleted')),
    UNIQUE KEY `uk_forum_report_post_user` (`post_id`, `reporter_id`),
    UNIQUE KEY `uk_forum_report_reply_user` (`reply_id`, `reporter_id`),
    INDEX `idx_forum_report_pending` (`status`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='论坛举报';

CREATE TABLE IF NOT EXISTS `forum_moderation_action` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `post_id` BIGINT NULL,
    `reply_id` BIGINT NULL,
    `operator_id` INT NULL COMMENT '自动隐藏时为空',
    `action` VARCHAR(24) NOT NULL,
    `reason` VARCHAR(500) NULL,
    `previous_status` VARCHAR(16) NOT NULL,
    `new_status` VARCHAR(16) NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_forum_moderation_post` FOREIGN KEY (`post_id`) REFERENCES `forum_post` (`id`),
    CONSTRAINT `fk_forum_moderation_reply` FOREIGN KEY (`reply_id`) REFERENCES `forum_reply` (`id`),
    CONSTRAINT `fk_forum_moderation_operator` FOREIGN KEY (`operator_id`) REFERENCES `identity` (`id`),
    CONSTRAINT `ck_forum_moderation_target` CHECK ((`post_id` IS NULL) <> (`reply_id` IS NULL)),
    INDEX `idx_forum_moderation_post` (`post_id`, `created_at`),
    INDEX `idx_forum_moderation_reply` (`reply_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='论坛管理操作记录';
