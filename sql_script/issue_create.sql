CREATE TABLE `issue` (
  `uid` INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键',
  `course_id` INT NOT NULL COMMENT '所属课题ID',
  `issue_id` INT NOT NULL COMMENT '子题ID(typical:1-6, bingo:1-25)',
  `image` VARCHAR(255) DEFAULT NULL COMMENT '图片URL',
  `text` TEXT DEFAULT NULL COMMENT '文本描述',
  `file` VARCHAR(255) DEFAULT NULL COMMENT '文件URL',
  `song_name` VARCHAR(255) DEFAULT NULL COMMENT 'typical子题名称',
  CONSTRAINT `fk_issue_course` FOREIGN KEY (`course_id`) REFERENCES `course`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_issue_course_issue` (`course_id`, `issue_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='课题issue配置表';
