-- Local-only seed for ranking + admin smoke tests.
-- Run against CDMGA_LOCAL (3307), never against production.
-- Ranking data: rank1..rank6, totals 36/30/28/24/18/12 (2026 season).
INSERT IGNORE INTO identity (account, password, role, is_deleted, created_at, updated_at)
SELECT 'admin', password, 'admin', 0, NOW(), NOW() FROM identity WHERE account='tester';
UPDATE identity SET role='admin' WHERE account='admin';

-- Local-only ranking seed. Does not touch production.
INSERT IGNORE INTO identity (account, password, role, is_deleted, created_at, updated_at)
SELECT 'rank1', password, 'user', 0, NOW(), NOW() FROM identity WHERE account='tester';
INSERT IGNORE INTO identity (account, password, role, is_deleted, created_at, updated_at)
SELECT 'rank2', password, 'user', 0, NOW(), NOW() FROM identity WHERE account='tester';
INSERT IGNORE INTO identity (account, password, role, is_deleted, created_at, updated_at)
SELECT 'rank3', password, 'user', 0, NOW(), NOW() FROM identity WHERE account='tester';
INSERT IGNORE INTO identity (account, password, role, is_deleted, created_at, updated_at)
SELECT 'rank4', password, 'user', 0, NOW(), NOW() FROM identity WHERE account='tester';
INSERT IGNORE INTO identity (account, password, role, is_deleted, created_at, updated_at)
SELECT 'rank5', password, 'user', 0, NOW(), NOW() FROM identity WHERE account='tester';
INSERT IGNORE INTO identity (account, password, role, is_deleted, created_at, updated_at)
SELECT 'rank6', password, 'user', 0, NOW(), NOW() FROM identity WHERE account='tester';

INSERT IGNORE INTO profile (avatar, description, status, title, identity_id)
SELECT '', '榜单测试 · 稳定输出', 1, '测试员', id FROM identity WHERE account='rank1';
INSERT IGNORE INTO profile (avatar, description, status, title, identity_id)
SELECT '', '榜单测试 · Arcaea', 1, '测试员', id FROM identity WHERE account='rank2';
INSERT IGNORE INTO profile (avatar, description, status, title, identity_id)
SELECT '', '榜单测试 · Phigros', 1, '测试员', id FROM identity WHERE account='rank3';
INSERT IGNORE INTO profile (avatar, description, status, title, identity_id)
SELECT '', '榜单测试 · 舞萌', 1, '测试员', id FROM identity WHERE account='rank4';
INSERT IGNORE INTO profile (avatar, description, status, title, identity_id)
SELECT '', '榜单测试 · 新人', 1, '测试员', id FROM identity WHERE account='rank5';
INSERT IGNORE INTO profile (avatar, description, status, title, identity_id)
SELECT '', '榜单测试 · 摸鱼', 1, '测试员', id FROM identity WHERE account='rank6';

DELETE FROM score WHERE remark='seed-ranking' AND identity_id IN (SELECT id FROM identity WHERE account LIKE 'rank%');
INSERT INTO score (created_at, image, is_deleted, is_scored, issue_id, remark, score, updated_at, upload_time, course_id, identity_id)
SELECT NOW(), '', 0, 1, NULL, 'seed-ranking', 12, NOW(), '2026-11-02 12:00:00', 86, id FROM identity WHERE account='rank1';
INSERT INTO score (created_at, image, is_deleted, is_scored, issue_id, remark, score, updated_at, upload_time, course_id, identity_id)
SELECT NOW(), '', 0, 1, NULL, 'seed-ranking', 12, NOW(), '2026-11-03 12:00:00', 95, id FROM identity WHERE account='rank1';
INSERT INTO score (created_at, image, is_deleted, is_scored, issue_id, remark, score, updated_at, upload_time, course_id, identity_id)
SELECT NOW(), '', 0, 1, NULL, 'seed-ranking', 12, NOW(), '2026-11-04 12:00:00', 82, id FROM identity WHERE account='rank1';
INSERT INTO score (created_at, image, is_deleted, is_scored, issue_id, remark, score, updated_at, upload_time, course_id, identity_id)
SELECT NOW(), '', 0, 1, NULL, 'seed-ranking', 12, NOW(), '2026-11-02 13:00:00', 86, id FROM identity WHERE account='rank2';
INSERT INTO score (created_at, image, is_deleted, is_scored, issue_id, remark, score, updated_at, upload_time, course_id, identity_id)
SELECT NOW(), '', 0, 1, NULL, 'seed-ranking', 10, NOW(), '2026-11-03 13:00:00', 95, id FROM identity WHERE account='rank2';
INSERT INTO score (created_at, image, is_deleted, is_scored, issue_id, remark, score, updated_at, upload_time, course_id, identity_id)
SELECT NOW(), '', 0, 1, NULL, 'seed-ranking', 8, NOW(), '2026-11-04 13:00:00', 82, id FROM identity WHERE account='rank2';
INSERT INTO score (created_at, image, is_deleted, is_scored, issue_id, remark, score, updated_at, upload_time, course_id, identity_id)
SELECT NOW(), '', 0, 1, NULL, 'seed-ranking', 12, NOW(), '2026-11-02 14:00:00', 86, id FROM identity WHERE account='rank3';
INSERT INTO score (created_at, image, is_deleted, is_scored, issue_id, remark, score, updated_at, upload_time, course_id, identity_id)
SELECT NOW(), '', 0, 1, NULL, 'seed-ranking', 10, NOW(), '2026-11-03 14:00:00', 95, id FROM identity WHERE account='rank3';
INSERT INTO score (created_at, image, is_deleted, is_scored, issue_id, remark, score, updated_at, upload_time, course_id, identity_id)
SELECT NOW(), '', 0, 1, NULL, 'seed-ranking', 6, NOW(), '2026-11-04 14:00:00', 82, id FROM identity WHERE account='rank3';
INSERT INTO score (created_at, image, is_deleted, is_scored, issue_id, remark, score, updated_at, upload_time, course_id, identity_id)
SELECT NOW(), '', 0, 1, NULL, 'seed-ranking', 10, NOW(), '2026-11-02 15:00:00', 86, id FROM identity WHERE account='rank4';
INSERT INTO score (created_at, image, is_deleted, is_scored, issue_id, remark, score, updated_at, upload_time, course_id, identity_id)
SELECT NOW(), '', 0, 1, NULL, 'seed-ranking', 8, NOW(), '2026-11-03 15:00:00', 95, id FROM identity WHERE account='rank4';
INSERT INTO score (created_at, image, is_deleted, is_scored, issue_id, remark, score, updated_at, upload_time, course_id, identity_id)
SELECT NOW(), '', 0, 1, NULL, 'seed-ranking', 6, NOW(), '2026-11-04 15:00:00', 82, id FROM identity WHERE account='rank4';
INSERT INTO score (created_at, image, is_deleted, is_scored, issue_id, remark, score, updated_at, upload_time, course_id, identity_id)
SELECT NOW(), '', 0, 1, NULL, 'seed-ranking', 10, NOW(), '2026-11-02 16:00:00', 86, id FROM identity WHERE account='rank5';
INSERT INTO score (created_at, image, is_deleted, is_scored, issue_id, remark, score, updated_at, upload_time, course_id, identity_id)
SELECT NOW(), '', 0, 1, NULL, 'seed-ranking', 8, NOW(), '2026-11-03 16:00:00', 95, id FROM identity WHERE account='rank5';
INSERT INTO score (created_at, image, is_deleted, is_scored, issue_id, remark, score, updated_at, upload_time, course_id, identity_id)
SELECT NOW(), '', 0, 1, NULL, 'seed-ranking', 6, NOW(), '2026-11-02 17:00:00', 86, id FROM identity WHERE account='rank6';
INSERT INTO score (created_at, image, is_deleted, is_scored, issue_id, remark, score, updated_at, upload_time, course_id, identity_id)
SELECT NOW(), '', 0, 1, NULL, 'seed-ranking', 6, NOW(), '2026-11-03 17:00:00', 95, id FROM identity WHERE account='rank6';
