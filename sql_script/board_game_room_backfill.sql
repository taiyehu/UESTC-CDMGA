-- Run after game-service/schema.sql for board_game courses published before automatic room creation.
-- Assign an admin referee to each existing course first.
INSERT INTO game_room (code, course_id, created_by_identity_id, referee_identity_id)
SELECT UPPER(SUBSTRING(REPLACE(UUID(), '-', ''), 1, 8)), c.id, c.referee_identity_id, c.referee_identity_id
FROM course c
JOIN identity i ON i.id = c.referee_identity_id AND i.role = 'admin' AND i.is_deleted = 0
LEFT JOIN game_room r ON r.course_id = c.id
WHERE c.category = 'board_game' AND c.is_deleted = 0 AND r.id IS NULL;
