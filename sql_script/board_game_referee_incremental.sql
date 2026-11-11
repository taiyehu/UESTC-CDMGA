-- Run once on an existing database before deploying the updated Spring service.
ALTER TABLE course
  ADD COLUMN referee_identity_id INT NULL COMMENT '桌游课题裁判管理员 ID',
  ADD CONSTRAINT fk_course_board_game_referee
    FOREIGN KEY (referee_identity_id) REFERENCES identity(id) ON DELETE RESTRICT;
