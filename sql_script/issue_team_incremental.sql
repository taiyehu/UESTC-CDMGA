/*
 Incremental migration for existing CDMGA schema.
 - Normalize issue foreign key name to issue_course.
 - Align team table defaults/constraints for current backend logic.
 - No DROP TABLE operations.
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

SET @db = DATABASE();

/* ---------- issue: normalize fk name on course_id ---------- */
SELECT CONSTRAINT_NAME INTO @issue_fk_name
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = @db
  AND TABLE_NAME = 'issue'
  AND COLUMN_NAME = 'course_id'
  AND REFERENCED_TABLE_NAME = 'course'
LIMIT 1;

SET @sql = IF(
  @issue_fk_name IS NULL,
  'SELECT 1',
  CONCAT('ALTER TABLE `issue` DROP FOREIGN KEY `', @issue_fk_name, '`')
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE `issue`
  ADD CONSTRAINT `issue_course`
  FOREIGN KEY (`course_id`) REFERENCES `course` (`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

/* ---------- issue: optional column name normalization Image -> image ---------- */
SELECT COUNT(*) INTO @has_upper_image
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'issue' AND COLUMN_NAME = 'Image';

SET @sql = IF(
  @has_upper_image > 0,
  'ALTER TABLE `issue` CHANGE COLUMN `Image` `image` VARCHAR(255) NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

/* ---------- team: make id auto increment and defaults consistent ---------- */
ALTER TABLE `team`
  MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT,
  MODIFY COLUMN `course_id` INT NOT NULL,
  MODIFY COLUMN `team_id` INT NULL DEFAULT NULL,
  MODIFY COLUMN `identity_id` INT NOT NULL,
  MODIFY COLUMN `is_touched` TINYINT NOT NULL DEFAULT 0;

/* unique constraint for one member in one course only */
SELECT COUNT(*) INTO @has_uk_team_course_identity
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = @db
  AND TABLE_NAME = 'team'
  AND INDEX_NAME = 'uk_team_course_identity';

SET @sql = IF(
  @has_uk_team_course_identity > 0,
  'SELECT 1',
  'ALTER TABLE `team` ADD UNIQUE KEY `uk_team_course_identity` (`course_id`, `identity_id`)'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

/* index for team paging by course/team_id */
SELECT COUNT(*) INTO @has_idx_team_course_team
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = @db
  AND TABLE_NAME = 'team'
  AND INDEX_NAME = 'idx_team_course_team';

SET @sql = IF(
  @has_idx_team_course_team > 0,
  'SELECT 1',
  'ALTER TABLE `team` ADD KEY `idx_team_course_team` (`course_id`, `team_id`)'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET FOREIGN_KEY_CHECKS = 1;
