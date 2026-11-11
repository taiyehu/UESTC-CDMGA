-- Existing databases using the original team_create.sql need nullable team_id for leave/disband.
ALTER TABLE team MODIFY COLUMN team_id INT NULL COMMENT '队伍编号，退出或解散后为空';
ALTER TABLE team MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT COMMENT '主键';
