-- CDMGA 桌游功能增量迁移（MySQL 8.0）。
-- 在已有 identity、course、team 表的数据库执行；执行前备份数据库。
-- 本文件已包含 board_game_referee_incremental.sql、board_game_team_incremental.sql、
-- game-service/schema.sql 和 board_game_room_backfill.sql 的内容，请勿重复执行单项脚本。
-- 新发布的桌游课题由 Spring 自动创建房间；末尾仅为已有课题补建房间。

SET NAMES utf8mb4;

SET @has_referee_column = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'course' AND COLUMN_NAME = 'referee_identity_id'
);
SET @ddl = IF(@has_referee_column = 0,
  'ALTER TABLE course ADD COLUMN referee_identity_id INT NULL COMMENT ''桌游课题裁判管理员 ID''',
  'SELECT 1');
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @has_referee_fk = (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'course'
    AND CONSTRAINT_NAME = 'fk_course_board_game_referee'
);
SET @ddl = IF(@has_referee_fk = 0,
  'ALTER TABLE course ADD CONSTRAINT fk_course_board_game_referee FOREIGN KEY (referee_identity_id) REFERENCES identity(id) ON DELETE RESTRICT',
  'SELECT 1');
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

-- Bingo 原有退队逻辑也依赖 team_id 可为空；桌游新队员依赖自增主键。
ALTER TABLE team MODIFY COLUMN team_id INT NULL COMMENT '队伍编号，退出或解散后为空';
ALTER TABLE team MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT COMMENT '主键';

CREATE TABLE IF NOT EXISTS game_room (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code CHAR(8) NOT NULL UNIQUE,
  course_id INT NOT NULL,
  UNIQUE KEY uk_game_room_course (course_id),
  created_by_identity_id INT NOT NULL,
  referee_identity_id INT NOT NULL,
  status ENUM('waiting','active','ended') NOT NULL DEFAULT 'waiting',
  initial_money INT NOT NULL DEFAULT 200,
  initial_income INT NOT NULL DEFAULT 30,
  rules_version VARCHAR(40) NOT NULL DEFAULT 'demo-1',
  card_set_version VARCHAR(40) NOT NULL DEFAULT 'cards-1',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  started_at DATETIME NULL,
  ended_at DATETIME NULL,
  KEY idx_game_room_referee (referee_identity_id),
  CONSTRAINT fk_game_room_course FOREIGN KEY (course_id) REFERENCES course(id) ON DELETE RESTRICT,
  CONSTRAINT fk_game_room_creator FOREIGN KEY (created_by_identity_id) REFERENCES identity(id) ON DELETE RESTRICT,
  CONSTRAINT fk_game_room_referee FOREIGN KEY (referee_identity_id) REFERENCES identity(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 旧版本可能已有 game_room 表但没有一课题一房间约束。
-- 若已有重复房间，保留数据并在末尾列出，待人工确认后处理。
SET @has_room_unique = (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'game_room'
    AND INDEX_NAME = 'uk_game_room_course' AND NON_UNIQUE = 0
);
SET @duplicate_room_courses = (
  SELECT COUNT(*) FROM (
    SELECT course_id FROM game_room GROUP BY course_id HAVING COUNT(*) > 1
  ) AS duplicate_courses
);
SET @ddl = IF(@has_room_unique = 0 AND @duplicate_room_courses = 0,
  'ALTER TABLE game_room ADD UNIQUE KEY uk_game_room_course (course_id)',
  'SELECT 1');
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

CREATE TABLE IF NOT EXISTS game_room_seat (
  room_id BIGINT UNSIGNED NOT NULL,
  seat CHAR(1) NOT NULL,
  team_id INT NOT NULL,
  operator_identity_id INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (room_id, seat),
  UNIQUE KEY uk_game_room_team (room_id, team_id),
  UNIQUE KEY uk_game_room_operator (room_id, operator_identity_id),
  CONSTRAINT fk_game_seat_room FOREIGN KEY (room_id) REFERENCES game_room(id) ON DELETE CASCADE,
  CONSTRAINT fk_game_seat_operator FOREIGN KEY (operator_identity_id) REFERENCES identity(id) ON DELETE RESTRICT,
  CONSTRAINT ck_game_seat_letter CHECK (seat IN ('A','B','C'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS game_room_state (
  room_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
  version BIGINT UNSIGNED NOT NULL DEFAULT 0,
  state_json JSON NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_game_state_room FOREIGN KEY (room_id) REFERENCES game_room(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS game_action_log (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  room_id BIGINT UNSIGNED NOT NULL,
  seq BIGINT UNSIGNED NOT NULL,
  actor_identity_id INT NULL,
  actor_type ENUM('human','bot') NOT NULL DEFAULT 'human',
  seat CHAR(1) NULL,
  action_type VARCHAR(40) NOT NULL,
  payload_json JSON NOT NULL,
  result_version BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_game_action_seq (room_id, seq),
  CONSTRAINT fk_game_action_room FOREIGN KEY (room_id) REFERENCES game_room(id) ON DELETE CASCADE,
  CONSTRAINT fk_game_action_actor FOREIGN KEY (actor_identity_id) REFERENCES identity(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 人机不使用可登录的 identity；席位和操作日志允许空身份，操作类型单独记录。
ALTER TABLE game_room_seat MODIFY COLUMN operator_identity_id INT NULL;
ALTER TABLE game_action_log MODIFY COLUMN actor_identity_id INT NULL;
SET @has_actor_type = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'game_action_log' AND COLUMN_NAME = 'actor_type'
);
SET @ddl = IF(@has_actor_type = 0,
  'ALTER TABLE game_action_log ADD COLUMN actor_type ENUM(''human'',''bot'') NOT NULL DEFAULT ''human'' AFTER actor_identity_id',
  'SELECT 1');
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

CREATE TABLE IF NOT EXISTS game_room_bot (
  room_id BIGINT UNSIGNED NOT NULL,
  team_id INT NOT NULL,
  strategy ENUM('steady','aggressive') NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (room_id,team_id),
  CONSTRAINT fk_game_bot_room FOREIGN KEY (room_id) REFERENCES game_room(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 仅补建已有桌游课题中尚无房间、且裁判仍为有效管理员的房间。
INSERT INTO game_room (code, course_id, created_by_identity_id, referee_identity_id)
SELECT UPPER(SUBSTRING(REPLACE(UUID(), '-', ''), 1, 8)), c.id, c.referee_identity_id, c.referee_identity_id
FROM course c
JOIN identity i ON i.id = c.referee_identity_id AND i.role = 'admin' AND i.is_deleted = 0
LEFT JOIN game_room r ON r.course_id = c.id
WHERE c.category = 'board_game' AND c.is_deleted = 0 AND r.id IS NULL;

-- 检查需补充管理员裁判的旧课题及可能存在的重复房间。
SELECT c.id, c.title FROM course c LEFT JOIN game_room r ON r.course_id = c.id
WHERE c.category = 'board_game' AND c.is_deleted = 0 AND r.id IS NULL;
SELECT course_id, COUNT(*) AS room_count FROM game_room GROUP BY course_id HAVING COUNT(*) > 1;
