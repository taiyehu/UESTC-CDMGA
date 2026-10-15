CREATE TABLE IF NOT EXISTS `forum_file` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `post_id` BIGINT NOT NULL,
    `storage_path` VARCHAR(255) NOT NULL,
    `original_name` VARCHAR(255) NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_forum_file_post` FOREIGN KEY (`post_id`) REFERENCES `forum_post` (`id`),
    INDEX `idx_forum_file_post` (`post_id`, `id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='论坛帖子附件';

CREATE TABLE IF NOT EXISTS `forum_edit_history` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `post_id` BIGINT NULL,
    `reply_id` BIGINT NULL,
    `editor_id` INT NOT NULL,
    `old_title` VARCHAR(120) NULL,
    `new_title` VARCHAR(120) NULL,
    `old_content` TEXT NOT NULL,
    `new_content` TEXT NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_forum_edit_post` FOREIGN KEY (`post_id`) REFERENCES `forum_post` (`id`),
    CONSTRAINT `fk_forum_edit_reply` FOREIGN KEY (`reply_id`) REFERENCES `forum_reply` (`id`),
    CONSTRAINT `fk_forum_edit_editor` FOREIGN KEY (`editor_id`) REFERENCES `identity` (`id`),
    CONSTRAINT `ck_forum_edit_target` CHECK ((`post_id` IS NULL) <> (`reply_id` IS NULL)),
    INDEX `idx_forum_edit_post` (`post_id`, `created_at`),
    INDEX `idx_forum_edit_reply` (`reply_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='论坛修改历史';
