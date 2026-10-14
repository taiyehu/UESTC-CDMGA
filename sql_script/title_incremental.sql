-- 已执行过 title_create.sql 的数据库使用本脚本；全新数据库只需执行更新后的 title_create.sql。
ALTER TABLE `title_definition`
    ADD COLUMN `acquisition_method` VARCHAR(255) NULL COMMENT '获得方式，悬停称号时展示' AFTER `source`;

ALTER TABLE `title_award`
    ADD COLUMN `grant_reason` VARCHAR(255) NULL COMMENT '管理员发放原因' AFTER `review_note`,
    ADD COLUMN `granted_at` DATETIME NULL COMMENT '实际发放时间' AFTER `grant_reason`;

ALTER TABLE `title_award`
    ADD COLUMN `revoked_by` INT NULL COMMENT '撤销管理员ID' AFTER `granted_at`,
    ADD COLUMN `revoked_at` DATETIME NULL COMMENT '撤销时间' AFTER `revoked_by`,
    ADD CONSTRAINT `fk_title_award_revoker` FOREIGN KEY (`revoked_by`) REFERENCES `identity`(`id`);

UPDATE `title_award`
SET `granted_at` = COALESCE(`reviewed_at`, `created_at`)
WHERE `status` = 'approved' AND `granted_at` IS NULL;

ALTER TABLE `title_award` DROP CHECK `ck_title_award_status`;
ALTER TABLE `title_award`
    ADD CONSTRAINT `ck_title_award_status` CHECK (`status` IN ('pending', 'approved', 'rejected', 'revoked'));
