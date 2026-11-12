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

CREATE TABLE IF NOT EXISTS game_room_bot (
  room_id BIGINT UNSIGNED NOT NULL,
  team_id INT NOT NULL,
  strategy ENUM('steady','aggressive') NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (room_id,team_id),
  CONSTRAINT fk_game_bot_room FOREIGN KEY (room_id) REFERENCES game_room(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
