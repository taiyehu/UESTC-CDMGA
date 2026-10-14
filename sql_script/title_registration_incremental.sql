-- 已创建称号表的数据库执行本脚本，为当前未注销用户补发初始称号。
-- 若尚未执行 title_incremental.sql，请先执行一次；本脚本可重复执行，不会重复发放。
ALTER TABLE `title_definition` DROP CHECK `ck_title_definition_source`;
ALTER TABLE `title_definition`
    ADD CONSTRAINT `ck_title_definition_source`
    CHECK (`source` IN ('user_application', 'admin_created', 'registration'));

INSERT INTO `title_definition` (`name`, `tier`, `source`, `acquisition_method`, `identity_id`)
SELECT '新人出道', 'normal', 'registration', '注册获得', i.`id`
FROM `identity` i
WHERE i.`is_deleted` = 0
  AND NOT EXISTS (
      SELECT 1 FROM `title_definition` d
      WHERE d.`identity_id` = i.`id` AND d.`source` = 'registration'
  );

INSERT INTO `title_award` (`title_id`, `identity_id`, `status`, `is_equipped`, `granted_at`)
SELECT d.`id`, d.`identity_id`, 'approved',
       CASE WHEN EXISTS (
           SELECT 1 FROM `title_award` equipped
           WHERE equipped.`identity_id` = d.`identity_id`
             AND equipped.`status` = 'approved'
             AND equipped.`is_equipped` = 1
       ) THEN 0 ELSE 1 END,
       NOW()
FROM `title_definition` d
JOIN `identity` i ON i.`id` = d.`identity_id`
WHERE i.`is_deleted` = 0
  AND d.`source` = 'registration'
  AND NOT EXISTS (
      SELECT 1 FROM `title_award` award
      WHERE award.`identity_id` = d.`identity_id` AND award.`title_id` = d.`id`
  );
