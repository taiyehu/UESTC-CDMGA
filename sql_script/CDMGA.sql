/*
 Navicat Premium Dump SQL

 Source Server         : Admin_2025
 Source Server Type    : MySQL
 Source Server Version : 80046 (8.0.46-0ubuntu0.22.04.3)
 Source Host           : 47.109.27.209:3306
 Source Schema         : CDMGA

 Target Server Type    : MySQL
 Target Server Version : 80046 (8.0.46-0ubuntu0.22.04.3)
 File Encoding         : 65001

 Date: 22/07/2026 14:56:36
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for activity
-- ----------------------------
DROP TABLE IF EXISTS `activity`;
CREATE TABLE `activity`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `activity_banner` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `activity_file` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `is_deleted` tinyint(1) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 10 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of activity
-- ----------------------------
INSERT INTO `activity` VALUES (8, '/banners/d5686564-8112-49a0-bee5-f78ab7cb5fcd.jpg', '/files/a800293d-aae4-4899-9047-6bfbe94f3236.pptx', '音游社12月活动即将开始，请在课题提交界面找到三首预选曲并提交成绩哦', '2025-12-06 22:30:00', '2025-12-07 02:00:00', 0, '2025-11-26 12:27:15', '2025-11-26 12:27:15', '「♛ Arcaea 皇牌空戰 ♛」');
INSERT INTO `activity` VALUES (9, '/banners/59bbe597-09ad-4a79-bdb1-307be61e9ae9.png', '/files/3f04d8fe-3cbe-4ab9-aa70-f8978461c6a3.png', '测试用活动，请不要向该活动相关课题上传成绩', '2026-01-16 08:00:00', '2026-01-19 08:00:00', 0, '2026-01-17 06:30:07', '2026-01-17 06:30:07', '测试活动');

-- ----------------------------
-- Table structure for activity_course_assoc
-- ----------------------------
DROP TABLE IF EXISTS `activity_course_assoc`;
CREATE TABLE `activity_course_assoc`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `activity_id` int NULL DEFAULT NULL,
  `course_id` int NULL DEFAULT NULL,
  `rule` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_activity_id`(`activity_id` ASC) USING BTREE,
  INDEX `idx_course_id`(`course_id` ASC) USING BTREE,
  CONSTRAINT `fk_ac_assoc_activity` FOREIGN KEY (`activity_id`) REFERENCES `activity` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT,
  CONSTRAINT `fk_ac_assoc_course` FOREIGN KEY (`course_id`) REFERENCES `course` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 5 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of activity_course_assoc
-- ----------------------------
INSERT INTO `activity_course_assoc` VALUES (1, 8, 68, 'arcaea计分方式');
INSERT INTO `activity_course_assoc` VALUES (2, 8, 69, 'arcaea计分方式');
INSERT INTO `activity_course_assoc` VALUES (3, 8, 70, 'arcaea计分方式');
INSERT INTO `activity_course_assoc` VALUES (4, 9, 73, 'arcaea计分方式');

-- ----------------------------
-- Table structure for bingo_tips
-- ----------------------------
DROP TABLE IF EXISTS `bingo_tips`;
CREATE TABLE `bingo_tips`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `issue_id` int NOT NULL,
  `tip` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `course_id` int NOT NULL,
  `created_at` datetime NOT NULL,
  `team_id` int NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `issue_tip`(`issue_id` ASC) USING BTREE,
  INDEX `idx_bingo_tip_course_issue_created`(`course_id` ASC, `issue_id` ASC, `created_at` ASC, `id` ASC) USING BTREE,
  INDEX `team_tip`(`team_id` ASC) USING BTREE,
  CONSTRAINT `course_tip` FOREIGN KEY (`course_id`) REFERENCES `course` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `issue_tip` FOREIGN KEY (`issue_id`) REFERENCES `issue` (`issue_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `team_tip` FOREIGN KEY (`team_id`) REFERENCES `team` (`team_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 33 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of bingo_tips
-- ----------------------------
INSERT INTO `bingo_tips` VALUES (7, 22, '这首诗是什么意思？ 答：芥川龙之介（藏在斜线上）', 83, '2026-03-28 11:45:54', 8);
INSERT INTO `bingo_tips` VALUES (8, 23, '一共6个不同字母，试试组合吧', 83, '2026-03-28 11:48:25', 4);
INSERT INTO `bingo_tips` VALUES (10, 20, '搜索上的线索 答：https://www.7sref.cc/', 83, '2026-03-28 12:18:16', 9);
INSERT INTO `bingo_tips` VALUES (17, 12, 'Dynamix\n難度    CASUAL    NORMAL    HARD    MEGA    GIGA\n等級    4    -    -    13    15\nPhigros\n難度    EZ    HD    IN    AT\n等級    6    12    14    16\nTAKUMI³\n難度    NORMAL    HARD    MASTER    INSANITY    RAVAGE\n等級    5    10    13+    15    --', 83, '2026-03-28 15:00:46', 8);
INSERT INTO `bingo_tips` VALUES (29, 14, '曲师ginkiha', 83, '2026-03-28 17:06:38', 10);
INSERT INTO `bingo_tips` VALUES (30, 18, '曲师暴走p', 83, '2026-03-28 17:06:52', 10);
INSERT INTO `bingo_tips` VALUES (32, 23, '2023年phigros愚人节', 83, '2026-03-28 17:29:12', 4);

-- ----------------------------
-- Table structure for course
-- ----------------------------
DROP TABLE IF EXISTS `course`;
CREATE TABLE `course`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '课题主键',
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `category` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `start_time` datetime NOT NULL COMMENT '开始时间',
  `end_time` datetime NOT NULL COMMENT '结束时间',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '课题配图路径',
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0 COMMENT '逻辑删除标志（0=未删除，1=已删除）',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 87 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '课题表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of course
-- ----------------------------
INSERT INTO `course` VALUES (45, 'This is the beginning...', 'for test', '2025-09-08 16:22:33', '2025-09-29 16:00:00', '欢迎进入电子科技大学音游社网站，这是我们的第一个课题，请确保你能看见这些课题的内容', '/images/b90b3007-53e5-4429-ab6a-2a51a03baf61.jpg', 0, '2025-09-08 16:23:26', '2025-09-08 16:23:26');
INSERT INTO `course` VALUES (53, 'test', 'test', '2025-10-22 05:18:12', '2025-10-23 05:18:13', 'test', '/images/1e577c16-c839-4376-9d9a-7d7c968b0e4b.jpg', 1, '2025-10-22 05:18:18', '2025-10-22 13:20:18');
INSERT INTO `course` VALUES (54, 'test', 'test', '2025-10-22 06:35:16', '2025-10-30 16:00:00', 'test', '/images/c961d938-ab67-43f7-9613-ff5115b9f4f7.png', 1, '2025-10-22 06:35:37', '2025-10-22 06:35:37');
INSERT INTO `course` VALUES (55, '10.22 - 10.29 课题：起点', 'Arcaea / 舞萌DX', '2025-10-22 06:57:43', '2025-10-29 15:59:59', '从六首歌里选择一首，达成条件后只提交成绩图和可能的说明。每首歌的分数都不一样，按照完成的难度分为10分，11分，12分，请阅读图片后完成', '/images/3f698e75-3be1-4f3c-8a37-6432a69ddb3d.png', 0, '2025-10-22 06:59:47', '2025-10-22 06:59:47');
INSERT INTO `course` VALUES (56, '10.29/11.5 第二次课题', 'Phigros/CHUNITHM', '2025-10-28 16:00:00', '2025-11-04 16:00:00', '从六首歌里选择一首，达成条件后只提交成绩图和可能的说明。每首歌的分数都不一样，按照完成的难度分为10分，11分，12分，请阅读图片后完成', '/images/e5b321cc-ab3b-4eeb-bb91-86868af791ea.png', 0, '2025-10-28 15:40:33', '2025-10-28 15:40:33');
INSERT INTO `course` VALUES (57, '11.5/11.19 第三次课题', '纵连', '2025-11-04 16:00:00', '2025-11-18 16:00:00', '从六首歌里选择一首，达成条件后只提交成绩图和可能的说明。每首歌的分数都不一样，按照完成的难度分为10分，11分，12分，请阅读图片后完成', '/images/0727990b-22b2-4696-b970-214bd96b7ee9.png', 0, '2025-11-04 12:07:04', '2025-11-04 12:07:04');
INSERT INTO `course` VALUES (64, 'test1', 'contest', '2025-11-26 02:34:24', '2025-11-26 16:00:00', 'test', '/images/fc67c473-c53a-43c6-9cdd-31b736da9464.jpg', 1, '2025-11-26 02:35:00', '2025-11-26 02:35:00');
INSERT INTO `course` VALUES (65, 'test2', 'contest', '2025-11-26 02:34:24', '2025-11-26 16:00:00', 'test2', '/images/9639d508-25c8-4ca6-a8ca-42db170f42e2.jpg', 1, '2025-11-26 02:35:15', '2025-11-26 02:35:15');
INSERT INTO `course` VALUES (66, 'test3', 'contest', '2025-11-26 02:34:24', '2025-11-26 16:00:00', 'test3', '/images/66940177-70ab-48ba-8de0-a2d1f19c98f6.jpg', 1, '2025-11-26 02:35:31', '2025-11-26 02:35:31');
INSERT INTO `course` VALUES (67, '测试课题1', 'contest', '2025-11-25 16:00:00', '2025-11-27 16:00:00', '测试', '/images/6b830f08-19e3-43e2-b3c7-f284c5f0627b.jpg', 1, '2025-11-26 10:06:38', '2025-11-26 18:10:19');
INSERT INTO `course` VALUES (68, '12.7 音游社比赛 预选曲1 Equilibrium', 'contest', '2025-11-26 12:30:00', '2025-12-04 16:00:00', '请关闭ptt显示后游玩并上传成绩图，截图请带上游玩的时间。结算时将计算三首歌的分数总和', '/images/c5d1578e-fc06-4fe0-88ee-8c31c216224f.jpg', 0, '2025-11-26 12:30:12', '2025-11-26 12:30:12');
INSERT INTO `course` VALUES (69, '12.7 音游社比赛 预选曲2 Lost Desire', 'contest', '2025-11-26 12:30:00', '2025-12-04 16:00:00', '请关闭ptt显示后游玩并上传成绩图，截图请带上游玩的时间。结算时将计算三首歌的分数总和', '/images/a14269be-d2e0-49da-a7c4-6308a12dc951.jpg', 0, '2025-11-26 12:30:36', '2025-11-26 12:30:36');
INSERT INTO `course` VALUES (70, '12.7 音游社比赛 预选曲3 Ether Strike', 'contest', '2025-11-26 12:30:00', '2025-12-04 16:00:00', '请关闭ptt显示后游玩并上传成绩图，截图请带上游玩的时间。结算时将计算三首歌的分数总和', '/images/27d812dd-33dd-4953-8eb0-00c7f98fac8c.jpg', 0, '2025-11-26 12:30:53', '2025-11-26 12:30:53');
INSERT INTO `course` VALUES (71, '12.12/12.19 第四次课题', '准度课题', '2025-12-12 05:36:54', '2025-12-25 16:00:00', '从六首歌里选择一首，达成条件后只提交成绩图和可能的说明。每首歌的分数都不一样，按照完成的难度分为10分，11分，12分，请阅读图片后完成', '/images/425432a7-ef48-40ad-a5f2-d8dc9abc0461.jpg', 0, '2025-12-12 05:39:05', '2025-12-12 19:24:01');
INSERT INTO `course` VALUES (72, '12.12/12.19 第五次课题', '新年课题', '2025-12-31 16:00:00', '2026-01-06 16:00:00', '从六首歌里选择一首，达成条件后只提交成绩图和可能的说明。每首歌的分数都不一样，按照完成的难度分为10分，11分，12分，请阅读图片后完成', '/images/ff7af490-0039-49ea-a810-1c7e7db60e36.png', 0, '2025-12-31 13:16:53', '2025-12-31 21:18:29');
INSERT INTO `course` VALUES (73, '测试课题', 'contest', '2026-01-16 16:00:00', '2026-01-19 16:00:00', '测试用课题，请不要在此上传成绩', '/images/8ed3eeaf-d1d8-4ee2-83ff-7b706a2734a3.png', 1, '2026-01-17 06:31:13', '2026-01-17 06:31:13');
INSERT INTO `course` VALUES (74, '第一次电科x西交联合课题', '手序交互专项', '2026-01-17 16:00:00', '2026-01-31 16:00:00', '	从六首歌里选择一首，达成条件后只提交成绩图和可能的说明。每首歌的分数都不一样，按照完成的难度分为10分，11分，12分，请阅读图片后完成', '/images/9ab88317-56b2-4c9d-89ef-5f34f76d2eae.png', 0, '2026-01-17 14:28:49', '2026-01-17 14:28:49');
INSERT INTO `course` VALUES (75, '第二次电科x西交联合课题', '冬日主题课题', '2026-02-06 13:40:03', '2026-02-22 15:59:59', '从六首歌里选择一首，达成条件后只提交成绩图和可能的说明。每首歌的分数都不一样，按照完成的难度分为10分，11分，12分，请阅读图片后完成', '/images/35edf2aa-2d3e-4ac6-af7a-88af3d495990.jpg', 1, '2026-02-06 13:40:23', '2026-02-06 13:40:23');
INSERT INTO `course` VALUES (76, '第二次电科x西交联合课题', '冬日主题课题', '2026-02-06 13:49:14', '2026-02-23 15:59:59', '从六首歌里选择一首，达成条件后只提交成绩图和可能的说明。每首歌的分数都不一样，按照完成的难度分为10分，11分，12分，请阅读图片后完成', '/images/8f4d5e87-d160-4429-b792-45fc70761f22.jpg', 1, '2026-02-06 13:50:03', '2026-02-06 13:50:03');
INSERT INTO `course` VALUES (77, '第二次电科x西交联合课题', '冬日主题课题', '2026-02-06 14:04:32', '2026-02-22 15:59:59', '从六首歌里选择一首，达成条件后只提交成绩图和可能的说明。每首歌的分数都不一样，按照完成的难度分为10分，11分，12分，请阅读图片后完成', '/images/0266a34c-9aba-476c-947d-9a1e685a44ff.jpg', 0, '2026-02-06 14:05:16', '2026-02-06 14:05:16');
INSERT INTO `course` VALUES (82, '第三次电科x西交联合课题：追加铺面课题', 'typical', '2026-03-23 00:00:00', '2026-04-06 00:00:00', '从六首歌里选择一首，达成条件后只提交成绩图和可能的说明。每首歌的分数都不一样，按照完成的难度分为10分，11分，12分。', '/images/f4ff15a5-1685-4ce2-8c55-b2c33dbfe8b1.JPG', 0, '2026-03-22 19:16:37', '2026-03-22 19:59:53');
INSERT INTO `course` VALUES (83, '音游社3月Bingo活动', 'bingo', '2026-03-28 10:00:00', '2026-03-28 18:00:00', '“……哎呀，他们看起来都不是很尽兴呢。\n.\n这也怪不得他们，呵呵，我可不是会扫别人兴的人啊。可是你看——\n.\n话说，你觉得我们能办到它么？这么多天了，过去那些人所见到的一切……\n.\n或许，我们还能让它重新上演一次？”\n.\n电子科技大学音游社最新最热活动——Bingo限时复刻！无论你是舞萌大神，arcaea大师，还是phigros萌新，又或是什么都不懂的小白\n.\n还是phigros萌新\n.\n欢迎大家来玩！\n.\n还是phigros萌新', '/images/92417cd0-2a3d-447a-b219-c2a391845ad2.png', 0, '2026-03-27 17:41:11', '2026-03-27 17:41:11');
INSERT INTO `course` VALUES (85, '清明假期趣味冲榜活动', 'ranking', '2026-04-04 00:00:00', '2026-04-11 00:00:00', '要求：游玩 【協】三妖精SAY YA!!! 并上传成绩图参加活动。上传时请交自己的那份哦，三个人交三次啦', '/images/d1d7f73c-1ed3-4812-bc00-45fce1195037.png', 0, '2026-04-03 22:43:29', '2026-04-04 00:00:04');
INSERT INTO `course` VALUES (86, '钢琴&艺核专题', 'typical', '2026-05-06 00:00:00', '2026-05-20 00:00:00', '从六首歌里选择一首，达成条件后只提交成绩图和可能的说明。每首歌的分数都不一样，按照完成的难度分为10分，11分，12分。', '/images/58d32daf-fa38-48d5-a39d-67c1c00a5e5c.jpg', 0, '2026-05-06 12:37:05', '2026-05-06 12:50:48');

-- ----------------------------
-- Table structure for identity
-- ----------------------------
DROP TABLE IF EXISTS `identity`;
CREATE TABLE `identity`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `account` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `role` enum('admin','user') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'user' COMMENT '角色：管理员或普通用户',
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0 COMMENT '逻辑删除标志（0=未删除，1=已删除）',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `id`(`id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 237 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of identity
-- ----------------------------
INSERT INTO `identity` VALUES (8, 'ETL1224', '$2a$10$jCOnqYQDCNJuin2vM5zWk.tR/xUcUMItNt598LORh41HAQUdK9JYu', 'admin', 0, '2025-07-15 14:12:10', '2025-10-29 22:27:58');
INSERT INTO `identity` VALUES (21, 'magicneko', '$2a$10$jkrYop.w4Spo7vd1ycx5wunj5p6tK4qBPEJxTSXukP.Q5xTKQg.mq', 'admin', 0, '2025-07-15 17:27:33', '2025-10-15 20:28:56');
INSERT INTO `identity` VALUES (29, 'Thorod', '$2a$10$iC51716nQoX82vPaiGYlfudgMc87DiyrQEdl/axhT5clwRbFn/7mG', 'user', 0, '2025-09-07 05:18:48', '2025-09-07 05:18:48');
INSERT INTO `identity` VALUES (32, 'lyrith', '$2a$10$knjd5u5v.yXUEKqU.F238.5r7QLP5cdWsIWCFYXqjHyg2jwIjDMpS', 'admin', 0, '2025-09-10 01:06:31', '2026-03-25 19:04:28');
INSERT INTO `identity` VALUES (33, 'ionicbond', '$2a$10$3DI3Xf3sxpyGtVmff.GV/uQPgQ20mxJ/EvF9GcBWgESY3Nspws6pi', 'admin', 0, '2025-09-13 12:44:13', '2025-10-15 20:29:31');
INSERT INTO `identity` VALUES (35, 'taiyehu', '$2a$10$jCOnqYQDCNJuin2vM5zWk.tR/xUcUMItNt598LORh41HAQUdK9JYu', 'admin', 0, '2025-10-07 16:24:31', '2025-10-15 20:29:33');
INSERT INTO `identity` VALUES (37, 'Jpikad', '$2a$10$JIxnMf5DSdzPY8fILRW1BeMHVuJ4WcJ1fOx1.DgfXUCX9tOmel.XO', 'user', 0, '2025-10-09 10:19:07', '2025-10-09 10:19:07');
INSERT INTO `identity` VALUES (38, '是一只鼠', '$2a$10$4fjI585wQku94OrvBz/2M.u.B40oMAJGsTcsTMghp8AW7T/iP4FG6', 'admin', 0, '2025-10-09 10:24:53', '2025-10-15 20:29:39');
INSERT INTO `identity` VALUES (39, 'Dawnlux☆', '$2a$10$4rEUmcD9w8RaswnRY2gih.taNFkthNBSK4tNLqSF1tY6CHevj0eUy', 'user', 0, '2025-10-09 10:24:53', '2025-10-09 10:24:53');
INSERT INTO `identity` VALUES (40, 'Forigin', '$2a$10$p3rWo/AosarDqa5OE2T/heej91f1uERiNV24593k8UoldlApmxqN6', 'admin', 0, '2025-10-09 10:25:14', '2026-03-25 19:04:33');
INSERT INTO `identity` VALUES (41, '一根老冰棍', '$2a$10$lZOEwkp2yLgU6ieZDJ7I9ejtPN4KraLbaR.MZQkAt.bTByNKRJNM6', 'user', 0, '2025-10-09 10:25:25', '2025-10-09 10:25:25');
INSERT INTO `identity` VALUES (42, 'shiroha', '$2a$10$OzE8Rxt15jEYhLfNEn2Bju/Iaes69pLVGcbRBkeGEhfs9Emo45Axi', 'user', 0, '2025-10-09 10:26:12', '2025-10-09 10:26:12');
INSERT INTO `identity` VALUES (43, 'aplick', '$2a$10$U2c/vBbxfxiDmbgpeOWRieuFppgZSXRVaaTsz0Pr.OaECSkr9qKlO', 'user', 0, '2025-10-09 10:26:35', '2025-10-09 10:26:35');
INSERT INTO `identity` VALUES (44, 'GMXH', '$2a$10$lGgt0b0XcVEN9gE.XOSEt.dvKZZr8rzfqjKcUEme59YvTSPxmiYb6', 'admin', 0, '2025-10-09 10:26:36', '2025-10-15 20:29:47');
INSERT INTO `identity` VALUES (45, 'Lyyrith', '$2a$10$RV6V63YecB7QkY0TmVDjuuimsQzSc5FG/mKJoXcjT8mZ9DPv1qPvi', 'user', 0, '2025-10-09 10:27:25', '2025-10-09 10:27:25');
INSERT INTO `identity` VALUES (46, 'frostleaf', '$2a$10$VUYbjZTiTMYfhRkIEub9G.yHT39uibuPi86YUjm/Jc6kPfclPjOp6', 'admin', 0, '2025-10-09 10:28:03', '2025-10-15 20:29:51');
INSERT INTO `identity` VALUES (47, 'ionicbond2', '$2a$10$GC8eBLTOgYpAXzmws5V22ucTVHzMfWz1qKYvQm8raj5CnuRKecKmq', 'user', 0, '2025-10-09 10:29:36', '2025-10-09 10:29:36');
INSERT INTO `identity` VALUES (48, '正常的游客', '$2a$10$vqjHzzXPTH5HVyM5rIwy9.UcfsmjsvakKW5GwVB9JYzAwrSeZdL.S', 'admin', 0, '2025-10-12 08:31:22', '2025-10-15 20:29:56');
INSERT INTO `identity` VALUES (49, 'Yukids', '$2a$10$TJypg5/nn5CRwd.9mUXXouAZvn77mn8SPyTDEwkXjy.p6ipNSQRq.', 'admin', 0, '2025-10-12 08:31:30', '2025-10-15 20:30:00');
INSERT INTO `identity` VALUES (50, 'Zobser', '$2a$10$EhTKX.V1cIZ5ORU4akm2QeuB3X1Q9MzYyce38rsUzaWkvz0AGw/N.', 'user', 0, '2025-10-12 08:32:41', '2025-10-12 08:32:41');
INSERT INTO `identity` VALUES (51, 'QGlint', '$2a$10$6w64kuU6n1Hd7PsHvzowRuzb0v7HcrnoEKP8SWr.mJpk1YYEQwLp2', 'admin', 0, '2025-10-15 11:36:56', '2025-10-15 20:30:04');
INSERT INTO `identity` VALUES (52, 'TxH', '$2a$10$FhLLfbRtpwV2.Z3SgssTZeYk2mH6tjqx9yyih14Uu.q6zHGdoy8Lm', 'user', 0, '2025-10-18 06:41:33', '2025-10-18 06:41:33');
INSERT INTO `identity` VALUES (53, 'jianouo', '$2a$10$CfYW.a3BLHRfsLfLz6Gd..ZBzBLYdiSgl7VRKjMYVy8PqTtwpihci', 'user', 0, '2025-10-18 06:41:51', '2025-10-18 06:41:51');
INSERT INTO `identity` VALUES (54, 'sta', '$2a$10$RnOQtsO8pFWez.K5l5w0e.yZjHB53n9iyQc/Hl2l7Qy857k9PgPEm', 'user', 0, '2025-10-18 06:41:58', '2025-10-18 06:41:58');
INSERT INTO `identity` VALUES (55, 'RainFlame', '$2a$10$Kineu3LZlEPiV0J9KCdzXOpdBD002S7odCf1jMG9IR6zxZ/A1SPnq', 'user', 0, '2025-10-18 06:42:00', '2025-10-18 06:42:00');
INSERT INTO `identity` VALUES (56, 'marisa1145', '$2a$10$7VWx5Hj5hNeeqZ8a/x4h.uGsqGmeCNJSzLvk6zwGc7v5Yr40Swcpi', 'user', 0, '2025-10-18 06:44:41', '2025-10-18 06:44:41');
INSERT INTO `identity` VALUES (57, 'Hotaru', '$2a$10$q1JmJRlJI.JxbONLm74bue205xV1jHZi9TbYxKAmcS2bQ3I0131nK', 'user', 0, '2025-10-18 06:49:34', '2025-10-18 06:49:34');
INSERT INTO `identity` VALUES (58, 'adnin', '$2a$10$9N6ksdFQpvns2GIrbQk59eEzRbeaS9BWb8rEw0UTITMdrPgF/xluG', 'user', 0, '2025-10-18 07:05:56', '2025-10-18 07:05:56');
INSERT INTO `identity` VALUES (59, 'admin', '$2a$10$a1.DDeLNit9NH7KBsSt/xe8.wFvPv6VA2Xs.tRS2CnppgU6uXBrwC', 'user', 0, '2025-10-18 08:53:21', '2025-10-18 08:53:21');
INSERT INTO `identity` VALUES (60, 'blxg', '$2a$10$vptdoodF2ZzjV8hoRkEn3.ZzPeOyrbp/9mXPRO5sNiIeYPOSooOp.', 'user', 0, '2025-10-18 10:15:17', '2025-10-18 10:15:17');
INSERT INTO `identity` VALUES (61, 'cyzsuki', '$2a$10$T1whO.vMBFhwIXoLnQnrnOyzbD1roOygbzxGJS9aR4DQlovRhVVbG', 'user', 0, '2025-10-18 12:00:42', '2025-10-18 12:00:42');
INSERT INTO `identity` VALUES (62, '21sk', '$2a$10$cvsP/YRhLHxVPpOgOeBQuuJIvZDAOD1TPCVMecWCEBuHhuKn.7O3.', 'user', 0, '2025-10-19 09:29:39', '2025-10-19 09:29:39');
INSERT INTO `identity` VALUES (65, '不做DJ了', '$2a$10$q7DTOjK8AZt2WkjzJB68Tehz8YCw6PM5jO6jFNiJjyv3PM03rGLpC', 'user', 0, '2025-10-20 14:45:16', '2025-10-20 14:45:16');
INSERT INTO `identity` VALUES (66, 'starofleaf', '$2a$10$kUMBRVhx4DmN2BVBqxVG4ObWK2JkbC73hSqrCQeoh7laqBIJftZI2', 'user', 0, '2025-10-20 14:45:20', '2025-10-20 14:45:20');
INSERT INTO `identity` VALUES (67, 'thfairy', '$2a$10$Lx1wZuvhEu6D8X1MgVtp1eEa6fXS8d/Y0B86xbaU2kIcIx.rO4UCu', 'user', 0, '2025-10-20 14:46:26', '2025-10-20 14:46:26');
INSERT INTO `identity` VALUES (68, 'Misekaria', '$2a$10$WBGHdZY.1/R1YscOP3ecZeXFmVsdSt0TPoWv25pPyrsBPN4PWcvDG', 'user', 0, '2025-10-20 14:47:01', '2025-10-20 14:47:01');
INSERT INTO `identity` VALUES (70, 'Azu4a', '$2a$10$R6zzxZB0oC6vkHZRxZz2re8tmtzPfqmw6pgf0.VxCUEtHmzrKHZ02', 'user', 0, '2025-10-20 14:48:43', '2025-10-20 14:48:43');
INSERT INTO `identity` VALUES (71, 'haruka', '$2a$10$Wfrnz5YvNxyeCVmSonfW6eUXSjjTCl/aK1Mae6WWgB8HiGP2u7JzC', 'user', 0, '2025-10-20 14:48:51', '2025-10-20 14:48:51');
INSERT INTO `identity` VALUES (72, 'chrine', '$2a$10$.3bhaXuHnigsfbwkYrVyseUI3fBHjkejzpmDW0BnY6B7cmhlInLX.', 'user', 0, '2025-10-20 14:49:29', '2025-10-20 14:49:29');
INSERT INTO `identity` VALUES (73, 'Lam', '$2a$10$kn1db7NZ1HDesJCxr7EUbe6COlnlLETrFUllB8Q/Mb4ViUfditDEe', 'user', 0, '2025-10-20 14:49:59', '2025-10-20 14:49:59');
INSERT INTO `identity` VALUES (74, '🧀🥛🍠', '$2a$10$qjTt6L.Au0pPG5NeoWxmoO3cTJNPAJzxNL5jmkrIxjaHnYQ/JeqIC', 'user', 0, '2025-10-20 14:51:24', '2025-10-20 14:51:24');
INSERT INTO `identity` VALUES (75, 'Gn1m', '$2a$10$qnsRmBqKWETvH0RSYwRk/.yEhSzr9KLQUxcO.nBEmOo2jcx1KTMES', 'user', 0, '2025-10-20 14:52:20', '2025-10-20 14:52:20');
INSERT INTO `identity` VALUES (76, 'ihihihihiii', '$2a$10$s5.Q7/gL6ECvQJ64tl5fmu.Mq4zrVHyp4pHVoZnJJjwmpOZLXcr8u', 'user', 0, '2025-10-20 14:53:00', '2025-10-20 14:53:00');
INSERT INTO `identity` VALUES (77, '004Tingting', '$2a$10$fNTQM3fJnbJnA3F848RrUOO.sQ.HPxyOWQs6JISrfgpcTeUxz92Bq', 'user', 0, '2025-10-20 14:55:46', '2025-10-20 14:55:46');
INSERT INTO `identity` VALUES (78, 'Pepp@PiG_4Maimai', '$2a$10$LLvs9jum9ueo/74t3Z2BRO6jNw61Oe969eFRvHIx6i84sbwR6BT5G', 'user', 0, '2025-10-20 14:57:40', '2025-10-20 14:57:40');
INSERT INTO `identity` VALUES (79, 'UsagiPOI', '$2a$10$btf1wtG5ovozZxm5geBuWu3korh8RZa4Su5wqMudNfNUBtL2tPIjW', 'user', 0, '2025-10-20 14:59:26', '2025-10-20 14:59:26');
INSERT INTO `identity` VALUES (80, 'jjgw', '$2a$10$LdgLUlaq9uGeQctDODui0eHM0whwMlbpoPkhD/gE8JlzGPttx9oBS', 'user', 0, '2025-10-20 14:59:59', '2025-10-20 14:59:59');
INSERT INTO `identity` VALUES (81, '台灯老婆', '$2a$10$Qobfe3iGUZizRC05z2WepOrxDwJJjxTCv6Op7sTKON82I3qIHmDnW', 'user', 0, '2025-10-20 15:01:10', '2025-10-20 15:01:10');
INSERT INTO `identity` VALUES (82, 'Pnkicatt', '$2a$10$pe/AZWMUgOjZgHguuLAMUOmghYYWzcM71cjS.dnlvXeOhFVvmgpsi', 'user', 0, '2025-10-20 15:01:59', '2025-10-20 15:01:59');
INSERT INTO `identity` VALUES (83, '茴香豆好恰', '$2a$10$wB45iER9iybZL6lRrPjEsuCCdEzsZg.SiTx3E3OPrkN1m1SHmHpH6', 'user', 0, '2025-10-20 15:02:07', '2025-10-20 15:02:07');
INSERT INTO `identity` VALUES (84, 'thugstools1001', '$2a$10$q32qbYv4EVl1obdJevgzEuPXadh6dp5/9Z6OJywr2Oy0QV.Ks9FdS', 'user', 0, '2025-10-20 15:07:15', '2025-10-20 15:07:15');
INSERT INTO `identity` VALUES (85, 'Knd_25', '$2a$10$gK50qNigjExUxCizmoN1Su77CZV307V7bB4g94Y17YcQupvqfsC.u', 'user', 0, '2025-10-20 15:13:57', '2025-10-20 15:13:57');
INSERT INTO `identity` VALUES (86, 'Loboko', '$2a$10$.b5Eod7jxjrEQZ2F.rNJhurZvrR6tK.Zu1A5YVkTnwMoHDh6naiEC', 'user', 0, '2025-10-20 15:17:59', '2025-10-20 15:17:59');
INSERT INTO `identity` VALUES (87, 'Adamero', '$2a$10$rdbO9bTiN5UgnmieKnTRW.9fl2OJcNSFmCor2RP01rw7vKdqmJgkO', 'user', 0, '2025-10-20 15:22:26', '2025-10-20 15:22:26');
INSERT INTO `identity` VALUES (88, 'Error404', '$2a$10$jYPtjx8sbFa0ZURoHTVq9ulh8TLla4UJjwQYqlPphzh9dplkvk.si', 'user', 0, '2025-10-20 15:22:42', '2025-10-20 15:22:42');
INSERT INTO `identity` VALUES (89, '水平线上的云', '$2a$10$PnQW30cvjvkFu1j9Ig/Mx..JQfy//n2tT4oe0vNCj1F/dPXMc.pw2', 'user', 0, '2025-10-20 15:32:48', '2025-10-20 15:32:48');
INSERT INTO `identity` VALUES (90, '出不起勤', '$2a$10$i60mkpcfp.GGaLuDUOioYurgagglz3ntY8.D/4p8rHCTeq5mhVMre', 'user', 0, '2025-10-20 15:39:55', '2025-10-20 15:39:55');
INSERT INTO `identity` VALUES (91, 'lmt114514', '$2a$10$EpykiiDMBul0OWtFldji8.jD8YI82lCs6uoooBRKGfj6QuWlhJCCG', 'user', 0, '2025-10-20 15:40:04', '2025-10-20 15:40:04');
INSERT INTO `identity` VALUES (92, 'check', '$2a$10$sQwwskkHNf5RX1DQmNsV7.p9uNO84CAeEpw2KaHCAvI6zZWtQV1Yq', 'user', 0, '2025-10-20 15:49:08', '2025-10-20 15:49:08');
INSERT INTO `identity` VALUES (93, '一只小鸽鸽', '$2a$10$nzl7/gv/ZVMNpqKt7LgcQOR7Ix0n5vR.0qkhNqhrAmJnW.qIPPcQS', 'user', 0, '2025-10-20 15:55:02', '2025-10-20 15:55:02');
INSERT INTO `identity` VALUES (94, 'abhhcc', '$2a$10$jTD5Bvp0mLDPbsZIopOnz.mKuZpdCEoLOxkqC0hGTW6eQEDLeVFa.', 'user', 0, '2025-10-20 15:57:14', '2025-10-20 15:57:14');
INSERT INTO `identity` VALUES (95, 'ReEd3', '$2a$10$uwOzMgYqdSx71xBgJ2QqsOfupUmHhvtynpIu2GxsatEzGsKSyhogW', 'user', 0, '2025-10-20 16:10:00', '2025-10-20 16:10:00');
INSERT INTO `identity` VALUES (96, 'ksana', '$2a$10$MnJQIMuIk42tpgurNIXAzuE8xWn191iYUEkEHSjnXpTKQdR9eBpE2', 'user', 0, '2025-10-20 16:11:25', '2025-10-20 16:11:25');
INSERT INTO `identity` VALUES (97, 'ayanami', '$2a$10$Ygb6hCmI7s45GaAHj69FK.Ng.nnlnie6rDSpXKtL1b.kCj8NxN7Xq', 'user', 0, '2025-10-20 16:51:01', '2025-10-20 16:51:01');
INSERT INTO `identity` VALUES (98, '山有木兮', '$2a$10$tXeMepSBvnYkh4MslhA/8OmPAUSyCUQbJ7McP.40XbrR3PsoiYbKW', 'user', 0, '2025-10-20 17:05:04', '2025-10-20 17:05:04');
INSERT INTO `identity` VALUES (99, 'AndSjsj', '$2a$10$zYErPb7Fbhrgx79PBNcSqOMLujVXb8FPKLXXtHdbDGMd1drQtyNdq', 'user', 0, '2025-10-20 17:11:42', '2025-10-20 17:11:42');
INSERT INTO `identity` VALUES (100, 'zackeylove', '$2a$10$aJZjED4mkEsIzlsAGN8LQeyvpVgN7OUy62zdgusRXAnIe08EHUsLe', 'user', 0, '2025-10-20 17:57:58', '2025-10-20 17:57:58');
INSERT INTO `identity` VALUES (101, 'hjnjjhh', '$2a$10$2J6gg4MXARDOYE9NNb0.Lem3bUCwfgUEm7stVbFIj1/IxvQbdnhQy', 'user', 0, '2025-10-20 23:02:44', '2025-10-20 23:02:44');
INSERT INTO `identity` VALUES (102, '*太微*', '$2a$10$/FaB5mP6dxoyqn5Q.SuaDeLvo1QYAfNjHj.IpsZfhDIR8Q.h13rHG', 'user', 0, '2025-10-20 23:19:04', '2025-10-20 23:19:04');
INSERT INTO `identity` VALUES (103, 'Prohnaica', '$2a$10$zCnPvoB4XDp/RWfOHJJoeuY7feEdB.iDUcz7aUu4o9Y9tuloQ7nEG', 'user', 0, '2025-10-20 23:39:56', '2025-10-20 23:39:56');
INSERT INTO `identity` VALUES (104, 'Cosmicman', '$2a$10$teHMy7aWi4i0T1zzCEY1qu0ScRns/AobzkF3KYGWGQh8130Tg/oKK', 'user', 0, '2025-10-20 23:40:09', '2025-10-20 23:40:09');
INSERT INTO `identity` VALUES (105, 'XieKe', '$2a$10$kgxGmcCaYutC1YlydfulCe/ysm5Uz3KYjYmC/vjXm5vl7ho2e.HHW', 'user', 0, '2025-10-20 23:49:39', '2025-10-20 23:49:39');
INSERT INTO `identity` VALUES (106, '繁星落江河', '$2a$10$w5ZQQwxeab8itFgVdgQAXOZzffxZQoJ711p.lI5GZzGqIicVfWo0y', 'user', 0, '2025-10-21 00:00:29', '2025-10-21 00:00:29');
INSERT INTO `identity` VALUES (107, 'Llithyia', '$2a$10$hafOtaUUX1W8Okbe130oJuYIXqG5IokEK6djbQm/AcAuLyObvhCCC', 'user', 0, '2025-10-21 00:35:48', '2025-10-21 00:35:48');
INSERT INTO `identity` VALUES (108, '欧耶绿绿的箭', '$2a$10$W/1LnW2E3zBx2zslxk4Pp.8F6BE5nQkR2ygGWXBhvyuq12MP0biA6', 'user', 0, '2025-10-21 01:19:33', '2025-10-21 01:19:33');
INSERT INTO `identity` VALUES (109, '506aa06eeb', '$2a$10$LX5Ly/sYA5yic9DXfcYUcOhJZ9Gz90crjvlnLuAjXzE/hl5Hd3iz2', 'user', 0, '2025-10-21 01:35:30', '2025-10-21 01:35:30');
INSERT INTO `identity` VALUES (110, '506aa06eeba', '$2a$10$ScqSeh6fGroXZyeuJ5ig5euRP25XJ9bDjD4tjHGkL/jxMkLxtdB.m', 'user', 0, '2025-10-21 01:35:44', '2025-10-21 01:35:44');
INSERT INTO `identity` VALUES (111, '8ac2217607', '$2a$10$0bJ4gnI76360JNTClmDeSefMdkmpDAhQpBE1IYbc2Ou8FLw5bFjn2', 'user', 0, '2025-10-21 01:39:40', '2025-10-21 01:39:40');
INSERT INTO `identity` VALUES (112, 'XbHika', '$2a$10$lQaLZZcucsLFLOkiLLl4CuuifWrD8DyrV3wANG2QaOJuvamx5jdCW', 'user', 0, '2025-10-21 02:23:49', '2025-10-21 02:23:49');
INSERT INTO `identity` VALUES (113, 'Syrusleet', '$2a$10$kx2w/ENDjJvFaSXLysAkLOHpYZQOgfPr9GKJLCkN.vGVdFgyg4HMG', 'user', 0, '2025-10-21 02:31:47', '2025-10-21 02:31:47');
INSERT INTO `identity` VALUES (114, 'test', '$2a$10$eSCjggB2i9UWPnRrjXTxfujo/Z3313YQ3JBYcCS9.nhPVb3MJpW2i', 'user', 0, '2025-10-21 03:00:25', '2025-10-21 03:00:25');
INSERT INTO `identity` VALUES (115, 'KnQine', '$2a$10$7dKNN0csYJP67Y2rfK67vOAHqqljuiZfEm.qKq0nFovWmVMAjipGq', 'user', 0, '2025-10-21 03:08:50', '2025-10-21 03:08:50');
INSERT INTO `identity` VALUES (116, '叱咤月海鱼鱼猫', '$2a$10$pQm5cV0mh8aVChLKAZMQGOoCpz27BGt3NRH24DV1A2iBQtWBu9p7C', 'user', 0, '2025-10-21 03:19:38', '2025-10-21 03:19:38');
INSERT INTO `identity` VALUES (117, '249', '$2a$10$7tOJPP16jiS.O0U0DSfEXuYeAXRNOMoNa9n6TCE4xMjJwcbKYZbb2', 'user', 0, '2025-10-21 03:29:44', '2025-10-21 03:29:44');
INSERT INTO `identity` VALUES (118, 'Strico', '$2a$10$bqLa..hbWtmjZ/whFxjXIOWTrPVsBP/tT8.YgvMKwmqOcL1Di4FM2', 'user', 0, '2025-10-21 06:23:46', '2025-10-21 06:23:46');
INSERT INTO `identity` VALUES (119, 'Yuntian', '$2a$10$EYDjqNtYSTAoSigPqQi/cOSaG7AWjcQBCkHM907SuWe/4scE4fSw6', 'user', 0, '2025-10-21 08:11:02', '2025-10-21 08:11:02');
INSERT INTO `identity` VALUES (120, 'Yamada_6', '$2a$10$mcKsybLUkdzos2eqPRv4VuvsrVjW52rWjsvMzmPluDt1gGXNnZxsu', 'admin', 0, '2025-10-21 08:48:29', '2026-01-19 20:24:13');
INSERT INTO `identity` VALUES (121, 'illuminax', '$2a$10$Y3rYhB7u.aaNPiulKwZhOe2UY0g.fNLuu7zWRdro11gpjkhlSWyFG', 'user', 0, '2025-10-21 09:17:48', '2025-10-21 09:17:48');
INSERT INTO `identity` VALUES (122, 'Eureka', '$2a$10$KoObruHZ3/ZsxePxTNHp/.JGdHG9yE0CjDIZO5RYVcmbZ3rRq60Xa', 'user', 0, '2025-10-21 10:19:04', '2025-10-21 10:19:04');
INSERT INTO `identity` VALUES (123, 'cccccyu', '$2a$10$UKCS29U6QeeN0d3zMrXo/uq.Yzzxmtngvs8k92asrHuFMuMtKfdzu', 'user', 0, '2025-10-21 11:54:56', '2025-10-21 11:54:56');
INSERT INTO `identity` VALUES (124, '_XJR_', '$2a$10$l4EQ10fmGkp7xZWaiIyhx.WRXUPG6kOkBsvepfCtVAaGIMdL6osdO', 'user', 0, '2025-10-21 12:18:22', '2025-10-21 12:18:22');
INSERT INTO `identity` VALUES (125, 'm8out', '$2a$10$eXqZ.aLZCKq5PzVY71P8SewoJr1MgZpAqIarAZsAojbsfg3kWLWcO', 'user', 0, '2025-10-22 07:02:14', '2025-10-22 07:02:14');
INSERT INTO `identity` VALUES (126, 'XCCode', '$2a$10$3Dj0fOa9BVC4.7DTbLLc4u9EjbWZ7BVED5dQRdJNyUI2tR0a106ee', 'user', 0, '2025-10-22 07:03:51', '2025-10-22 07:03:51');
INSERT INTO `identity` VALUES (127, 'guest', '$2a$10$L8SwThsvxkR9lApY5y9CVuvlc.UjdQTZR7S2rLFNZJT.M8zS91vpK', 'user', 0, '2025-10-22 07:04:57', '2025-10-22 07:04:57');
INSERT INTO `identity` VALUES (128, 'll993675730', '$2a$10$UgLdyLHsK3QUELzz8BxByO4zqLdMiYHUHo3GSudm3z1/HYJFPnZ8G', 'user', 0, '2025-10-22 07:08:06', '2025-10-22 07:08:06');
INSERT INTO `identity` VALUES (129, 'Cikasy10', '$2a$10$9PGJZVrFWJ8xe0ALlRnAwu6ELhgaD9U.G9gFbO27K6lz8rLHjbbrK', 'admin', 0, '2025-10-22 07:09:20', '2025-12-11 20:51:30');
INSERT INTO `identity` VALUES (130, 'labulazz', '$2a$10$WiS8zuJvheqc.9S17EfPyOQmfxVuWnbAlIlwgSsF/tzoOm4XV4BT.', 'user', 0, '2025-10-22 07:13:48', '2025-10-22 07:13:48');
INSERT INTO `identity` VALUES (131, 'exploreren', '$2a$10$/0xwUHN6msR9xKlfxP9B5eVikgdhX3vDdCy/Q/hcRj5OIXJTpqQFi', 'user', 0, '2025-10-22 07:18:55', '2025-10-22 07:18:55');
INSERT INTO `identity` VALUES (132, 'K_Tairitsu', '$2a$10$BwTUkKgB2RqQSnSmieRfiuKU/USlQ9bAMOTHBmo56Kem5C.MY7DTq', 'user', 0, '2025-10-22 07:19:39', '2025-10-22 07:19:39');
INSERT INTO `identity` VALUES (133, 'nezzy000', '$2a$10$oITuJSkQxI9oXX4DVV4T7OX8m6RdQv8xnAZU.E782d7tappT6/Rea', 'user', 0, '2025-10-22 07:20:15', '2025-10-22 07:20:15');
INSERT INTO `identity` VALUES (134, '咕咕绝赞觅食', '$2a$10$NW2MgV8yZxYHI8a3lqgtZOeqTFQaTORmSUKGlX3Rsbj.9PBJ0v8dK', 'user', 0, '2025-10-22 07:22:55', '2025-10-22 07:22:55');
INSERT INTO `identity` VALUES (135, 'shyria', '$2a$10$pEh0nHUo.Br1XbZY3OSZdu7JZXl0lIC0ubXBAj2IbQrlweKsezDAy', 'user', 0, '2025-10-22 07:27:25', '2025-10-22 07:27:25');
INSERT INTO `identity` VALUES (136, 'Returnia', '$2a$10$262YIUuollRnIYM7iJqQkudjkSbLyz2xDOQyAcDCTvf3PaidERm7m', 'user', 0, '2025-10-22 07:44:14', '2025-10-22 07:44:14');
INSERT INTO `identity` VALUES (137, 'xinr0', '$2a$10$dY3hmLEt4F9P4hu5mWOTMed2O/5Me7niKiZGHXiIQNR4WzMigwlJS', 'user', 0, '2025-10-22 07:56:58', '2025-10-22 07:56:58');
INSERT INTO `identity` VALUES (138, 'Cremecho', '$2a$10$xPbUTPMWb.5XclWCFzx57.S1EqAG11N7pB4MO38zo5V.qHJogZfgm', 'user', 0, '2025-10-22 08:01:50', '2025-10-22 08:01:50');
INSERT INTO `identity` VALUES (139, 'Misoile', '$2a$10$0XKxaOCy/jPcxyRRXHlY4e19jffwK8xctCXyA9ooLn6I.1O1G1Hsq', 'user', 0, '2025-10-22 08:12:41', '2025-10-22 08:12:41');
INSERT INTO `identity` VALUES (140, 'Xxztztt', '$2a$10$.LLXO.aIeSxHz7RIaNW2C.GcmsJOEF/cT6oXKXYzffA88IWAgIgnO', 'user', 0, '2025-10-22 09:02:07', '2025-10-22 09:02:07');
INSERT INTO `identity` VALUES (141, 'BEN_BLACK', '$2a$10$5AywqjWHyGq.Mp.MuF9gKusmwgYQg7yCIIrRnm035GydP0yG4.m7q', 'user', 0, '2025-10-22 09:18:45', '2025-10-22 09:18:45');
INSERT INTO `identity` VALUES (142, 'VanPasta_Jam', '$2a$10$ACVRWFEl/PhRJSycHCFeDO1XDjZcUKkBaJyFIDF1DkT.6sAGxC2BK', 'user', 0, '2025-10-22 11:55:11', '2025-10-22 11:55:11');
INSERT INTO `identity` VALUES (143, 'Hyscere', '$2a$10$vIGHOS8NNFz0ttnq7Vd5DekFEz4sLlu7FIWbBiTGrwuCr1jjMmsUC', 'user', 0, '2025-10-22 12:04:37', '2025-10-22 12:04:37');
INSERT INTO `identity` VALUES (144, 'Witheredines', '$2a$10$Kbf9.MSICH3ANIAZ1dX0auhZPMQ1RZ1SgURf8Y1wSQ.cuykVcizuK', 'user', 0, '2025-10-22 13:00:36', '2025-10-22 13:00:36');
INSERT INTO `identity` VALUES (145, 'IMRIS', '$2a$10$befNEK7a9veRf9V.oJBFu.sAzOPCEVh5aAqnrUpTVnEJku2yVd7Jq', 'user', 0, '2025-10-22 15:26:08', '2025-10-22 15:26:08');
INSERT INTO `identity` VALUES (146, 'calvin0ali', '$2a$10$W7Ylh/ajdyKDDjw3z.UZA.DVl8v6Ow520/iwRjYEHJ3QOroBEI1Ne', 'user', 0, '2025-10-23 01:02:39', '2025-10-23 01:02:39');
INSERT INTO `identity` VALUES (147, 'kagome-kagome', '$2a$10$DPgK6MUkjJ4cWPQGmKuNUO2Uzcwyx1K7JWtrFi9Q4.2b2EH4iBxw.', 'user', 0, '2025-10-23 08:03:01', '2025-10-23 08:03:01');
INSERT INTO `identity` VALUES (148, 'Ying_ZH', '$2a$10$U1jJp8ZG8bbqAlQDLv6aBejpFdCjAGkYLaiv1a1ZrcP4XplVWERHW', 'user', 0, '2025-10-23 09:09:41', '2025-10-23 09:09:41');
INSERT INTO `identity` VALUES (149, 'akariza', '$2a$10$9WWvks.9zCDVa9WPOr42E.hyAqjmfElZWEuwkSeJawxet5xFdVlxa', 'user', 0, '2025-10-23 09:10:23', '2025-10-23 09:10:23');
INSERT INTO `identity` VALUES (150, 'npy', '$2a$10$cdEJmhGkHloZdKwAbBJSwOjMc.zEOt5Moo.htG5Qx89tkLLs2B8aG', 'user', 0, '2025-10-23 13:30:48', '2025-10-23 13:30:48');
INSERT INTO `identity` VALUES (151, 'mao', '$2a$10$DzbmjsGoporfvCWdGY9PQuBb5jzR/chRZA9EfTCkYHrz8IkbstNo6', 'user', 0, '2025-10-24 15:28:58', '2025-10-24 15:28:58');
INSERT INTO `identity` VALUES (152, 'uytc', '$2a$10$iTfZsP9exucG3C08Y5V0Yu/1ZAQSbnskhkEtsY4jjWdLKQwxrOFNi', 'user', 0, '2025-10-25 04:22:07', '2025-10-25 04:22:07');
INSERT INTO `identity` VALUES (153, 'killa', '$2a$10$z1XCw6DXwhbjjpOupLc0J.YiGP40RlO29P49c.omxJ/HHYr72Mzme', 'user', 0, '2025-10-26 05:53:32', '2025-10-26 05:53:32');
INSERT INTO `identity` VALUES (154, 'erica', '$2a$10$K6lInU/pQcQX/k.H3QOTx.tbD7.xxPSZ1M6Zgd5kQGJeHFIoV5sEG', 'user', 0, '2025-10-28 08:30:57', '2025-10-28 08:30:57');
INSERT INTO `identity` VALUES (155, 'BMaTriX', '$2a$10$5x/dUbXi98jIlhgYvx9yguIe3Nxp/n8Ehq0AgiJ7lnv9hMm7rfJhC', 'user', 0, '2025-10-28 15:43:04', '2025-10-28 15:43:04');
INSERT INTO `identity` VALUES (156, 'ichq', '$2a$10$3pd2gvWz0/A153ToEVTxoO/R9FEBgQmD/NdtQ6RjVqSqnYiU64iBy', 'user', 0, '2025-10-28 15:56:12', '2025-10-28 15:56:12');
INSERT INTO `identity` VALUES (157, 'KiRASSS', '$2a$10$BvagWqjhWkEMIxX4Z5SPzuXLGmOr0ZZTujcpgJkbej.dGqQX3nfgi', 'user', 0, '2025-10-29 00:38:04', '2025-10-29 00:38:04');
INSERT INTO `identity` VALUES (158, 'abccbanba', '$2a$10$dbsKzxkGBJM6efT.IIR/J.z/0GoaO73pUQeviVOFDQ0WEJyWsObsy', 'user', 0, '2025-10-29 03:42:10', '2025-10-29 03:42:10');
INSERT INTO `identity` VALUES (159, 'feint', '$2a$10$8BvQ.Xrt9nkhSZjNGviWFuoiIIoOvmnPScuR3KppH//C2YJZXS50i', 'user', 0, '2025-10-29 03:46:39', '2025-10-29 03:46:39');
INSERT INTO `identity` VALUES (161, 'heike', '$2a$10$A5WG6We5TnmGtZddOBkr.u8Sxa59tPSTmyPs2SYIaTNdEiklhi7Xq', 'user', 0, '2025-10-29 07:01:01', '2025-10-29 07:01:01');
INSERT INTO `identity` VALUES (162, 'Suzuran', '$2a$10$SavRWzDGta6SEFc2gabP9en9Qyf2OXymCia6ZDJPRlF4NovmwGKlG', 'user', 0, '2025-10-29 10:34:42', '2025-10-29 10:34:42');
INSERT INTO `identity` VALUES (163, 'Do~', '$2a$10$6J.169F0eidft/XU/E6OceQT.qtNpJ.BudLwg3CYIhCHH3p89mMhm', 'user', 0, '2025-10-30 12:52:14', '2025-10-30 12:52:14');
INSERT INTO `identity` VALUES (164, 'nongh123', '$2a$10$MLwivp1g8RKQPqojHDOI..hROiOUHokfR.9G1JlqY5.l5G1ukKU/.', 'user', 0, '2025-10-30 13:57:30', '2025-10-30 13:57:30');
INSERT INTO `identity` VALUES (165, 'khronicle', '$2a$10$zheO9t1YLSt0XVGQfOMNOO83KN.4Ya7gDC6RaPX5j66vxitq1ZM8a', 'user', 0, '2025-10-31 06:57:14', '2025-10-31 06:57:14');
INSERT INTO `identity` VALUES (166, '荷珀TvT', '$2a$10$VYRL/eQx2CZ8Bzq0jRDYpeanIpieYdIUfg789uiK6iQ9T7gCMcCsm', 'user', 0, '2025-11-01 05:19:19', '2025-11-01 05:19:19');
INSERT INTO `identity` VALUES (167, '2025120905024', '$2a$10$plkjqF0BRMtCttKU9dtYaObGUx5I0iJzALPgQK558B5YTeLGySuf6', 'user', 0, '2025-11-10 15:36:23', '2025-11-10 15:36:23');
INSERT INTO `identity` VALUES (168, 'lzw', '$2a$10$Q1UGhVRpuwgtYDcJ.5SzxOAN/AH6EEm5Hkjxhg5SUOigCv8.aoawC', 'user', 0, '2025-11-11 07:06:03', '2025-11-11 07:06:03');
INSERT INTO `identity` VALUES (169, 'hikari', '$2a$10$bn7uwR8lL7ONbyzR8U4zU.qnrlmFH/DpcsRf.gf2COUqNbA01/rda', 'user', 0, '2025-11-26 13:26:01', '2025-11-26 13:26:01');
INSERT INTO `identity` VALUES (170, 'Waht???', '$2a$10$2.otB0jWs5xP5HKHp5o0seLNnX7xUq5ZdfQvLZVOPX2sgxOUFeIP.', 'user', 0, '2025-11-26 14:35:28', '2025-11-26 14:35:28');
INSERT INTO `identity` VALUES (171, '太微423', '$2a$10$.az93qTl834DG14XuiZ..uYs2Xsvd8DfJGkqr6/V43zysfCiQSrNu', 'user', 0, '2025-11-30 02:41:56', '2025-11-30 02:41:56');
INSERT INTO `identity` VALUES (172, 'Diolok', '$2a$10$gOGRNcPZQR9NX9gC0Y9ckOzqzFixtYNWuRb2y6lwjNKmQt87a7cOC', 'user', 0, '2025-11-30 05:10:55', '2025-11-30 05:10:55');
INSERT INTO `identity` VALUES (174, 'Πρωτεῖοι', '$2a$10$aBLKXeCTt.Wlb9BVVcAc7OLr6s2JmhperSI4lrXchrKZ9kW86GBq.', 'user', 0, '2026-01-10 11:30:05', '2026-01-10 11:30:05');
INSERT INTO `identity` VALUES (175, 'LotuX', '$2a$10$YMIOJe6xJELiAmBwkP5Iwe7xpFveG/1ctkINUcJdgdfTpolcTV8uG', 'user', 0, '2026-01-10 14:45:56', '2026-01-10 14:45:56');
INSERT INTO `identity` VALUES (176, '892721865', '$2a$10$qznWul8eYwLAoKUqPLZEUuZ6vffZaDcgcbKX2QhH6vq.2yFwXLH1W', 'user', 0, '2026-01-10 15:34:08', '2026-01-10 15:34:08');
INSERT INTO `identity` VALUES (177, 'DustYanX', '$2a$10$UZQUni9hp/YMV9X7LZtxkelZp06BuHewausxs25G7tmOD.EF6jtsK', 'admin', 0, '2026-01-16 03:49:54', '2026-01-19 20:24:31');
INSERT INTO `identity` VALUES (178, 'ccc', '$2a$10$y95R6fAdAA5kVGqpYz6J2ekatkRW2wyopIaqIPEH8idhMHaJSjhcG', 'user', 0, '2026-01-16 06:16:12', '2026-01-16 06:16:12');
INSERT INTO `identity` VALUES (179, 'Powerless233', '$2a$10$gOKB7l1FLQRBUENmyymrq.ujAPJB4OhkwIQ62cv/wpTd1VA74d5tW', 'admin', 0, '2026-01-16 08:04:06', '2026-01-21 00:17:27');
INSERT INTO `identity` VALUES (180, 'yidatuoovo', '$2a$10$I7NvCGR7yIQ95.I4X3w0MuLDDZCO8.Qss25cYFQITkuT2I4fEtAK6', 'user', 0, '2026-01-17 07:26:10', '2026-01-17 07:26:10');
INSERT INTO `identity` VALUES (181, 'Yurir1', '$2a$10$Otzrx4wZ5UkdwvgBM9tvBed.5Qlyr0K0dlkPYy8p1ucR2pGwrAequ', 'user', 0, '2026-01-17 07:27:51', '2026-01-17 07:27:51');
INSERT INTO `identity` VALUES (182, 'cdlmyxs', '$2a$10$U2WOm63m0LmMLYNmGFG.qOUPRaIxOvYmHveGWMdQVZ7UNU792O2uO', 'admin', 0, '2026-01-17 12:28:56', '2026-01-19 20:24:27');
INSERT INTO `identity` VALUES (183, '郁金花', '$2a$10$cgCa1ORubkN3Wt0rZ2JgkeNEJi7g0YmbFps7qpHKB95b2iLArb/vG', 'user', 0, '2026-01-17 14:36:39', '2026-01-17 14:36:39');
INSERT INTO `identity` VALUES (184, 'TangSHLi17', '$2a$10$03zRhc5nBQ55TghFtvbTZ.xkkPsz0TSrgqeWc77s4CBuEjnAumuWu', 'user', 0, '2026-01-17 14:50:46', '2026-01-17 14:50:46');
INSERT INTO `identity` VALUES (185, 'astesia', '$2a$10$65fJ14QBjoMoPrUb/Htipu7sVBe5EGfrlc8vOwQ6PsCd7cciktfny', 'user', 0, '2026-01-17 15:31:09', '2026-01-17 15:31:09');
INSERT INTO `identity` VALUES (186, 'YuanyuYY', '$2a$10$mYdReQuHUyUp1V.c94s2U.fra41sTky7Vhj69uIWBNHJ6b/W3WWji', 'user', 0, '2026-01-17 15:33:18', '2026-01-17 15:33:18');
INSERT INTO `identity` VALUES (187, 'user0117', '$2a$10$HgROMDlwIkXvVSCN/iCpi.g77Vj9n/BcTzJ.rSzK0A6aR9J3sq0eC', 'user', 0, '2026-01-17 15:34:53', '2026-01-17 15:34:53');
INSERT INTO `identity` VALUES (188, 'Ayanami Rei', '$2a$10$.liDljUnRVc8ABqIoFdUN.dNFdbQmzsA/vbB15bzTPNbA8qu44W9q', 'user', 0, '2026-01-17 15:41:08', '2026-01-17 15:41:08');
INSERT INTO `identity` VALUES (189, 'wrenbutler', '$2a$10$nzp.rRLRRbFWQa.ia5LHMuR1dMWoLN.ozVGmPX8QDcAb3m/vPCodu', 'user', 0, '2026-01-17 15:58:29', '2026-01-17 15:58:29');
INSERT INTO `identity` VALUES (190, 'K4bolt', '$2a$10$sM2A8FfAG8oz2xN/3sEFI.LgiJ3XBA/L0jX6js.uQFcE3nPYw4klG', 'user', 0, '2026-01-17 17:24:31', '2026-01-17 17:24:31');
INSERT INTO `identity` VALUES (191, 'nenecute', '$2a$10$L8NNBWREVCX1aPRouL0Mcueb52cqe/OySKs3czA2h220i04Pt57Ji', 'user', 0, '2026-01-18 00:39:29', '2026-01-18 00:39:29');
INSERT INTO `identity` VALUES (192, 'fell75', '$2a$10$egA9ooX8omoHjrO1ukDpL.2YEBuFoa2.p5Emt5Ppb.P/pG4M/HWPu', 'user', 0, '2026-01-18 03:33:25', '2026-01-18 03:33:25');
INSERT INTO `identity` VALUES (193, 'Loadinglol', '$2a$10$lOqYknohS6efk/q79Mv2RO5/69dm8a7GuiHXtjE0UKq3q7zUiBgmS', 'user', 0, '2026-01-18 10:48:53', '2026-01-18 10:48:53');
INSERT INTO `identity` VALUES (194, 'kirito丶0', '$2a$10$xIKlbQcUJeIqp5.rF.fn6Oa.OspHUEcDG1w9iXpsc3dV5fyKeFiAG', 'user', 0, '2026-01-18 17:53:27', '2026-01-18 17:53:27');
INSERT INTO `identity` VALUES (195, 'sjzdSakura', '$2a$10$qFBZZ/L6kBDiCL7nC6U7huuj4hwfecVtZS75ViDjAQqsMyFt0qJUe', 'user', 0, '2026-01-19 05:40:50', '2026-01-19 05:40:50');
INSERT INTO `identity` VALUES (196, 'Admin_2025', '$2a$10$pwEeoU93CvINeNv60j8b5.59xTqovm00H5AxgjjLCRIZoOSvkvJFq', 'user', 0, '2026-01-19 12:59:51', '2026-01-19 12:59:51');
INSERT INTO `identity` VALUES (197, 'Kori', '$2a$10$0DqLnTa295DpUXbJC/QjwuVFb6QeL96XFnOfFw9Y/dUUqlf0gD6IO', 'user', 0, '2026-01-20 10:16:56', '2026-01-20 10:16:56');
INSERT INTO `identity` VALUES (198, 'chenlandayo', '$2a$10$MFP5LqAmU1uV6G097wBAz.Z7kIjE04smwPc81coCKY3SWyySt9S4G', 'user', 0, '2026-01-20 10:43:17', '2026-01-20 10:43:17');
INSERT INTO `identity` VALUES (199, 'Kita1kuYo', '$2a$10$yG.zQsj0GADTUep2uswFFeAYYodc.qfiuEc3Rv9sk9capimNI1cwm', 'admin', 0, '2026-01-20 16:16:42', '2026-02-06 21:35:59');
INSERT INTO `identity` VALUES (200, 'MTP', '$2a$10$NjjBsmnXkkB2BPdfLq9YSuDSwU9EvUIHOdbBcBgfs3bJDdvxIEDte', 'user', 0, '2026-01-23 06:10:39', '2026-01-23 06:10:39');
INSERT INTO `identity` VALUES (201, 'lyrith368', '$2a$10$j4lmwsS7k3SzUPHeeXbaruXBOkrLYTTtjvn.1RoEytIiPudxflqo2', 'user', 0, '2026-01-26 12:19:08', '2026-01-26 12:19:08');
INSERT INTO `identity` VALUES (202, 'fumo', '$2a$10$SMR8XlFlHH62nnsgseWV0ukhvP43uLmImzbLi3idb9/3sZzjIP4Au', 'user', 0, '2026-02-06 13:48:03', '2026-02-06 13:48:03');
INSERT INTO `identity` VALUES (203, 'duodedaoli', '$2a$10$WIlsoSRuTnUp7vNWQHlAR.NKUZidFiCxmVgHYDBjeVlLySjdhUmJe', 'user', 0, '2026-02-06 13:51:01', '2026-02-06 13:51:01');
INSERT INTO `identity` VALUES (204, 'Re_&amp;+', '$2a$10$FyaVvttmBojXxPU8uAgDL.PM1ixHVI5zqV94m4XSU8DSzgjcnricu', 'user', 0, '2026-02-07 03:30:24', '2026-02-07 03:30:24');
INSERT INTO `identity` VALUES (205, '晓山瑞希', '$2a$10$KbPpfsHvSJx9qT7SZh6lB.lSjdQygC7Cx6JjMnNidphE.a6td250q', 'user', 0, '2026-02-08 07:51:33', '2026-02-08 07:51:33');
INSERT INTO `identity` VALUES (206, 'Qtest', '$2a$10$1HlmYfMVi61FF2AdsXel8OEFtN5ffxlCzwQR4Pu2MFYuJN4ut2mRu', 'user', 0, '2026-02-19 02:40:10', '2026-02-19 02:40:10');
INSERT INTO `identity` VALUES (207, 'him', '$2a$10$LADXhRaHB7Njl/84Xt13CeHZ09vY.60iGzT98hl37LhcWPVUqmiv2', 'user', 0, '2026-03-16 05:13:33', '2026-03-16 05:13:33');
INSERT INTO `identity` VALUES (208, 'Eternity', '$2a$10$axKjsceJx8C5KZFMIknJ9OxdNWynOLxsiZ3J5vsu.qmV2SU8tpqsy', 'user', 0, '2026-03-16 05:15:29', '2026-03-16 05:15:29');
INSERT INTO `identity` VALUES (209, 'koifish', '$2a$10$jFblVSwnCf4QzSqBhRWvSug67r7Da1YNXg.VQLpBKmExvNKyj//Pq', 'user', 0, '2026-03-16 06:32:45', '2026-03-16 06:32:45');
INSERT INTO `identity` VALUES (210, 'test2', '$2a$10$raNBXfR7xWhUOolZecMsJ.9lIZ4RlU0Luz/UN6RiXc/ONQEFYaqU6', 'user', 0, '2026-03-17 07:54:15', '2026-03-17 07:54:15');
INSERT INTO `identity` VALUES (211, '7onix', '$2a$10$IBdXC6u17sFT5Exdg5Z4kufiBcnyhD7FAbudoY4.GVdkowC/eKtIy', 'user', 0, '2026-03-17 10:09:20', '2026-03-17 10:09:20');
INSERT INTO `identity` VALUES (212, 'HugoGUYU', '$2a$10$yiuWzmXxpX9tqH0csgCbwe1LxsbONnOSRPm/PhMHlQgUIdgozcI.y', 'user', 0, '2026-03-24 11:16:53', '2026-03-24 11:16:53');
INSERT INTO `identity` VALUES (213, 'jjnzs520', '$2a$10$l2oucgDd7dx4ZHgakUkkqed1V/KtuCcLI1ZgsMuegFAj5Ap5JBw1G', 'user', 0, '2026-03-24 11:17:34', '2026-03-24 11:17:34');
INSERT INTO `identity` VALUES (214, 'madeself', '$2a$10$NoHDDWn1uzvucw.zabg.a.ao3jmQjinHDx/r4kKRh441tuxM38PH2', 'user', 0, '2026-03-24 11:17:43', '2026-03-24 11:17:43');
INSERT INTO `identity` VALUES (215, 'bbbshw', '$2a$10$ssA16K7jyI47mqktvSsd/uxNp2SEkCZOlyZ2GQf.0h3tX9G/hHfQu', 'user', 0, '2026-03-24 11:17:47', '2026-03-24 11:17:47');
INSERT INTO `identity` VALUES (216, 'saturn', '$2a$10$sI5czgKe7c6LUpIgUB36NOzvxQf4W4v4DGjj580hufTSlhNjA.Idm', 'user', 0, '2026-03-24 11:18:12', '2026-03-24 11:18:12');
INSERT INTO `identity` VALUES (217, 'iceblock', '$2a$10$8zI8r5ITJzeKrP8cISdnyuQj7mWsg8KApLOlTbQlfYWSZXP8Ojajq', 'user', 0, '2026-03-24 11:19:04', '2026-03-24 11:19:04');
INSERT INTO `identity` VALUES (218, 'JGX', '$2a$10$4paTA9YX5sq6YP6UgdJAiO3X0SpcZDyHLk0TLFC8QZEwp8MUACmn6', 'user', 0, '2026-03-24 11:19:06', '2026-03-24 11:19:06');
INSERT INTO `identity` VALUES (219, 'agaric', '$2a$10$gz0Glbw0CcM7Behm1cdkNej9X7YcvT3KS84TpWDtzVIP5VKwM49eu', 'user', 0, '2026-03-24 11:19:16', '2026-03-24 11:19:16');
INSERT INTO `identity` VALUES (220, 'tianchen', '$2a$10$n.k2kRk8gZDEp9BUqiLERe4a.dQh6dlBHwXu8ug.6/NqzSOs7MWxO', 'user', 0, '2026-03-24 11:20:14', '2026-03-24 11:20:14');
INSERT INTO `identity` VALUES (221, 'EroDeDFall', '$2a$10$clWuWUSXp4VU9R9pDhsBaO/DVBUkg/LWk1lYyNrhB/yrhoRIhMFdG', 'user', 0, '2026-03-24 11:20:34', '2026-03-24 11:20:34');
INSERT INTO `identity` VALUES (222, '阿言真不会', '$2a$10$Uu/yTuqu3ZoJP1zZvARUduSdDLitM4qyfqMk7Y.k79SV4Ymz3MYTG', 'user', 0, '2026-03-24 11:21:00', '2026-03-24 11:21:00');
INSERT INTO `identity` VALUES (223, 'Bocchi', '$2a$10$bJuTh8RraLoneBws/b.Ewe99TwxD9dRPlgoP1RIzPT1Hsb2wsYvUi', 'user', 0, '2026-03-24 11:22:42', '2026-03-24 11:22:42');
INSERT INTO `identity` VALUES (224, 'stpb', '$2a$10$Wm9qmrBWEosVpZ45Tfe1/uY6Mdk5CNduWY/7WzL/w1Rkwv13.snOu', 'user', 0, '2026-03-24 11:30:56', '2026-03-24 11:30:56');
INSERT INTO `identity` VALUES (225, 'itz小柴柴', '$2a$10$8dbrwtgRoj4Jk02ALONIguzX0wkzM/NdEoSftzbWuTv9KSqQRwpTO', 'user', 0, '2026-03-24 11:31:15', '2026-03-24 11:31:15');
INSERT INTO `identity` VALUES (226, 'LowenAtkinson', '$2a$10$Z192biUEUvcdNqTr5t/mGempc3.170xxkNAk.s1.v.n6XO0T2egW2', 'user', 0, '2026-03-24 11:34:21', '2026-03-24 11:34:21');
INSERT INTO `identity` VALUES (227, 'marisa', '$2a$10$vW63q/DTcTovRR3TjLSjQeN5qmQVf5mVyFtEH/C9gUpUF3fVOWp6m', 'user', 0, '2026-03-24 12:07:31', '2026-03-24 12:07:31');
INSERT INTO `identity` VALUES (228, 'Floursh', '$2a$10$zV075lS3sCnQWPOPEPyUluxFhykcikteG/DFGRXuL2AovP4u42v7q', 'user', 0, '2026-03-24 12:14:36', '2026-03-24 12:14:36');
INSERT INTO `identity` VALUES (229, 'Dakota', '$2a$10$quDCL7BaXtWug9ZYft8Mw.2Xkk95hw4iqJvyOYVYcQlwQQDxi1fqq', 'user', 0, '2026-03-24 13:49:16', '2026-03-24 13:49:16');
INSERT INTO `identity` VALUES (230, 'Vak', '$2a$10$smQHU7g5C4lLzSkmFXbbjeioZnPozWYUYrWsautHgTlsfa5z47bJC', 'user', 0, '2026-03-27 18:51:40', '2026-03-27 18:51:40');
INSERT INTO `identity` VALUES (231, 'Battery', '$2a$10$J7tII93Hc79F//cTqf4vJ.vfPiSlQb6yuIaCoNBXFK6ef6TkwUjj.', 'user', 0, '2026-03-27 22:23:46', '2026-03-27 22:23:46');
INSERT INTO `identity` VALUES (232, 'EmaTV', '$2a$10$q.Yt2wER.sJNY5OARoLhmOzOUhZBABPaaWVMynTRDMSXNGoa1ySXG', 'user', 0, '2026-03-28 10:12:10', '2026-03-28 10:12:10');
INSERT INTO `identity` VALUES (233, '烛江127', '$2a$10$hC7yDaOxOEyrn5g4BnMby.ep0OoXZ6gLqugOf4111q/puh21gn/Y.', 'user', 0, '2026-03-28 10:12:52', '2026-03-28 10:12:52');
INSERT INTO `identity` VALUES (234, '阿言a', '$2a$10$c9kC/V0rvnR19JgtjxVzeeNXJx7MscCioA1m3zUBwAx7UYt36gLCK', 'user', 0, '2026-03-28 10:15:08', '2026-03-28 10:15:08');
INSERT INTO `identity` VALUES (235, '星麓Ronin', '$2a$10$q6Sdd8PwEcysfMoOf1ZdBuJ7Kq8U/Sa88V2balS/D0o83IPW7XKi2', 'user', 0, '2026-03-28 11:32:59', '2026-03-28 11:32:59');
INSERT INTO `identity` VALUES (236, 'hansoner', '$2a$10$FIuWb9NXNTJIQzEKCACnS.ws32S7gYAKFaMkwFUcY8OHW0.eHIpK6', 'user', 0, '2026-04-02 15:03:34', '2026-04-02 15:03:34');

-- ----------------------------
-- Table structure for issue
-- ----------------------------
DROP TABLE IF EXISTS `issue`;
CREATE TABLE `issue`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `course_id` int NULL DEFAULT NULL,
  `image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `text` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '题目描述（必须）',
  `file` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '如果需要文件存储（备用）',
  `song_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '曲目名称',
  `issue_id` int NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_issue_course_issue`(`course_id` ASC, `issue_id` ASC) USING BTREE,
  INDEX `issue_id`(`issue_id` ASC) USING BTREE,
  CONSTRAINT `issue_course` FOREIGN KEY (`course_id`) REFERENCES `course` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 50 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '题目表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of issue
-- ----------------------------
INSERT INTO `issue` VALUES (13, 82, '/images/course/82/issue/485eef34-485e-4d35-a904-4f65379959b3.png', '中二节奏\n难度ULTIMA\n完成度ss\n10分', '', 'FLOWER', 1);
INSERT INTO `issue` VALUES (14, 82, '/images/course/82/issue/8a8b3e12-b751-43ea-94d6-4828809fda65.png', 'Project SEKAI\n难度APPTEND\n完成度clear\n10分', '', 'ヴァンパイア', 2);
INSERT INTO `issue` VALUES (15, 82, '/images/course/82/issue/292ae1fa-1d46-4956-b468-2d7c00634888.png', 'Arcaea\n难度BEYOND\n完成度9970000\n11分', '', 'Infinity Heaven', 3);
INSERT INTO `issue` VALUES (16, 82, '/images/course/82/issue/77191f71-5b7f-4091-a8c5-249e5a653fa2.png', '范式：起源\n难度REBOOOT\n完成度1007000\n11分', '', 'キミとボクへの葬送歌', 4);
INSERT INTO `issue` VALUES (17, 82, '/images/course/82/issue/5e0ed580-e296-4c82-8911-ae1f080e94f9.png', 'Phigros\n难度AT\n完成度acc99.9%\n12分', '', 'Ποσειδών', 5);
INSERT INTO `issue` VALUES (18, 82, '/images/course/82/issue/0ab7cee2-86f1-415c-bd19-18702cf29269.png', '舞萌DX\n难度Re:Master\n完成度100.5000\n12分', '', 'Beat of getting entangled', 6);
INSERT INTO `issue` VALUES (19, 83, '/images/course/83/issue/fca659d3-1d4c-4aa2-897c-8c5af699d590.JPG', '在水一方\n\n找到这个地方并拍摄图中的垃圾桶私信出题组成员以获取游玩信息吧', '', '卡', 1);
INSERT INTO `issue` VALUES (20, 83, '/images/course/83/issue/610a66f2-2145-4262-bbf5-68ace7a3e6f8.png', '神秘来电\n\nx11：你还记得之前音游社举办的你画我猜吗？\n孤芒星河：记得啊，群文件里面还有珍贵画作呢，我最喜欢里面的那首 [数据删除]，就在第 [数据删除] 页\nx11：等下你说啥？喂喂喂 （电话挂断）\n\n在本家游玩 [数据删除]', '', 'E', 3);
INSERT INTO `issue` VALUES (21, 83, '', '碳小环成都一日游\n\n小碳日记：今天早起从学校坐地铁堵门传说中的人北酷漫，吧唧一上午，下午去天府红抽通行证，晚上感觉左手有点痛去省医院检查出腱鞘炎了。再也不天天打舞萌了。（明天试试单手打舞萌）', '', 'O', 4);
INSERT INTO `issue` VALUES (22, 83, '/images/course/83/issue/2d499de1-a7a4-47da-90bd-5c1f12741e44.png', '垃圾分类\n\n找到这个地方并拍摄图中的垃圾桶私信出题组成员以获取游玩信息吧', '', 'N', 5);
INSERT INTO `issue` VALUES (23, 83, '/images/course/83/issue/c5df2ba9-2553-46c8-a3d5-df73dd858291.jpg', '谁知身心向何处\n\n.-- .... .- - -.. --- -.-- --- ..- -.- -. --- .-- .-- .... .- - -.. --- -.-- --- ..- .--. .-.. .- -.-- .-- .... .- - -.. --- -.-- --- ..- .-. . -- . -- -... . .-. .-- .... .- - -.. --- -.-- --- ..- .-.. --- ...- .', '', 'K', 2);
INSERT INTO `issue` VALUES (24, 83, '', '新手教程\n\n在新一种颜色开始闪耀时去变得熟练起来，做得好有奖励！\nps. 找脚力最好的两位向导', '', 'R', 6);
INSERT INTO `issue` VALUES (25, 83, '', '崩溃\n\n模拟结束，谢谢你的参与，愿我们在塔中重聚。\ntip：请提交崩溃报告', '', '二', 7);
INSERT INTO `issue` VALUES (26, 83, '/images/course/83/issue/dd42a51e-3c31-4615-8e31-96eeb4bc1af0.png', '578\n\n要求：提交相同图片（无裁剪）', '', 'S', 8);
INSERT INTO `issue` VALUES (27, 83, '', '拍一拍2\n\n游玩曲目：大河拍了拍比比，比比没有拍回去\n游玩方式：颜色变换后，你在她的笑容中退场', '', 'F', 9);
INSERT INTO `issue` VALUES (28, 83, '/images/course/83/issue/ea28e64f-5c41-4c9b-93d9-f84ecb0aee7e.jpeg', '穿越·轮回\n\n游玩曲目：\n戴着兜帽与白色面具，将冰冷的枪口指向了■的她\n无数次醒来，傀儡一般踏上的无尽轮回的她\n于建筑物顶端踏出一步、倒悬着向下坠落的她\n\n游玩方式：沿着「时间线」的脉络，再一次体验她的故事吧。。。与「她 」一同', '', '屁', 10);
INSERT INTO `issue` VALUES (29, 83, '', '印象色\n\n7d60bd\nfce6b5\n3f3f9f\n293078\n\n游玩方式：高人品', '', '股', 11);
INSERT INTO `issue` VALUES (30, 83, '/images/course/83/issue/33780979-c630-4d52-94ef-a4b064baa021.png', '来自父亲的隐藏谱面\n\n爸，不是隐藏谱面吗，这怎么碎成渣了？！！\n\n游玩方式：在缺失的谱面里找到爸爸的爱吧', '', 'T', 12);
INSERT INTO `issue` VALUES (31, 83, '', '魔法阵 \n建议完成八道题后再来尝试此题\n\n我们在其中不止一张bingo中隐藏了魔法阵的秘密', '/files/course/83/issue/53d923b7-bb5e-4fa6-9dc3-e7250cc839e8.json', NULL, 13);
INSERT INTO `issue` VALUES (32, 83, '', '扭曲/倒转\n\n游玩方式：音乐的变化，又是否亦如颜色上的变化呢', '/files/course/83/issue/41aabdbf-ec90-48fc-83fb-19773903c7ed.mp3', '舞', 14);
INSERT INTO `issue` VALUES (33, 83, '', '什 么？？？？\n\n已解析到该组图片汉字更深层次的数据标准......等等，这是\n什\n么          ？？？？？？？', '', 'C', 15);
INSERT INTO `issue` VALUES (34, 83, '/images/course/83/issue/94a95aa9-68a2-4007-b65b-2405b196dd61.png', '一同起舞\n\n〇\nv \\ ´\n ↱   \\\n\n游玩方式：将其余抛之脑后，一同起舞吧', '', 'Q', 16);
INSERT INTO `issue` VALUES (35, 83, '', '加。。加载中\n\n游玩曲目：卡顿。。。卡顿？！？！卡顿▼◄▲►▼◄▲►▼◄▲►▼◄▲►▼◄▲►\n\n游玩方式：因为太卡了所以你一个也没打上', '', '萌', 17);
INSERT INTO `issue` VALUES (36, 83, '', '混音错误？！？！？！\n\nMan! What can I say?\n这歌怎么糊到一起了，欸我去，这键怎么也糊到一起了。', '/files/course/83/issue/0290b1d9-2e17-4524-b334-baa38ea277eb.mp3', '阿', 18);
INSERT INTO `issue` VALUES (37, 83, '/images/course/83/issue/a29f6da4-07c7-4108-b6a3-79e1346eb77b.png', '大赛登记\n\n水土火风，正在记录所需歌曲。等下，这怎么有首歌消失了？！能不能帮我到他原来的地方找到这首歌', '', 'A', 19);
INSERT INTO `issue` VALUES (38, 83, '', '残酷的过去\n\n这是于悲痛中成长的故事。追寻林间温柔的声音，渴望自由的少女并未发现身后的小小足迹，更不知道那甜蜜的声音背后是恶魔的诡计，失去妹妹的少女在那夜握住妹妹的遗物哭泣，自那以后性情大变的少女成为了守护之骑。\n\n请为逝去的妹妹献上哀悼之花', '', '中', 20);
INSERT INTO `issue` VALUES (39, 83, '/images/course/83/issue/8dde6f66-3121-4aca-9e6b-5c45cf1d3051.png', '天马行空\n\n找到这个地方并拍摄图中的垃圾桶私信出题组成员以获取游玩信息吧', '', '伊', 21);
INSERT INTO `issue` VALUES (40, 83, '', '地狱之旅\n\n界破尘心开万象\n一川风月入清吟\n九霄龙啸凌云志\n方寸自知守初心\n平生以礼戒浮尘\n众所周知霜叶喜欢上课摸鱼看小说玩galgame看番，这几天他刚看了一本短篇小说，情不自禁吟诗一首\n\n游玩方式：从空中降下的垂怜终承不住罪业之重                   dawnlux眼中的bingo：ね，簡単でしょう?', '', '肉', 22);
INSERT INTO `issue` VALUES (41, 83, '', '？？？\n\n电科音游网站里好像出现了一些奇怪的东西？？？\n\n游玩方式：随机的曲绘之中可能藏有一些秘密，但是似乎有一些不变的东西', '', 'I', 23);
INSERT INTO `issue` VALUES (42, 83, '', '注意落石！！！\n\n“我说你啊，怎么这么大意？”\n“你是游客吧？‘注意落石’这一点不是旅游注意事项上的第一条吗？租船的时候没听服务员说明吗你？”——？？？\n“注意···落石？”——伊洛\n\n游玩方式：想要活下命来就尽可能躲避落石吧！', '', 'P', 24);
INSERT INTO `issue` VALUES (43, 83, '/images/course/83/issue/934cf7ea-8032-42a9-8f9e-7539ef073076.png', 'Only English\n\n找到这个地方并拍摄图中的垃圾桶私信出题组成员以获取游玩信息吧', '', 'Z', 25);
INSERT INTO `issue` VALUES (44, 86, '/images/course/86/issue/357c72eb-c0bb-408b-a575-204cc8b2c3ba.png', 'Rotaeno难度III Ex', '', 'Rush E', 1);
INSERT INTO `issue` VALUES (45, 86, '/images/course/86/issue/52351b9a-dce0-401d-9d94-f1e7ba3803c0.webp', 'DeemoHard难度acc>95%', '', 'Dream', 2);
INSERT INTO `issue` VALUES (46, 86, '/images/course/86/issue/5baf0c5d-f4e9-439d-bce4-6109524cc267.webp', 'Chunithm Master难度1006000', '', 'folern', 3);
INSERT INTO `issue` VALUES (47, 86, '/images/course/86/issue/8401bb0c-7d3e-41c8-bb54-2472b2792738.webp', 'Arcaea Ftr难度EX+', '', 'Loveless Dress', 4);
INSERT INTO `issue` VALUES (48, 86, '/images/course/86/issue/bfd5668e-0068-4f64-b334-b77451cdf11d.jpg', '范式起源 Massive难度1007500', '', 'Sense of Wonder', 5);
INSERT INTO `issue` VALUES (49, 86, '/images/course/86/issue/0f3e89ef-1056-4658-ad44-9932c0453128.jpg', '舞萌dx master难度100.5', '', 'Mjölnir', 6);

-- ----------------------------
-- Table structure for player
-- ----------------------------
DROP TABLE IF EXISTS `player`;
CREATE TABLE `player`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nickname` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `seat` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `ready` tinyint(1) NOT NULL DEFAULT 0,
  `card` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `room_id` bigint NULL DEFAULT NULL,
  `identity_id` int NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_room_id`(`room_id` ASC) USING BTREE,
  INDEX `idx_identity_id`(`identity_id` ASC) USING BTREE,
  CONSTRAINT `fk_player_identity` FOREIGN KEY (`identity_id`) REFERENCES `identity` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_player_room` FOREIGN KEY (`room_id`) REFERENCES `room` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 5 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of player
-- ----------------------------
INSERT INTO `player` VALUES (1, 'test', '东', 0, NULL, 1, NULL);
INSERT INTO `player` VALUES (2, 'test', '南', 0, NULL, 1, NULL);
INSERT INTO `player` VALUES (3, 'test', '西', 0, NULL, 1, NULL);
INSERT INTO `player` VALUES (4, 'test', '北', 0, NULL, 1, NULL);

-- ----------------------------
-- Table structure for profile
-- ----------------------------
DROP TABLE IF EXISTS `profile`;
CREATE TABLE `profile`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `avatar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '头衔',
  `identity_id` int NULL DEFAULT NULL,
  `status` int NULL DEFAULT NULL COMMENT '审核状态',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `id_identity`(`identity_id` ASC) USING BTREE,
  CONSTRAINT `id_identity` FOREIGN KEY (`identity_id`) REFERENCES `identity` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 59 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of profile
-- ----------------------------
INSERT INTO `profile` VALUES (4, '/avatars/00c494ad-dacc-4fed-9fc7-301ee49c47b1.', '澄如明镜，灼如烈火', NULL, 8, 1);
INSERT INTO `profile` VALUES (6, '/avatars/0019de53-89e3-4f35-8c3c-9cc78d5a4f01.png', 'neko!awa', NULL, 21, 1);
INSERT INTO `profile` VALUES (9, '/avatars/1b4cd4af-106a-48e1-b14c-009d8811d690.', '这里是社长', NULL, 35, 1);
INSERT INTO `profile` VALUES (10, '/avatars/bd3745e4-cbb6-4a43-bb5d-027fe069a0ef.jpg', 'taiyehu好帅口牙', NULL, 32, 1);
INSERT INTO `profile` VALUES (12, '/avatars/b6014072-b80d-42d2-af1b-d059ad5772d2.jpeg', 'seek. hinder. innocence.', NULL, 39, 1);
INSERT INTO `profile` VALUES (13, '/avatars/c0e377f9-fb22-4f3b-99c2-3d5b5189e27f.jpeg', '其实这是一个个签', NULL, 40, 1);
INSERT INTO `profile` VALUES (14, '/avatars/f71782ca-8d3e-415e-ad23-e96cbfd0e532.', '菜菜的', NULL, 37, 1);
INSERT INTO `profile` VALUES (15, '/avatars/14ca143a-f87b-412d-9ade-f9516cf44305.', 'frostleaf desuwa', NULL, 46, 1);
INSERT INTO `profile` VALUES (16, '/avatars/d9d2b69b-7010-4a04-96dc-2facd4a72d3f.', '请输入你的个性签名', NULL, 51, 1);
INSERT INTO `profile` VALUES (17, '/avatars/dc075203-9b56-4802-a1ac-3b02e7e07e7a.', 'arcaea真好玩', NULL, 29, 1);
INSERT INTO `profile` VALUES (18, '/avatars/6b40d189-53cc-4091-b0e1-aa0e8dd0c19b.jpg', '✌️✌️', NULL, 45, 1);
INSERT INTO `profile` VALUES (19, '/avatars/cab029bd-2add-4206-8976-b1a78a946e73.png', 'marisa1145', NULL, 56, 1);
INSERT INTO `profile` VALUES (20, '/avatars/1bf703d0-c291-4ea2-9c93-b7641d93a4f3.png', '人造ファイヤ ファイボワイパー', NULL, 76, 1);
INSERT INTO `profile` VALUES (21, '/avatars/0f626df2-035c-4dc9-9a6f-d763a7096735.png', '玩原神玩的', NULL, 105, 1);
INSERT INTO `profile` VALUES (22, '/avatars/2666a1bd-cb27-4b9d-a843-d8bba4dc4f37.', '藍月なくる推し', NULL, 126, 1);
INSERT INTO `profile` VALUES (23, '/avatars/5b197683-81b3-4842-97d2-3c1e285b6395.', '好想吃火锅', NULL, 129, 1);
INSERT INTO `profile` VALUES (24, '/avatars/9021bf51-db14-47ab-91ab-6f0bda367e8b.', '喵', NULL, 86, 1);
INSERT INTO `profile` VALUES (25, '/avatars/4521b00f-88be-4424-93b8-20c19cdaf088.', '超喜欢余', NULL, 52, 1);
INSERT INTO `profile` VALUES (26, '/avatars/3e160872-7311-440f-b9c1-a1d3a4f760bf.', 'qwq', NULL, 57, 1);
INSERT INTO `profile` VALUES (27, '/avatars/fe7b2ed8-8034-4d55-8c1f-69b1249ed800.', '老冰棍五毛一根', NULL, 41, 1);
INSERT INTO `profile` VALUES (29, '/avatars/290d7c91-d748-42e6-9686-080a35b216f4.', 'average life enjoyer', NULL, 142, 1);
INSERT INTO `profile` VALUES (30, '/avatars/96fb83b8-3b38-45dd-883f-374f74dd2757.', '我是菜逼😭', NULL, 141, 1);
INSERT INTO `profile` VALUES (31, '/avatars/ae5c8cdc-fb61-4026-96ce-817b72cfd18b.', 'rks12.92', NULL, 91, 1);
INSERT INTO `profile` VALUES (32, '/avatars/a842751d-ed66-4960-969a-2807710e357e.', 'arc刚入坑喵', NULL, 139, 1);
INSERT INTO `profile` VALUES (33, '/avatars/f4bdf6c5-2c36-407f-abd7-1b24a9434d26.', '我不会打音游😭😭😭😭', NULL, 72, 1);
INSERT INTO `profile` VALUES (34, '/avatars/ce5531de-3af5-4872-9b48-40dcc412966a.', '输入你的个性签名（50字以内）', NULL, 47, 1);
INSERT INTO `profile` VALUES (35, '/avatars/32f3bfcb-c08b-4a21-9bde-72e0e859405a.', '本群最菜', NULL, 132, 1);
INSERT INTO `profile` VALUES (36, '/avatars/7a6dd681-4cc1-4d99-9812-4bf7531f9047.', '哈基米南北绿豆', NULL, 62, 1);
INSERT INTO `profile` VALUES (37, '/avatars/a9eeef7f-8e06-4a79-9e1f-07629900f6d8.', '1111', NULL, 44, 1);
INSERT INTO `profile` VALUES (38, '/avatars/238cd151-0cdb-47e1-91a2-6d1ec8e91930.', '输入你的个性签名', NULL, 135, 1);
INSERT INTO `profile` VALUES (39, '/avatars/a433ca83-a497-4350-a0b1-86185bd46347.', 'e', NULL, 154, 1);
INSERT INTO `profile` VALUES (40, '/avatars/041c3b4a-d19e-4395-b5a2-b935319e8572.', '输入你的个性签名', NULL, 155, 1);
INSERT INTO `profile` VALUES (41, '/avatars/47e21fcd-66a7-4f14-95e6-0b646d149916.', '哈基米呦南北路多', NULL, 130, 1);
INSERT INTO `profile` VALUES (42, '/avatars/b527750d-9898-4679-8349-0b29a18d26ad.', '世界一可愛い私', NULL, 164, 1);
INSERT INTO `profile` VALUES (43, '/avatars/ab481e91-bbfc-4a24-b9a2-e037cbcfe87b.', '我超有龙b', NULL, 87, 1);
INSERT INTO `profile` VALUES (44, '/avatars/659ce02d-45b4-43a7-a9c7-f42c08c0e63c.', '无', NULL, 53, 1);
INSERT INTO `profile` VALUES (45, '/avatars/e298f8e2-b8ba-49c2-a107-27bedb16c428.', '音游萌新，啥都玩', NULL, 169, 1);
INSERT INTO `profile` VALUES (46, '/avatars/3dfbd4e0-bb7e-4227-bd3d-bac08475cced.', '喵', NULL, 54, 1);
INSERT INTO `profile` VALUES (47, '/avatars/ae5d9dbf-4316-4a03-afa3-a58c8b4f795e.', 'Ciallo～(∠・ω< )⌒★', NULL, 93, 1);
INSERT INTO `profile` VALUES (49, '/avatars/98a12043-2118-45bf-8c95-8366226737dc.', '好困...', NULL, 177, 1);
INSERT INTO `profile` VALUES (50, '/avatars/4b2f383c-53f7-4cf5-91d0-47585cac9569.', '借我点钱', NULL, 120, 1);
INSERT INTO `profile` VALUES (51, '/avatars/5667172e-d4a2-478b-ab4f-799de0c5e0c7.', 'Cd0myxs', NULL, 182, 1);
INSERT INTO `profile` VALUES (52, '/avatars/5bacda45-4e0a-40d9-acd7-523075f183ab.', 'Acta est fabula, plaudite.', NULL, 179, 1);
INSERT INTO `profile` VALUES (53, '/avatars/3c4fe4ef-bb52-420a-a85b-246318bafaad.', '签名不能为空', NULL, 190, 1);
INSERT INTO `profile` VALUES (54, '/avatars/31715ed7-ecfc-40ed-b319-be8c3d8d7cc7.', '呆猫 out', NULL, 199, 1);
INSERT INTO `profile` VALUES (55, '/avatars/d41df44a-9f46-41db-a787-09a02151fd8c.', 'fumofumo', NULL, 202, 1);
INSERT INTO `profile` VALUES (56, '/avatars/698fa7d6-d81c-4b70-ac46-172effadbbc5.', 'testtest1', NULL, 206, 1);
INSERT INTO `profile` VALUES (57, '/avatars/f337ec1f-f93b-4573-8313-64eea4c90325.', NULL, NULL, 227, 1);
INSERT INTO `profile` VALUES (58, '/avatars/6b676721-25a7-491c-838c-1a30979435b5.', NULL, NULL, 85, 1);

-- ----------------------------
-- Table structure for rank_config
-- ----------------------------
DROP TABLE IF EXISTS `rank_config`;
CREATE TABLE `rank_config`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '排行榜配置主键',
  `course_id` int NOT NULL COMMENT '课题ID（一个课题一条配置）',
  `counting_rules` float NOT NULL DEFAULT 0 COMMENT '计分修正值（带符号浮点数，显示分=score+counting_rules）',
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0 COMMENT '逻辑删除标志（0=未删除，1=已删除）',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_rank_config_course`(`course_id` ASC) USING BTREE,
  CONSTRAINT `fk_rank_config_course` FOREIGN KEY (`course_id`) REFERENCES `course` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '排行榜配置表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of rank_config
-- ----------------------------
INSERT INTO `rank_config` VALUES (1, 68, 10000000, 0, '2026-04-03 08:58:50', '2026-04-03 08:58:50');
INSERT INTO `rank_config` VALUES (2, 69, 10000000, 0, '2026-04-03 08:59:09', '2026-04-03 08:59:09');
INSERT INTO `rank_config` VALUES (3, 70, 10000000, 0, '2026-04-03 08:59:13', '2026-04-03 08:59:13');
INSERT INTO `rank_config` VALUES (5, 85, 101, 0, '2026-04-03 22:43:39', '2026-04-03 22:43:39');

-- ----------------------------
-- Table structure for room
-- ----------------------------
DROP TABLE IF EXISTS `room`;
CREATE TABLE `room`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `status` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `round` int NULL DEFAULT 1,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of room
-- ----------------------------
INSERT INTO `room` VALUES (1, '准备', 1, '新房间');

-- ----------------------------
-- Table structure for score
-- ----------------------------
DROP TABLE IF EXISTS `score`;
CREATE TABLE `score`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `course_id` int NOT NULL COMMENT '所属课题ID',
  `identity_id` int NOT NULL COMMENT '所属用户ID',
  `upload_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
  `image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '成绩图路径',
  `score` float NOT NULL DEFAULT 0 COMMENT '成绩得分',
  `is_scored` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否已评分（0=未评分，1=已评分）',
  `issue_id` int NULL DEFAULT NULL,
  `remark` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0 COMMENT '逻辑删除标志（0=未删除，1=已删除）',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `fk_score_identity`(`identity_id` ASC) USING BTREE,
  INDEX `fk_score_course`(`course_id` ASC) USING BTREE,
  CONSTRAINT `fk_score_course` FOREIGN KEY (`course_id`) REFERENCES `course` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_score_identity` FOREIGN KEY (`identity_id`) REFERENCES `identity` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 726 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '成绩表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of score
-- ----------------------------
INSERT INTO `score` VALUES (52, 55, 39, '2025-10-21 23:02:46', '/scores/709f2250-6275-489a-9151-5e2647aa721a.jpg', 11, 1, NULL, NULL, 0, NULL, '2025-10-22 09:54:58');
INSERT INTO `score` VALUES (53, 55, 35, '2025-10-21 23:04:03', '/scores/1a651775-1bf6-412e-8228-6f182ef59ae2.jpg', 12, 1, NULL, NULL, 0, NULL, '2025-10-22 07:09:39');
INSERT INTO `score` VALUES (54, 55, 21, '2025-10-29 02:49:14', '/scores/ad9b95c2-b978-459a-8041-1d36226ac209.jpg', 11, 1, NULL, NULL, 0, NULL, '2025-10-29 11:01:57');
INSERT INTO `score` VALUES (55, 55, 129, '2025-10-21 23:14:25', '/scores/75c3a13a-f121-4385-9982-1a48f054e7b4.jpg', 12, 1, NULL, NULL, 0, NULL, '2025-10-29 19:04:44');
INSERT INTO `score` VALUES (56, 55, 41, '2025-10-21 23:20:35', '/scores/134eb8e2-3a8e-4214-a57a-ae21e1bb8d77.jpg', 12, 1, NULL, NULL, 0, NULL, '2025-10-22 08:07:57');
INSERT INTO `score` VALUES (57, 55, 40, '2025-10-21 23:38:09', '/scores/966c6e42-a042-4ee3-8a89-1db784d5da5b.jpg', 12, 1, NULL, NULL, 0, NULL, '2025-10-22 08:07:48');
INSERT INTO `score` VALUES (58, 55, 29, '2025-10-22 00:39:12', '/scores/537326a3-83a2-4899-a97b-8554c3d53af3.jpg', 12, 1, NULL, NULL, 0, NULL, '2025-10-22 09:54:15');
INSERT INTO `score` VALUES (59, 55, 136, '2025-10-27 22:08:45', '/scores/1bf388ec-eb64-4f3e-b456-8f0636447a7e.jpg', 12, 1, NULL, NULL, 0, NULL, '2025-10-28 06:18:00');
INSERT INTO `score` VALUES (60, 55, 52, '2025-10-22 01:10:18', '/scores/edd9e85a-787e-49b7-9795-7e48f0c72042.png', 12, 1, NULL, NULL, 0, NULL, '2025-10-29 19:03:04');
INSERT INTO `score` VALUES (61, 55, 141, '2025-10-22 01:33:33', '/scores/0c4f7851-e805-4d01-94af-ccde1dde26a0.png', 10, 1, NULL, NULL, 0, NULL, '2025-10-29 19:03:07');
INSERT INTO `score` VALUES (62, 55, 91, '2025-10-22 01:56:39', '/scores/cb06e7e0-8f47-4080-9ad4-a359eac690fd.png', 12, 1, NULL, NULL, 0, NULL, '2025-10-29 19:03:11');
INSERT INTO `score` VALUES (63, 55, 32, '2025-10-22 02:41:54', '/scores/67fbbf2f-67d1-4c9a-932a-7ff328b241ba.jpg', 12, 1, NULL, NULL, 0, NULL, '2025-10-29 19:03:12');
INSERT INTO `score` VALUES (64, 55, 130, '2025-10-22 02:58:36', '/scores/57e053c5-4f34-442e-a04d-7b8fb82050b7.jpg', 12, 1, NULL, NULL, 0, NULL, '2025-10-29 19:03:15');
INSERT INTO `score` VALUES (65, 55, 132, '2025-10-22 03:16:37', '/scores/085b2133-deb1-42f5-bcaa-9e293273b21b.jpg', 10, 1, NULL, NULL, 0, NULL, '2025-10-29 19:03:18');
INSERT INTO `score` VALUES (66, 55, 125, '2025-10-22 04:07:39', '/scores/10664a73-7fe2-4ec9-bfbf-ba2b84c7b4d6.jpg', 12, 1, NULL, NULL, 0, NULL, '2025-10-29 19:03:20');
INSERT INTO `score` VALUES (67, 55, 140, '2025-10-22 04:14:47', '/scores/3a500eb0-e664-4cbf-a401-dde1d3af3516.jpg', 12, 1, NULL, NULL, 0, NULL, '2025-10-29 19:03:28');
INSERT INTO `score` VALUES (68, 55, 142, '2025-10-29 01:44:02', '/scores/be9ea85c-ce5f-423b-a651-38405c8d35ce.jpg', 12, 1, NULL, '之前上传的成绩被删掉了', 0, NULL, '2025-10-29 12:44:57');
INSERT INTO `score` VALUES (69, 55, 139, '2025-10-22 05:04:43', '/scores/afc6b307-3622-4ed5-a8ed-cf3b55682f9c.png', 12, 1, NULL, NULL, 0, NULL, '2025-10-29 19:03:41');
INSERT INTO `score` VALUES (70, 55, 112, '2025-10-22 04:55:48', '/scores/c4654386-932b-45fb-abac-de945557d929.png', 12, 1, NULL, NULL, 0, NULL, '2025-10-29 19:03:44');
INSERT INTO `score` VALUES (71, 55, 60, '2025-10-22 05:33:48', '/scores/e4318f56-9e73-4ddf-ab3a-934782ad8bcb.jpg', 10, 1, NULL, NULL, 0, NULL, '2025-10-29 19:04:08');
INSERT INTO `score` VALUES (72, 55, 8, '2025-10-22 05:45:01', '/scores/329d93c3-104f-4a77-abfa-a9e47259b759.jpg', 12, 1, NULL, NULL, 0, NULL, '2025-10-29 19:04:06');
INSERT INTO `score` VALUES (73, 55, 72, '2025-10-22 06:43:27', '/scores/dcb516c8-a312-4a51-a588-3c417eaa867a.jpg', 12, 1, NULL, NULL, 0, NULL, '2025-10-29 19:04:19');
INSERT INTO `score` VALUES (74, 55, 85, '2025-10-22 07:03:03', '/scores/8aa728ed-035f-4bc3-b9f8-965b309b866e.jpg', 10, 1, NULL, NULL, 0, NULL, '2025-10-25 12:37:50');
INSERT INTO `score` VALUES (75, 55, 57, '2025-10-22 07:24:34', '/scores/40ac058d-ea24-45c4-9de7-fbe102789a82.png', 12, 1, NULL, NULL, 0, NULL, '2025-10-25 12:37:55');
INSERT INTO `score` VALUES (76, 55, 76, '2025-10-22 07:41:48', '/scores/f974a4f4-eaf2-459b-86d2-43171734018f.jpg', 12, 1, NULL, NULL, 0, NULL, '2025-10-25 12:37:59');
INSERT INTO `score` VALUES (77, 55, 47, '2025-10-22 07:44:11', '/scores/f0b604a9-b65c-46d1-aac1-fb78e3621fd7.jpg', 12, 1, NULL, NULL, 0, NULL, '2025-10-25 12:38:04');
INSERT INTO `score` VALUES (78, 55, 105, '2025-10-22 07:45:17', '/scores/1510f0a8-6ac7-4d67-bad3-a9927fc18a17.png', 12, 1, NULL, NULL, 0, NULL, '2025-10-25 12:38:11');
INSERT INTO `score` VALUES (79, 55, 86, '2025-10-22 08:04:03', '/scores/ddde80c6-1108-45fe-910b-715f34d1ea1f.jpg', 11, 1, NULL, NULL, 0, NULL, '2025-10-25 12:38:19');
INSERT INTO `score` VALUES (81, 55, 48, '2025-10-24 21:59:34', '/scores/af1a1e9d-04ac-4375-877f-5a2ad884fe0d.jpg', 12, 1, NULL, NULL, 0, NULL, '2025-10-25 12:38:59');
INSERT INTO `score` VALUES (82, 55, 82, '2025-10-24 22:01:59', '/scores/23dc8d8c-9540-4d7d-bf43-1d7b243c58a3.jpg', 12, 1, NULL, NULL, 0, NULL, '2025-10-29 19:04:22');
INSERT INTO `score` VALUES (83, 55, 44, '2025-10-25 04:02:41', '/scores/8adcd3cb-b8f0-4fd8-8ffa-1688ce75e725.jpg', 10, 1, NULL, NULL, 0, NULL, '2025-10-25 12:38:32');
INSERT INTO `score` VALUES (84, 55, 135, '2025-10-25 22:44:24', '/scores/df93841c-bfc6-469d-85f7-cf73dfea1c85.png', 12, 1, NULL, NULL, 0, NULL, '2025-10-29 19:04:29');
INSERT INTO `score` VALUES (85, 55, 87, '2025-10-26 09:01:25', '/scores/acdaf034-b01f-496d-a3cb-c9a146ab49c4.jpg', 11, 1, NULL, NULL, 0, NULL, '2025-10-29 19:04:37');
INSERT INTO `score` VALUES (86, 55, 62, '2025-10-28 07:42:42', '/scores/aeaf6280-cc26-4a98-b026-bf25725b82c6.jpg', 11, 1, NULL, NULL, 0, NULL, '2025-10-29 01:19:20');
INSERT INTO `score` VALUES (87, 56, 8, '2025-10-28 08:00:23', '/scores/6b6456bf-09d7-49f3-b7d8-be89ed046e2e.png', 12, 1, NULL, NULL, 0, NULL, '2025-10-29 09:19:56');
INSERT INTO `score` VALUES (88, 56, 39, '2025-10-28 08:04:24', '/scores/314b6236-3427-4d97-a0e3-3a56e8d3838e.jpg', 12, 1, NULL, NULL, 0, NULL, '2025-10-29 01:19:18');
INSERT INTO `score` VALUES (89, 55, 37, '2025-10-28 08:20:55', '/scores/9c80c5f6-8e98-4cac-ad9a-d81ab87d133c.jpg', 10, 1, NULL, NULL, 0, NULL, '2025-10-29 01:19:15');
INSERT INTO `score` VALUES (90, 55, 155, '2025-10-29 01:25:54', '/scores/d1aa0383-ce33-4a9b-9743-53fdc8284a03.jpg', 12, 1, NULL, NULL, 0, NULL, '2025-10-29 12:45:04');
INSERT INTO `score` VALUES (91, 56, 142, '2025-10-28 19:09:46', '/scores/44c0f7ba-7485-4dae-b7ff-42347e81a2f7.jpg', 12, 1, NULL, NULL, 0, NULL, '2025-10-29 05:31:25');
INSERT INTO `score` VALUES (92, 56, 42, '2025-10-29 00:10:29', '/scores/9e92c273-a501-48e1-a126-85065f88e6c7.png', 10, 1, NULL, NULL, 0, NULL, '2025-10-29 14:56:40');
INSERT INTO `score` VALUES (93, 55, 42, '2025-10-28 19:11:30', '/scores/aeeaf921-dae3-4174-b42b-aa1156c2f029.jpeg', 10, 1, NULL, NULL, 0, NULL, '2025-11-04 06:18:47');
INSERT INTO `score` VALUES (94, 56, 159, '2025-10-28 19:55:52', '/scores/4bb72741-21d6-4b99-bfb7-d9fb75568159.jpg', 12, 1, NULL, NULL, 0, NULL, '2025-10-29 05:32:36');
INSERT INTO `score` VALUES (95, 55, 45, '2025-10-28 20:45:22', '/scores/ccb73e02-da9d-4b90-8989-39227b764479.jpg', 11, 1, NULL, NULL, 0, NULL, '2025-10-29 05:33:39');
INSERT INTO `score` VALUES (97, 56, 45, '2025-10-28 20:49:27', '/scores/91fe49d0-30fe-4a6a-864c-767583bcbcff.jpg', 12, 1, NULL, NULL, 0, NULL, '2025-10-29 05:33:45');
INSERT INTO `score` VALUES (98, 56, 155, '2025-10-28 20:54:19', '/scores/acd7519f-185f-4ff7-862f-5950d09960ee.jpg', 11, 1, NULL, NULL, 0, NULL, '2025-10-29 05:33:48');
INSERT INTO `score` VALUES (99, 56, 74, '2025-10-28 21:22:13', '/scores/d9318907-98a1-4d8f-8837-fa1a2acb2712.jpg', 11, 1, NULL, NULL, 0, NULL, '2025-10-29 05:33:49');
INSERT INTO `score` VALUES (100, 56, 139, '2025-10-28 21:58:42', '/scores/4ab5119b-25b7-486e-a4e5-612ca2e3efc7.png', 12, 1, NULL, NULL, 0, NULL, '2025-10-29 12:45:19');
INSERT INTO `score` VALUES (101, 56, 57, '2025-10-28 22:05:23', '/scores/8c3ac3ab-62a4-40f6-baf8-280afb1a230c.png', 12, 1, NULL, NULL, 0, NULL, '2025-10-29 12:45:23');
INSERT INTO `score` VALUES (102, 56, 60, '2025-10-28 23:06:44', '/scores/bdbdb9b2-f917-444b-9ab3-c7ec7c8037b0.jpg', 11, 1, NULL, NULL, 0, NULL, '2025-10-29 12:45:36');
INSERT INTO `score` VALUES (103, 56, 130, '2025-10-28 23:29:35', '/scores/3039795e-7bbb-484d-879e-751451e9cf94.jpg', 12, 1, NULL, NULL, 0, NULL, '2025-10-29 14:56:48');
INSERT INTO `score` VALUES (104, 55, 138, '2025-10-29 01:32:46', '/scores/9bf344d4-2539-4721-9d84-d74a645f4b19.jpg', 11, 1, NULL, NULL, 0, NULL, '2025-10-29 11:02:39');
INSERT INTO `score` VALUES (105, 56, 126, '2025-10-29 01:40:45', '/scores/a8bbb5ba-979e-4848-8064-96c969c3e8c3.jpg', 12, 1, NULL, NULL, 0, NULL, '2025-10-29 14:56:50');
INSERT INTO `score` VALUES (106, 55, 162, '2025-10-29 03:01:44', '/scores/4ca1d855-8764-481f-8ca9-a47b7bf45bd4.png', 11, 1, NULL, NULL, 0, NULL, '2025-10-29 11:02:44');
INSERT INTO `score` VALUES (111, 56, 29, '2025-10-29 07:03:13', '/scores/b68fa971-662b-4f04-a576-34fd9e5f52c6.png', 12, 1, NULL, NULL, 0, NULL, '2025-10-30 10:29:43');
INSERT INTO `score` VALUES (112, 56, 86, '2025-10-29 10:51:19', '/scores/77890c2a-46bb-483c-a87e-f077f5133707.png', 11, 1, NULL, NULL, 0, NULL, '2025-10-30 10:29:50');
INSERT INTO `score` VALUES (113, 56, 48, '2025-10-30 02:29:08', '/scores/1d78bf8c-626b-4988-9909-1d09271ac6d5.jpg', 12, 1, NULL, NULL, 0, NULL, '2025-10-30 10:30:23');
INSERT INTO `score` VALUES (114, 56, 164, '2025-10-30 05:58:56', '/scores/f3cb3f70-f2df-4420-82e7-8ac99d1f9a01.jpg', 12, 1, NULL, NULL, 0, NULL, '2025-11-04 06:18:59');
INSERT INTO `score` VALUES (115, 56, 140, '2025-11-04 06:17:29', '/scores/29fe49c9-9fa1-4416-ace7-7c85b005b671.jpg', 12, 1, NULL, NULL, 0, NULL, '2025-11-04 15:28:18');
INSERT INTO `score` VALUES (116, 56, 112, '2025-11-04 04:13:36', '/scores/61f7a6d3-3091-48ed-a6a4-f68fbc077c14.png', 12, 1, NULL, NULL, 0, NULL, '2025-11-04 15:28:27');
INSERT INTO `score` VALUES (117, 56, 87, '2025-11-03 02:45:06', '/scores/e89836e3-6af0-42ae-8a78-0b78de0f2ead.jpg', 11, 1, NULL, NULL, 0, NULL, '2025-11-04 06:19:06');
INSERT INTO `score` VALUES (118, 56, 85, '2025-11-03 06:13:51', '/scores/c31018ad-efde-49fa-8fda-3c7f41534c75.jpg', 10, 1, NULL, NULL, 0, NULL, '2025-11-04 06:19:17');
INSERT INTO `score` VALUES (119, 56, 35, '2025-11-03 22:18:05', '/scores/85a4519e-d40e-449a-8226-19abb257bb12.jpg', 12, 1, NULL, NULL, 0, NULL, '2025-11-04 06:19:23');
INSERT INTO `score` VALUES (120, 56, 105, '2025-11-04 03:27:01', '/scores/c667965b-9062-460b-bf9c-997fecba474e.png', 11, 1, NULL, NULL, 0, NULL, '2025-11-04 15:28:34');
INSERT INTO `score` VALUES (121, 56, 53, '2025-11-04 04:09:34', '/scores/c8eed6f2-0ca4-4202-b520-5de2aaec3723.jpg', 12, 1, NULL, NULL, 0, NULL, '2025-11-04 15:28:39');
INSERT INTO `score` VALUES (122, 56, 32, '2025-11-04 04:18:01', '/scores/a72323aa-5dc6-465b-b631-ad911aa25966.jpg', 10, 1, NULL, NULL, 0, NULL, '2025-11-04 15:28:46');
INSERT INTO `score` VALUES (123, 56, 62, '2025-11-04 04:40:41', '/scores/5d0ac94d-86f6-4fc7-b2eb-cfeafbefcbbb.jpg', 11, 1, NULL, '哈基米南北绿豆', 0, NULL, '2025-11-04 15:28:51');
INSERT INTO `score` VALUES (124, 56, 37, '2025-11-04 04:54:04', '/scores/4a7c7f96-db06-4fdc-b95d-6241174e8fa5.jpeg', 10, 1, NULL, NULL, 0, NULL, '2025-11-04 15:28:58');
INSERT INTO `score` VALUES (125, 57, 74, '2025-11-04 08:01:10', '/scores/d446e09b-aa58-4250-aab2-ec4afa5732e3.jpg', 12, 1, NULL, NULL, 0, NULL, '2025-11-05 05:08:04');
INSERT INTO `score` VALUES (126, 57, 39, '2025-11-04 08:05:15', '/scores/f80ac84b-f6fd-4785-923a-a9743da23cec.jpg', 12, 1, NULL, NULL, 0, NULL, '2025-11-05 05:08:06');
INSERT INTO `score` VALUES (127, 57, 52, '2025-11-04 19:31:03', '/scores/42d0f64c-8181-42c6-8cd5-268066f67d50.jpg', 12, 1, NULL, NULL, 0, NULL, '2025-11-05 05:08:08');
INSERT INTO `score` VALUES (128, 57, 48, '2025-11-04 20:07:53', '/scores/d6d040b8-ff5b-4165-9359-6b0f58aedeff.jpg', 12, 1, NULL, NULL, 0, NULL, '2025-11-05 05:08:10');
INSERT INTO `score` VALUES (129, 57, 8, '2025-11-04 21:07:23', '/scores/b0e18062-fca3-48fc-9ad1-ef9bb6fb1eb1.png', 12, 1, NULL, NULL, 0, NULL, '2025-11-05 05:08:12');
INSERT INTO `score` VALUES (130, 57, 126, '2025-11-04 21:23:17', '/scores/701f2430-f63e-4186-a852-9ebae45b5e32.jpg', 11, 1, NULL, NULL, 0, NULL, '2025-11-05 13:19:21');
INSERT INTO `score` VALUES (131, 57, 40, '2025-11-04 21:36:32', '/scores/5e9159d4-a1d9-4f12-8b58-0c03b6f7bac5.jpg', 0, 0, NULL, NULL, 1, NULL, '2025-11-05 13:19:48');
INSERT INTO `score` VALUES (132, 57, 40, '2025-11-04 21:36:32', '/scores/5e9159d4-a1d9-4f12-8b58-0c03b6f7bac5.jpg', 12, 1, NULL, NULL, 0, NULL, '2025-11-05 13:19:46');
INSERT INTO `score` VALUES (133, 57, 142, '2025-11-05 00:17:53', '/scores/4c308000-4faf-4c5c-98f8-4f1942b4210a.jpg', 12, 1, NULL, NULL, 0, NULL, '2025-11-05 13:19:40');
INSERT INTO `score` VALUES (134, 57, 139, '2025-11-05 06:37:44', '/scores/5c7f948a-ac02-4331-b3c4-6565cf2938a2.jpg', 12, 1, NULL, NULL, 0, NULL, '2025-11-06 12:12:41');
INSERT INTO `score` VALUES (136, 57, 45, '2025-11-05 20:35:42', '/scores/4a292313-7582-4467-903a-4475080db307.jpg', 12, 1, NULL, NULL, 0, NULL, '2025-11-06 16:34:12');
INSERT INTO `score` VALUES (137, 57, 86, '2025-11-05 23:50:19', '/scores/25f906c7-3f7f-429c-9cd3-5b8ba7d63546.png', 10, 1, NULL, NULL, 0, NULL, '2025-11-06 16:33:57');
INSERT INTO `score` VALUES (138, 57, 60, '2025-11-07 01:53:00', '/scores/1f5bd2b9-b394-408b-a8a7-e3395dedde5f.jpg', 10, 1, NULL, NULL, 0, NULL, '2025-11-10 01:54:42');
INSERT INTO `score` VALUES (139, 57, 155, '2025-11-07 04:00:38', '/scores/e6d86b29-e409-4e25-9798-3c6eb514e1f7.jpg', 10, 1, NULL, NULL, 0, NULL, '2025-11-10 01:54:45');
INSERT INTO `score` VALUES (140, 57, 57, '2025-11-08 19:43:26', '/scores/f8a80fb1-b827-4af2-be3d-d56cb7253ff4.png', 12, 1, NULL, NULL, 0, NULL, '2025-11-10 01:54:38');
INSERT INTO `score` VALUES (141, 57, 53, '2025-11-10 04:15:45', '/scores/4820300b-de35-43b5-8723-2876ace8a9d8.png', 12, 1, NULL, NULL, 0, NULL, '2025-11-11 08:47:49');
INSERT INTO `score` VALUES (142, 57, 98, '2025-11-10 07:57:22', '', 0, 0, NULL, '微波炉\n本人纯萌新', 1, NULL, '2025-11-12 06:27:44');
INSERT INTO `score` VALUES (143, 57, 29, '2025-11-10 09:28:36', '/scores/8552ad3b-6557-45e4-9153-89f9fc268228.jpg', 12, 1, NULL, NULL, 0, NULL, '2025-11-11 08:47:37');
INSERT INTO `score` VALUES (144, 57, 35, '2025-11-11 00:47:11', '/scores/c7e20e3e-cd08-48c5-879e-27b9f7e0d75a.jpg', 12, 1, NULL, NULL, 0, NULL, '2025-11-11 08:47:44');
INSERT INTO `score` VALUES (145, 57, 159, '2025-11-11 04:20:21', '/scores/f8675186-671b-46c4-84af-442a0bb77c70.jpg', 11, 1, NULL, NULL, 0, NULL, '2025-11-12 06:28:05');
INSERT INTO `score` VALUES (146, 57, 140, '2025-11-13 06:03:50', '/scores/38f6e48e-c9e7-45d3-8d1f-c28579fc9b5d.jpg', 12, 1, NULL, NULL, 0, NULL, '2025-11-17 05:54:12');
INSERT INTO `score` VALUES (147, 57, 112, '2025-11-16 20:59:30', '/scores/83d158a0-bcd0-46ed-a7e9-c818d82e645e.png', 11, 1, NULL, NULL, 0, NULL, '2025-11-23 14:18:14');
INSERT INTO `score` VALUES (148, 57, 85, '2025-11-17 06:04:24', '/scores/841768e6-2aef-4165-845c-ed66c78be79d.jpg', 10, 1, NULL, NULL, 0, NULL, '2025-11-23 14:18:18');
INSERT INTO `score` VALUES (149, 57, 141, '2025-11-18 01:44:48', '/scores/5e547cc1-30b0-470d-aa75-3b9bd2702b08.png', 10, 1, NULL, NULL, 0, NULL, '2025-11-23 14:18:21');
INSERT INTO `score` VALUES (150, 57, 37, '2025-11-18 05:36:37', '/scores/5499b3be-0b41-4154-94d4-deff2f01110f.jpeg', 10, 1, NULL, NULL, 0, NULL, '2025-11-23 14:18:24');
INSERT INTO `score` VALUES (151, 57, 62, '2025-11-18 07:47:52', '/scores/805914d7-3ffd-4cc0-b6fe-cd2e65755ead.jpg', 10, 1, NULL, NULL, 0, NULL, '2025-11-23 14:18:29');
INSERT INTO `score` VALUES (159, 64, 35, '2025-11-25 18:36:56', '/scores/013212d4-8017-4592-9e72-7d0f1d09d9f1.jpg', -37819, 1, NULL, NULL, 1, NULL, '2025-11-26 02:37:47');
INSERT INTO `score` VALUES (160, 65, 35, '2025-11-25 18:37:02', '/scores/15f6bec9-1f61-4f4d-b34f-7eba100ff02f.jpg', -42486, 1, NULL, NULL, 1, NULL, '2025-11-26 02:37:57');
INSERT INTO `score` VALUES (161, 66, 35, '2025-11-25 18:37:09', '/scores/223f3eb9-3f02-45ae-9ded-ce087d74d8aa.jpg', -32074, 1, NULL, NULL, 1, NULL, '2025-11-26 02:38:08');
INSERT INTO `score` VALUES (162, 64, 114, '2025-11-25 18:39:30', '/scores/02e1a7e8-556f-4831-a815-5bd508b8572d.jpg', 1122, 1, NULL, NULL, 1, NULL, '2025-11-26 02:40:09');
INSERT INTO `score` VALUES (163, 65, 114, '2025-11-25 18:39:39', '/scores/30de84e6-fbd4-446a-bc25-886b4c0f7dca.jpg', 1102, 1, NULL, NULL, 1, NULL, '2025-11-26 02:40:17');
INSERT INTO `score` VALUES (164, 66, 114, '2025-11-25 18:39:50', '/scores/d8b58b9a-f481-4ce8-802f-2c779fe60422.jpg', 1451, 1, NULL, NULL, 1, NULL, '2025-11-26 02:40:25');
INSERT INTO `score` VALUES (165, 64, 159, '2025-11-25 18:41:04', '/scores/34db4589-5052-4454-bc5a-5884071208df.jpg', 919, 1, NULL, NULL, 1, NULL, '2025-11-26 02:43:03');
INSERT INTO `score` VALUES (166, 65, 159, '2025-11-25 18:41:16', '/scores/887c3e39-5edb-438f-bcfb-bb1743e39ded.jpg', -24285, 1, NULL, NULL, 1, NULL, '2025-11-26 02:43:11');
INSERT INTO `score` VALUES (167, 66, 159, '2025-11-25 18:41:27', '/scores/2a5b2a02-8bc5-4c3f-b56d-059bd5a07a9a.jpg', -24285, 1, NULL, NULL, 1, NULL, '2025-11-26 02:43:19');
INSERT INTO `score` VALUES (168, 64, 53, '2025-11-25 18:44:18', '/scores/596e3ab6-3525-443f-8c3f-35c13dff9526.jpg', -44851, 1, NULL, NULL, 1, NULL, '2025-11-26 02:45:14');
INSERT INTO `score` VALUES (169, 65, 53, '2025-11-25 18:44:27', '/scores/94f22e20-d815-47a5-ae0b-7365fa23c8fa.jpg', -69037, 1, NULL, NULL, 1, NULL, '2025-11-26 02:45:22');
INSERT INTO `score` VALUES (170, 66, 53, '2025-11-25 18:44:34', '/scores/35e2cdaa-033b-4812-97d3-2ee2f6729fa2.jpg', -133120, 1, NULL, NULL, 1, NULL, '2025-11-26 02:45:30');
INSERT INTO `score` VALUES (171, 67, 21, '2025-11-26 02:22:11', '', 0, 0, NULL, NULL, 1, NULL, '2025-11-26 10:23:43');
INSERT INTO `score` VALUES (172, 68, 39, '2025-11-26 06:01:11', '/scores/7d685ac7-63e2-45fc-97a8-96f6d82c7c7e.jpg', 913, 1, NULL, NULL, 0, NULL, '2025-11-26 14:11:52');
INSERT INTO `score` VALUES (173, 69, 39, '2025-11-26 06:01:23', '/scores/3ef6c57d-f27a-4a44-a186-553a97daa05a.jpg', 1123, 1, NULL, NULL, 0, NULL, '2025-11-26 14:12:00');
INSERT INTO `score` VALUES (174, 70, 39, '2025-11-26 06:01:29', '/scores/2849599d-e5fe-4ae8-911e-89a2794e09fb.jpg', 1115, 1, NULL, NULL, 0, NULL, '2025-11-26 14:12:06');
INSERT INTO `score` VALUES (175, 68, 8, '2025-11-26 06:05:41', '/scores/dc43dc20-708c-4888-b789-79dc3565aa56.jpg', 914, 1, NULL, NULL, 0, NULL, '2025-11-26 14:11:31');
INSERT INTO `score` VALUES (176, 69, 8, '2025-11-26 06:05:53', '/scores/d4eba572-6a9a-4a50-ad92-a71b0f39ef4f.jpg', 1079, 1, NULL, NULL, 0, NULL, '2025-11-26 14:11:23');
INSERT INTO `score` VALUES (177, 70, 8, '2025-11-26 06:06:01', '/scores/575121cd-9578-4d8b-98ee-e1ca7e44fe64.jpg', 1124, 1, NULL, NULL, 0, NULL, '2025-11-26 14:11:12');
INSERT INTO `score` VALUES (178, 68, 169, '2025-11-26 06:10:03', '/scores/7de5eea9-a14f-46a7-bd8d-93c73375a391.png', -4355, 1, NULL, NULL, 0, NULL, '2025-11-26 14:11:01');
INSERT INTO `score` VALUES (179, 69, 169, '2025-11-26 06:10:11', '/scores/2f721e84-07fc-47ab-a9f8-fc60ce0b0215.png', -72624, 1, NULL, NULL, 0, NULL, '2025-11-26 14:10:52');
INSERT INTO `score` VALUES (180, 70, 169, '2025-11-26 06:10:17', '/scores/6ebf1a76-bd78-463b-b57b-4213753946f7.png', -41676, 1, NULL, NULL, 0, NULL, '2025-11-26 14:10:44');
INSERT INTO `score` VALUES (181, 68, 52, '2025-11-26 06:29:26', '/scores/4978b201-10b4-4272-b5ed-de493d89fa3d.jpg', 943, 1, NULL, NULL, 0, NULL, '2025-11-26 14:30:12');
INSERT INTO `score` VALUES (182, 69, 52, '2025-11-26 06:29:30', '/scores/d3594962-69fa-4e79-a8d6-2d814d856b88.jpg', 1139, 1, NULL, NULL, 0, NULL, '2025-11-26 14:30:20');
INSERT INTO `score` VALUES (183, 70, 52, '2025-11-26 06:29:36', '/scores/4267b492-9062-4d3b-bbbd-c96bc4590340.jpg', 1153, 1, NULL, NULL, 0, NULL, '2025-11-26 14:30:27');
INSERT INTO `score` VALUES (184, 68, 139, '2025-11-26 06:34:41', '/scores/6bc0782f-ba99-4822-a455-17c3611f0a78.png', 939, 1, NULL, NULL, 0, NULL, '2025-11-26 14:42:33');
INSERT INTO `score` VALUES (185, 69, 139, '2025-11-27 03:29:19', '/scores/097b5549-3b42-4b21-ac46-052dea3592f2.png', 1144, 1, NULL, NULL, 0, NULL, '2025-11-27 14:45:07');
INSERT INTO `score` VALUES (186, 70, 139, '2025-11-27 03:05:31', '/scores/1f8fe2bb-2537-4681-92c3-b3accf78701a.jpeg', 1164, 1, NULL, NULL, 0, NULL, '2025-11-27 14:45:14');
INSERT INTO `score` VALUES (187, 68, 40, '2025-11-26 06:37:18', '/scores/a0eb5ed5-11eb-437d-9853-55b0116b1acd.jpg', 923, 1, NULL, NULL, 0, NULL, '2025-11-26 14:42:58');
INSERT INTO `score` VALUES (188, 69, 40, '2025-11-26 06:37:33', '/scores/de81723f-8b69-469a-be59-6db746f76d70.jpg', 1128, 1, NULL, NULL, 0, NULL, '2025-11-26 14:43:05');
INSERT INTO `score` VALUES (189, 70, 40, '2025-11-26 06:37:39', '/scores/7f5e4385-60aa-49fb-926b-80915454b76a.jpg', 1122, 1, NULL, NULL, 0, NULL, '2025-11-26 14:43:12');
INSERT INTO `score` VALUES (190, 68, 54, '2025-11-26 06:46:07', '/scores/66a764ec-44bb-4ffd-a132-6a2e8243e804.jpg', 931, 1, NULL, NULL, 0, NULL, '2025-11-26 15:04:08');
INSERT INTO `score` VALUES (191, 69, 54, '2025-12-03 07:43:44', '/scores/d287c6f2-f8f4-4796-86f3-ebf5ee4ca040.jpg', -24896, 1, NULL, NULL, 0, NULL, '2025-12-04 13:32:20');
INSERT INTO `score` VALUES (192, 70, 54, '2025-11-26 06:46:28', '/scores/27cf2e68-e6b3-4b13-8857-fcb8a6f3060c.jpg', -3154, 1, NULL, NULL, 0, NULL, '2025-11-26 15:04:25');
INSERT INTO `score` VALUES (193, 68, 91, '2025-11-26 07:10:25', '/scores/a7dd10af-6714-4166-a0e3-bd70d732b6b1.png', 917, 1, NULL, NULL, 0, NULL, '2025-11-27 02:38:26');
INSERT INTO `score` VALUES (194, 69, 91, '2025-11-26 07:14:16', '/scores/1d32a9b8-6fca-4b66-adaf-94d331020db5.png', 1116, 1, NULL, NULL, 0, NULL, '2025-11-27 02:38:33');
INSERT INTO `score` VALUES (195, 70, 91, '2025-11-26 07:36:13', '/scores/fb376131-6ed3-495c-bec0-17fcc8c5b8e4.png', 1123, 1, NULL, NULL, 0, NULL, '2025-11-27 02:38:39');
INSERT INTO `score` VALUES (196, 68, 86, '2025-11-26 08:24:20', '/scores/25b89fe0-60e0-4714-8237-2641e7536b53.jpg', 906, 1, NULL, NULL, 0, NULL, '2025-11-27 02:38:45');
INSERT INTO `score` VALUES (197, 69, 86, '2025-11-26 08:24:27', '/scores/d9ae07b5-e4cc-46f0-a439-e900e955359c.jpg', 1101, 1, NULL, NULL, 0, NULL, '2025-11-27 02:38:52');
INSERT INTO `score` VALUES (198, 70, 86, '2025-11-26 08:24:34', '/scores/85be66cc-6f3a-4fe0-955e-377de42bf532.jpg', -54476, 1, NULL, NULL, 0, NULL, '2025-11-27 02:38:58');
INSERT INTO `score` VALUES (199, 68, 45, '2025-11-26 21:37:47', '/scores/2b000ac3-b145-4e06-8d9e-0877cc0c2ed0.jpg', 920, 1, NULL, NULL, 0, NULL, '2025-11-27 14:45:44');
INSERT INTO `score` VALUES (200, 69, 45, '2025-11-26 21:38:06', '/scores/373f41b6-2de8-4b16-8ed1-2ed1dd56e125.jpg', 1125, 1, NULL, NULL, 0, NULL, '2025-11-27 14:45:50');
INSERT INTO `score` VALUES (201, 70, 45, '2025-11-26 21:38:24', '/scores/14b890eb-dc74-42ef-a4dc-f717ec4232df.jpg', 1115, 1, NULL, NULL, 0, NULL, '2025-11-27 14:45:57');
INSERT INTO `score` VALUES (202, 68, 41, '2025-11-27 22:56:06', '/scores/56c0aac5-0a34-4aa0-881a-fc398716c79d.jpg', 938, 1, NULL, NULL, 0, NULL, '2025-11-29 07:51:13');
INSERT INTO `score` VALUES (203, 69, 41, '2025-11-27 22:56:12', '/scores/0e482919-2c7b-405f-9d5c-1095a7a50763.jpg', 1139, 1, NULL, NULL, 0, NULL, '2025-11-29 07:51:19');
INSERT INTO `score` VALUES (204, 70, 41, '2025-11-27 22:56:19', '/scores/e0ff4909-3160-4e80-b989-6113e6f90a95.jpg', 1135, 1, NULL, NULL, 0, NULL, '2025-11-29 07:51:25');
INSERT INTO `score` VALUES (205, 68, 140, '2025-11-29 02:16:29', '/scores/80065e54-fd70-4b84-a62a-bec06fa8beef.jpg', 931, 1, NULL, NULL, 0, NULL, '2025-11-30 02:37:38');
INSERT INTO `score` VALUES (206, 69, 140, '2025-11-29 02:16:37', '/scores/2269d378-bdb3-4bb1-8a94-75564ce8dbe9.jpg', 1135, 1, NULL, NULL, 0, NULL, '2025-11-30 02:37:44');
INSERT INTO `score` VALUES (207, 70, 140, '2025-11-29 02:16:41', '/scores/5df12e6e-7bbe-4da3-bf6f-db8ec06ce981.jpg', 1115, 1, NULL, NULL, 0, NULL, '2025-11-30 02:37:50');
INSERT INTO `score` VALUES (208, 68, 130, '2025-11-29 05:38:43', '/scores/489f12ee-0e3b-417b-8479-32b9df130e80.jpg', -20147, 1, NULL, NULL, 0, NULL, '2025-11-30 02:37:57');
INSERT INTO `score` VALUES (209, 69, 130, '2025-11-29 05:38:56', '/scores/1e1744f1-f2ac-49af-a847-f64fe8c891c6.jpg', -11908, 1, NULL, NULL, 0, NULL, '2025-11-30 02:38:02');
INSERT INTO `score` VALUES (210, 70, 130, '2025-11-29 05:39:09', '/scores/1b47a6aa-8bd8-4110-8a21-836fdb462207.jpg', -63013, 1, NULL, NULL, 0, NULL, '2025-11-30 02:38:10');
INSERT INTO `score` VALUES (211, 68, 164, '2025-11-29 19:20:05', '/scores/a8b4ea86-503d-44eb-82fa-0597ef8a2bc3.jpg', -9628, 1, NULL, NULL, 0, NULL, '2025-11-30 04:15:13');
INSERT INTO `score` VALUES (212, 69, 164, '2025-11-29 19:21:09', '/scores/1a08dd01-1b53-467d-b73a-22736ec73dab.jpg', -81252, 1, NULL, NULL, 0, NULL, '2025-11-30 04:15:22');
INSERT INTO `score` VALUES (213, 70, 164, '2025-11-29 19:21:24', '/scores/efc5b8d6-f79b-4962-8636-877715304d90.jpg', -71580, 1, NULL, NULL, 0, NULL, '2025-11-30 04:15:28');
INSERT INTO `score` VALUES (214, 68, 47, '2025-11-30 02:02:26', '/scores/53cfd35f-8fbd-4077-bb73-92a01846678f.jpg', 930, 1, NULL, NULL, 0, NULL, '2025-12-02 12:12:46');
INSERT INTO `score` VALUES (215, 69, 47, '2025-12-03 01:23:35', '/scores/07a90368-0d52-40a5-9e6e-fbcd5a88e7d2.jpg', -3258, 1, NULL, NULL, 0, NULL, '2025-12-03 12:19:27');
INSERT INTO `score` VALUES (216, 70, 47, '2025-12-03 01:23:43', '/scores/9fb3514b-804d-4f4e-a3aa-b8e6cd91b953.jpg', -15980, 1, NULL, NULL, 0, NULL, '2025-12-03 12:19:35');
INSERT INTO `score` VALUES (217, 68, 72, '2025-11-30 06:20:59', '/scores/add3eff5-6335-45db-9b3a-ea0c91824e0f.jpg', -4341, 1, NULL, NULL, 0, NULL, '2025-12-02 12:13:34');
INSERT INTO `score` VALUES (218, 69, 72, '2025-11-30 06:21:30', '/scores/d73d5b0d-043e-406f-80ad-af8c3ee702d8.jpg', -7562, 1, NULL, NULL, 0, NULL, '2025-12-02 12:13:41');
INSERT INTO `score` VALUES (219, 70, 72, '2025-11-30 06:21:50', '/scores/d14c361f-9e95-435b-8a74-7f6a03e2d46e.jpg', -11701, 1, NULL, NULL, 0, NULL, '2025-12-02 12:13:49');
INSERT INTO `score` VALUES (220, 68, 87, '2025-12-01 23:32:39', '/scores/e0c4f3da-7304-49d5-a5c9-cf99b5d952df.jpg', 911, 1, NULL, NULL, 0, NULL, '2025-12-02 12:14:04');
INSERT INTO `score` VALUES (221, 69, 87, '2025-12-01 23:32:58', '/scores/e2dd7a72-b939-411d-acd1-b22f15085ee5.jpg', -7565, 1, NULL, NULL, 0, NULL, '2025-12-02 12:14:12');
INSERT INTO `score` VALUES (222, 70, 87, '2025-12-01 23:33:13', '/scores/2a775646-b6e6-491a-9335-6407e274b2f7.jpg', -11732, 1, NULL, NULL, 0, NULL, '2025-12-02 12:14:19');
INSERT INTO `score` VALUES (223, 68, 32, '2025-12-02 01:35:47', '/scores/47550221-9af7-4709-86d8-9056ce3bf316.jpg', 929, 1, NULL, NULL, 0, NULL, '2025-12-02 12:14:26');
INSERT INTO `score` VALUES (224, 69, 32, '2025-12-02 01:36:32', '/scores/067c313a-9f4a-43c2-86ed-e620af8e46b1.jpg', -11882, 1, NULL, NULL, 0, NULL, '2025-12-02 12:14:34');
INSERT INTO `score` VALUES (225, 70, 32, '2025-12-02 01:37:10', '/scores/715cfa8d-d2b7-418d-aee6-05a1503c3266.jpg', 1127, 1, NULL, NULL, 0, NULL, '2025-12-02 12:14:41');
INSERT INTO `score` VALUES (226, 68, 53, '2025-12-02 02:43:04', '/scores/6ffd9ee9-0c30-4341-be7f-5fd857eab3d5.png', 937, 1, NULL, NULL, 0, NULL, '2025-12-02 12:14:50');
INSERT INTO `score` VALUES (227, 69, 53, '2025-12-02 02:43:13', '/scores/414500ae-f662-4006-adc5-1df7b875740b.png', 1134, 1, NULL, NULL, 0, NULL, '2025-12-02 12:14:56');
INSERT INTO `score` VALUES (228, 70, 53, '2025-12-02 02:43:22', '/scores/a235cfc0-19cc-4667-88d1-5e5028d61f77.png', 1145, 1, NULL, NULL, 0, NULL, '2025-12-02 12:15:04');
INSERT INTO `score` VALUES (229, 68, 62, '2025-12-02 03:20:59', '/scores/6aaac5dd-879d-4b81-8145-0df90010ef5c.jpg', 881, 1, NULL, NULL, 0, NULL, '2025-12-02 12:15:14');
INSERT INTO `score` VALUES (230, 69, 62, '2025-12-02 03:21:16', '/scores/38687986-f437-4aea-827c-3c3fe03693a7.jpg', -33593, 1, NULL, NULL, 0, NULL, '2025-12-02 12:15:25');
INSERT INTO `score` VALUES (231, 70, 62, '2025-12-02 03:21:39', '/scores/68060a07-b8dd-4bd8-b5ef-70bf52fba73a.jpg', -28851, 1, NULL, NULL, 0, NULL, '2025-12-02 12:15:31');
INSERT INTO `score` VALUES (232, 68, 74, '2025-12-02 04:29:46', '/scores/d1dd7daf-364a-4f88-9560-daf66370d822.jpg', -72773, 1, NULL, NULL, 0, NULL, '2025-12-03 05:18:21');
INSERT INTO `score` VALUES (233, 69, 74, '2025-12-02 04:29:56', '/scores/e5524d92-624b-48da-a074-a475b80180be.jpg', -68307, 1, NULL, NULL, 0, NULL, '2025-12-03 05:18:29');
INSERT INTO `score` VALUES (234, 70, 74, '2025-12-02 04:30:03', '/scores/8bef2c38-e38c-48d1-bacd-9f43fe61f2a1.jpg', -187037, 1, NULL, NULL, 0, NULL, '2025-12-03 05:18:37');
INSERT INTO `score` VALUES (235, 68, 112, '2025-12-02 05:31:42', '/scores/a7c83232-5d4a-4d22-b878-dc022621ea49.png', 938, 1, NULL, NULL, 0, NULL, '2025-12-03 05:18:51');
INSERT INTO `score` VALUES (236, 69, 112, '2025-12-02 05:31:53', '/scores/6d0eade8-8415-4db3-ae7d-bd5f673f2801.png', -7545, 1, NULL, NULL, 0, NULL, '2025-12-03 05:18:59');
INSERT INTO `score` VALUES (237, 70, 112, '2025-12-02 05:32:00', '/scores/19f749ef-484c-4912-98df-476268e31728.png', -3145, 1, NULL, NULL, 0, NULL, '2025-12-03 05:19:06');
INSERT INTO `score` VALUES (238, 68, 93, '2025-12-02 07:30:43', '/scores/4c056943-5fd1-41ca-9769-91aab7e46fcd.jpg', 904, 1, NULL, NULL, 0, NULL, '2025-12-03 05:19:15');
INSERT INTO `score` VALUES (239, 69, 93, '2025-12-02 07:30:59', '/scores/1473aace-866f-4017-8c9c-09fdcfc3ce53.jpg', -7572, 1, NULL, NULL, 0, NULL, '2025-12-03 05:19:23');
INSERT INTO `score` VALUES (240, 70, 93, '2025-12-02 07:31:15', '/scores/753fd91c-6675-4cac-b79f-51746b3cff7f.jpg', -28834, 1, NULL, NULL, 0, NULL, '2025-12-03 05:19:30');
INSERT INTO `score` VALUES (241, 68, 105, '2025-12-02 15:40:56', '/scores/720867a3-ce87-47b1-a60c-182720af46eb.jpg', -14886, 1, NULL, NULL, 0, NULL, '2025-12-03 05:19:40');
INSERT INTO `score` VALUES (242, 69, 105, '2025-12-02 17:10:44', '/scores/2fdd3578-0627-4512-a7f2-f3a5b829c3e2.jpg', -24910, 1, NULL, NULL, 0, NULL, '2025-12-03 05:19:48');
INSERT INTO `score` VALUES (243, 70, 105, '2025-12-02 15:41:52', '/scores/5b3ea3bb-d7c2-42c4-8ed2-a9ed0b0a0687.jpg', -24531, 1, NULL, NULL, 0, NULL, '2025-12-03 05:19:55');
INSERT INTO `score` VALUES (244, 71, 39, '2025-12-11 21:47:59', '/scores/d0abf8d7-d4dc-4f63-bfc2-e26733c10f87.jpg', 12, 1, NULL, NULL, 0, NULL, '2025-12-12 05:51:41');
INSERT INTO `score` VALUES (245, 71, 8, '2025-12-11 21:51:41', '/scores/2f13bbdf-1d96-420a-9f4d-b7a1adaf2be5.jpg', 12, 1, NULL, NULL, 0, NULL, '2025-12-12 05:51:47');
INSERT INTO `score` VALUES (246, 71, 139, '2025-12-11 22:04:02', '/scores/a03cba43-f427-43f5-8e27-38bef7153f91.jpg', 12, 1, NULL, NULL, 0, NULL, '2025-12-12 12:18:08');
INSERT INTO `score` VALUES (248, 71, 91, '2025-12-12 02:15:57', '/scores/552e674d-d678-487e-8f16-ee9230c7f3f7.png', 11, 1, NULL, NULL, 0, NULL, '2025-12-12 12:18:37');
INSERT INTO `score` VALUES (249, 71, 52, '2025-12-12 05:07:32', '/scores/e270a695-e30d-4949-84b7-e4ccec0cacc9.jpg', 11, 1, NULL, NULL, 0, NULL, '2025-12-13 10:15:04');
INSERT INTO `score` VALUES (250, 71, 112, '2025-12-12 07:32:39', '/scores/941d6cd1-a7ca-452f-9b64-ade46abc9b7c.png', 12, 1, NULL, NULL, 0, NULL, '2025-12-13 10:14:52');
INSERT INTO `score` VALUES (251, 71, 130, '2025-12-12 21:11:42', '/scores/86ea77fb-2243-442d-9d85-f5efed92af96.jpg', 11, 1, NULL, NULL, 0, NULL, '2025-12-13 10:15:00');
INSERT INTO `score` VALUES (252, 71, 40, '2025-12-14 07:10:08', '/scores/139dda03-18c3-4cf2-b264-63db706b2b17.jpg', 11, 1, NULL, NULL, 0, NULL, '2025-12-15 17:56:48');
INSERT INTO `score` VALUES (253, 71, 57, '2025-12-15 04:15:38', '/scores/1669dab3-a8f4-48f8-82c2-6af21176d7e2.png', 12, 1, NULL, NULL, 0, NULL, '2025-12-15 17:56:42');
INSERT INTO `score` VALUES (254, 71, 53, '2025-12-15 05:23:35', '/scores/c10bd200-b424-4db3-8790-b3a12c1883e3.jpg', 12, 1, NULL, NULL, 0, NULL, '2025-12-15 17:56:35');
INSERT INTO `score` VALUES (255, 71, 62, '2025-12-18 08:03:06', '/scores/74c81015-c31d-4da6-b985-d986117e07a0.jpg', 10, 1, NULL, NULL, 0, NULL, '2025-12-19 04:51:33');
INSERT INTO `score` VALUES (256, 71, 29, '2025-12-24 04:41:56', '/scores/b1fcbdc4-59db-4677-95ad-aa1da92c8896.jpg', 12, 1, NULL, NULL, 0, NULL, '2026-01-05 12:39:54');
INSERT INTO `score` VALUES (258, 72, 39, '2026-01-01 03:40:17', '/scores/1120c585-588c-4584-8986-aa8ec134a16a.jpg', 12, 1, NULL, NULL, 0, NULL, '2026-01-05 12:39:37');
INSERT INTO `score` VALUES (259, 72, 86, '2026-01-02 07:24:31', '/scores/9febe63c-f2ed-49c3-8a74-1b269bdb6a6c.png', 11, 1, NULL, NULL, 0, NULL, '2026-01-05 12:39:46');
INSERT INTO `score` VALUES (260, 72, 57, '2026-01-03 07:57:02', '/scores/8b9c1181-81d2-435e-80f0-4a649e0f80ff.jpeg', 12, 1, NULL, NULL, 0, NULL, '2026-01-05 12:39:33');
INSERT INTO `score` VALUES (261, 72, 8, '2026-01-05 04:38:53', '/scores/c0cf9d9b-7aa7-4cb5-9e34-e239c861fff2.png', 12, 1, NULL, NULL, 0, NULL, '2026-01-05 12:39:50');
INSERT INTO `score` VALUES (262, 73, 21, '2026-01-16 22:33:38', '/scores/098c8274-42c3-44fa-9479-a8f132cb0d21.jpg', -10000000, 1, NULL, NULL, 1, NULL, '2026-01-17 06:33:53');
INSERT INTO `score` VALUES (263, 73, 39, '2026-01-17 06:39:02', '/scores/f2c72e75-534a-4553-b285-81be0bb85c98.jpg', 12, 1, NULL, NULL, 1, NULL, '2026-01-18 00:08:14');
INSERT INTO `score` VALUES (264, 73, 140, '2026-01-17 07:35:38', '/scores/9e0ba9ff-a91f-4927-b488-7be278266dd1.jpg', 12, 1, NULL, NULL, 1, NULL, '2026-01-18 00:08:23');
INSERT INTO `score` VALUES (265, 74, 8, '2026-01-17 08:04:59', '/scores/f8718625-a7e3-4376-8944-48a5d5092b67.jpg', 12, 1, NULL, NULL, 0, NULL, '2026-01-17 16:05:23');
INSERT INTO `score` VALUES (266, 74, 39, '2026-01-17 08:10:15', '/scores/44f7ee83-f414-4b78-b5f2-9325066b64ec.jpg', 12, 1, NULL, NULL, 0, NULL, '2026-01-17 16:11:54');
INSERT INTO `score` VALUES (267, 74, 177, '2026-01-17 08:10:55', '/scores/35e7824d-d9ee-4baa-91f9-4a145118dae0.jpg', 12, 1, NULL, NULL, 0, NULL, '2026-01-17 16:11:57');
INSERT INTO `score` VALUES (268, 74, 189, '2026-01-17 08:11:13', '/scores/96aa22c6-2a55-4a64-8daa-387b8dcda5d0.png', 11, 1, NULL, NULL, 0, NULL, '2026-01-17 16:12:01');
INSERT INTO `score` VALUES (269, 74, 140, '2026-01-17 08:24:10', '/scores/67b9974a-e86d-4aea-a1fd-18743731e947.jpg', 12, 1, NULL, NULL, 0, NULL, '2026-01-18 03:13:39');
INSERT INTO `score` VALUES (271, 74, 192, '2026-01-17 19:34:56', '/scores/a6160400-71f1-450b-bdfa-71bf880a0480.jpg', 11, 1, NULL, NULL, 0, NULL, '2026-01-19 13:06:27');
INSERT INTO `score` VALUES (272, 74, 193, '2026-01-18 02:54:16', '/scores/d122d00f-b2b1-4bde-9ca9-9ee0d4c5e0be.png', 11, 1, NULL, NULL, 0, NULL, '2026-01-19 13:06:35');
INSERT INTO `score` VALUES (273, 74, 62, '2026-01-18 07:21:35', '/scores/c0fe10bf-d9c6-45c7-9f9a-7eb36d9a7e99.jpg', 11, 1, NULL, NULL, 0, NULL, '2026-01-19 13:06:48');
INSERT INTO `score` VALUES (274, 74, 139, '2026-01-18 11:24:48', '/scores/210c5034-7809-428d-9510-c0909e9c7eb0.png', 12, 1, NULL, NULL, 0, NULL, '2026-01-19 13:06:41');
INSERT INTO `score` VALUES (276, 74, 52, '2026-01-18 22:09:52', '/scores/7dd78c0a-185e-4d04-a501-369d7dac3465.jpg', 11, 1, NULL, NULL, 0, NULL, '2026-01-19 13:07:10');
INSERT INTO `score` VALUES (277, 74, 76, '2026-01-19 04:35:10', '/scores/4938ce78-53b0-46a3-8e4c-eeb0fc95eadb.jpg', 11, 1, NULL, NULL, 0, NULL, '2026-01-19 13:07:14');
INSERT INTO `score` VALUES (278, 74, 195, '2026-01-20 02:26:04', '/scores/247a7e14-eded-4d86-aeae-5a2aa5fbc00e.jpg', 11, 1, NULL, NULL, 0, NULL, '2026-01-20 16:14:26');
INSERT INTO `score` VALUES (279, 74, 199, '2026-01-20 08:19:45', '/scores/ca3831e2-01d1-4dde-a381-06fc569576cc.jpg', 12, 1, NULL, NULL, 0, NULL, '2026-01-21 08:09:54');
INSERT INTO `score` VALUES (280, 74, 57, '2026-01-20 19:13:23', '/scores/360709be-28d7-4d25-919a-d5c6bbbf6708.jpeg', 12, 1, NULL, NULL, 0, NULL, '2026-01-21 08:10:14');
INSERT INTO `score` VALUES (281, 74, 155, '2026-01-20 23:16:49', '/scores/7adb9f25-ecd9-4c8b-b7cf-6a2c3ae49714.jpg', 11, 1, NULL, NULL, 0, NULL, '2026-01-21 08:10:33');
INSERT INTO `score` VALUES (282, 74, 91, '2026-01-21 22:56:39', '/scores/d431df0f-b026-412d-b7f8-1a390f444c74.png', 12, 1, NULL, NULL, 0, NULL, '2026-01-23 03:29:49');
INSERT INTO `score` VALUES (283, 74, 201, '2026-01-26 04:20:13', '/scores/eaaa289a-e0a5-452a-bda5-f70a05350aec.jpg', 12, 1, NULL, NULL, 0, NULL, '2026-01-29 02:46:39');
INSERT INTO `score` VALUES (284, 76, 193, '2026-02-06 05:54:40', '/scores/4108bb29-49c9-417d-9b85-175071e49ede.png', 0, 0, NULL, NULL, 1, NULL, '2026-02-06 13:54:40');
INSERT INTO `score` VALUES (285, 76, 177, '2026-02-06 05:59:27', '/scores/1667f1ee-2623-4439-9398-1b86dda1f0db.jpg', 0, 0, NULL, NULL, 1, NULL, '2026-02-06 13:59:27');
INSERT INTO `score` VALUES (286, 77, 177, '2026-02-06 06:13:16', '/scores/18ec9e2f-9ae8-4b91-9198-bcaeca4c8c66.jpg', 12, 1, NULL, NULL, 0, NULL, '2026-02-06 14:17:09');
INSERT INTO `score` VALUES (287, 77, 39, '2026-02-06 06:30:54', '/scores/0cad1b6b-6e64-48be-933a-7ef26fc175d0.jpg', 12, 1, NULL, NULL, 0, NULL, '2026-02-06 14:36:49');
INSERT INTO `score` VALUES (288, 77, 62, '2026-02-06 06:48:12', '/scores/1858c7d6-71c6-44cf-830d-f6717fe9bf23.jpg', 12, 1, NULL, NULL, 0, NULL, '2026-02-06 14:55:57');
INSERT INTO `score` VALUES (289, 77, 52, '2026-02-06 09:05:48', '/scores/f13dd35e-b7cc-4ffa-8b95-ec8952daea0c.jpg', 12, 1, NULL, NULL, 0, NULL, '2026-02-07 01:21:16');
INSERT INTO `score` VALUES (290, 77, 41, '2026-02-06 21:13:19', '/scores/09ee4a09-5349-410a-b4e0-61e6781eff73.jpg', 12, 1, NULL, NULL, 0, NULL, '2026-02-07 09:38:53');
INSERT INTO `score` VALUES (291, 77, 91, '2026-02-06 21:24:22', '/scores/026d0a9a-de84-41b4-9136-a6a6cabfef47.png', 12, 1, NULL, NULL, 0, NULL, '2026-02-07 09:39:00');
INSERT INTO `score` VALUES (293, 77, 120, '2026-02-07 01:38:14', '/scores/08023802-33a8-4272-ab1d-753caf596584.png', 10, 1, NULL, NULL, 0, NULL, '2026-02-07 09:39:43');
INSERT INTO `score` VALUES (294, 77, 8, '2026-02-20 08:45:26', '/scores/cf931249-e84a-4998-8c3d-c98d59a38e14.png', 12, 1, NULL, NULL, 0, NULL, '2026-02-20 16:45:30');
INSERT INTO `score` VALUES (295, 77, 199, '2026-02-10 08:32:03', '/scores/c249900d-4fbe-4a14-b3d1-8ae4cfef064f.png', 12, 1, NULL, NULL, 0, NULL, '2026-02-10 16:32:25');
INSERT INTO `score` VALUES (296, 77, 139, '2026-02-16 00:38:33', '/scores/f960ef02-242c-42e8-b8ed-d8c59dfa0682.png', 12, 1, NULL, NULL, 0, NULL, '2026-02-17 06:21:34');
INSERT INTO `score` VALUES (297, 77, 51, '2026-02-18 19:18:48', '', 0, 0, NULL, '', 1, NULL, '2026-02-19 03:19:02');
INSERT INTO `score` VALUES (298, 77, 51, '2026-02-19 07:00:04', '/scores/c7539c6e-5980-49d0-96f9-7654f751dfa7.jpg', 0, 0, NULL, NULL, 1, NULL, '2026-02-19 15:00:12');
INSERT INTO `score` VALUES (299, 77, 51, '2026-02-20 05:43:37', '/scores/c068b5d6-5b59-42af-9369-522f1991413c.jpg', 0, 0, NULL, '', 1, NULL, '2026-02-20 13:47:12');
INSERT INTO `score` VALUES (301, 77, 57, '2026-02-20 05:50:16', '/scores/58ba4f05-fc2a-498e-b7d1-eda750b6915c.png', 12, 1, NULL, NULL, 0, NULL, '2026-02-20 14:38:57');
INSERT INTO `score` VALUES (352, 82, 193, '2026-03-24 11:41:07', '/scores/902b21a8-1ff2-4b8d-b18c-bb9222449203.png', 11, 1, NULL, '', 0, '2026-03-24 11:41:07', '2026-03-24 11:46:21');
INSERT INTO `score` VALUES (353, 82, 40, '2026-03-24 12:25:43', '/scores/55379cdb-9d39-47cc-99ec-a1342a9a76da.jpg', 12, 1, NULL, '震撼美味', 0, '2026-03-24 12:25:43', '2026-03-24 15:03:38');
INSERT INTO `score` VALUES (354, 82, 211, '2026-03-24 13:23:58', '/scores/a790bbde-4480-4257-b628-aa07510da3e6.jpg', 11, 1, NULL, '', 0, '2026-03-24 13:23:58', '2026-03-24 15:03:42');
INSERT INTO `score` VALUES (355, 82, 39, '2026-03-24 13:48:22', '/scores/906bf194-6617-4e12-b923-abc569475074.jpg', 12, 1, NULL, '', 0, '2026-03-24 13:48:22', '2026-03-24 15:03:44');
INSERT INTO `score` VALUES (356, 82, 189, '2026-03-24 14:24:59', '/scores/5d72474e-710c-4933-8d66-5f1439c203d3.png', 11, 1, NULL, '', 0, '2026-03-24 14:24:59', '2026-03-24 15:03:46');
INSERT INTO `score` VALUES (357, 82, 91, '2026-03-24 17:57:08', '/scores/8d007ee3-dfe5-46e6-a2ef-cdd22384268b.png', 11, 1, NULL, '', 0, '2026-03-24 17:57:08', '2026-03-24 21:01:28');
INSERT INTO `score` VALUES (358, 82, 8, '2026-03-25 00:25:10', '/scores/b27b1382-4e80-4c1c-adab-fe6daeb4e8fd.png', 12, 1, NULL, '', 0, '2026-03-25 00:25:10', '2026-03-25 00:25:25');
INSERT INTO `score` VALUES (362, 82, 45, '2026-03-26 13:37:25', '/scores/c800f269-2fb2-4724-8e27-4698ade503bc.jpg', 12, 1, NULL, '', 0, '2026-03-26 13:37:25', '2026-03-27 10:26:14');
INSERT INTO `score` VALUES (363, 83, 39, '2026-03-28 10:07:36', '/scores/f839dc77-59b3-455f-87ac-de8227e9ec31.jpg', -2, 1, 3, '[#3] ', 0, '2026-03-28 10:07:36', '2026-03-28 10:17:54');
INSERT INTO `score` VALUES (364, 83, 39, '2026-03-28 10:13:10', '/scores/b9eb5692-51d4-4971-a053-ee63eaaa5f15.jpg', 5, 1, 2, '[#2] ', 0, '2026-03-28 10:13:10', '2026-03-28 10:18:12');
INSERT INTO `score` VALUES (365, 83, 159, '2026-03-28 10:14:12', '/scores/a9487eb4-f45f-4d30-b200-24e67560cadf.jpg', 5, 1, 1, '[#1] ', 0, '2026-03-28 10:14:12', '2026-03-28 10:18:22');
INSERT INTO `score` VALUES (366, 83, 230, '2026-03-28 10:15:32', '/scores/c85ea99c-5e91-4818-9448-22b43610c675.jpg', 5, 1, 24, '[#24] ', 0, '2026-03-28 10:15:32', '2026-03-28 10:24:45');
INSERT INTO `score` VALUES (367, 83, 39, '2026-03-28 10:20:03', '/scores/583de20d-ef9c-4d58-8e36-c2bc8c6f27d3.jpg', 5, 1, 15, '[#15] ', 0, '2026-03-28 10:20:03', '2026-03-28 10:24:55');
INSERT INTO `score` VALUES (368, 83, 199, '2026-03-28 10:22:56', '/scores/c2d9893e-e502-4f3b-b4da-35078491b076.jpg', 3, 1, 2, '', 0, '2026-03-28 10:22:56', '2026-03-28 10:25:14');
INSERT INTO `score` VALUES (369, 83, 39, '2026-03-28 10:23:01', '/scores/bfe2b894-17b9-4ec9-ba22-94b395084931.jpg', 3, 1, 1, '[#1] ', 0, '2026-03-28 10:23:01', '2026-03-28 10:25:38');
INSERT INTO `score` VALUES (370, 83, 39, '2026-03-28 10:25:08', '/scores/bbe79b6c-183b-4751-bd50-185548ee7669.jpg', 5, 1, 17, 'sv段落全miss', 0, '2026-03-28 10:25:08', '2026-03-28 10:25:48');
INSERT INTO `score` VALUES (371, 83, 159, '2026-03-28 10:27:48', '/scores/07af499f-4333-4396-adde-694c5cdc104f.png', -2, 1, 3, '[#3] ', 0, '2026-03-28 10:27:48', '2026-03-28 10:29:30');
INSERT INTO `score` VALUES (372, 83, 130, '2026-03-28 10:27:51', '/scores/f920b2b1-52b6-497b-8db3-affab61e493d.jpg', 5, 1, 9, '[#9] 紫风暴异像红风暴让猫对立笑着 我就死了', 0, '2026-03-28 10:27:51', '2026-03-28 10:29:53');
INSERT INTO `score` VALUES (373, 83, 42, '2026-03-28 10:29:08', '/scores/d7dd07e3-bf40-4857-b944-61adf13c1ded.jpg', 5, 1, 7, '[#7] ', 0, '2026-03-28 10:29:08', '2026-03-28 10:31:01');
INSERT INTO `score` VALUES (374, 83, 39, '2026-03-28 10:29:12', '/scores/ef4c9f90-1dda-4005-9403-cbad8321db8c.jpg', 3, 1, 24, '[#24] ', 0, '2026-03-28 10:29:12', '2026-03-28 10:30:34');
INSERT INTO `score` VALUES (375, 83, 39, '2026-03-28 10:32:25', '/scores/27f56837-df5f-4a2a-8a82-874f16a17fef.jpg', -1, 1, 7, '[#7] ', 0, '2026-03-28 10:32:25', '2026-03-28 10:32:43');
INSERT INTO `score` VALUES (376, 83, 232, '2026-03-28 10:35:12', '/scores/ed596942-1031-4860-b2f2-b15c6da001bd.jpg', -1, 1, 2, '[#2] ', 0, '2026-03-28 10:35:12', '2026-03-28 10:35:56');
INSERT INTO `score` VALUES (377, 83, 93, '2026-03-28 10:35:18', '/scores/ecbadcf5-2867-4c2a-831f-ffea440a86b6.jpg', 3, 1, 7, '[#7] ', 0, '2026-03-28 10:35:18', '2026-03-28 10:36:04');
INSERT INTO `score` VALUES (378, 83, 105, '2026-03-28 10:38:58', '/scores/4361637a-7293-4bf9-8e07-6809299e94de.jpg', 3, 1, 24, '[#24] ', 0, '2026-03-28 10:38:58', '2026-03-28 10:39:28');
INSERT INTO `score` VALUES (379, 83, 99, '2026-03-28 10:45:34', '', -2, 1, 25, '[#25] nm-y是美国曲师', 0, '2026-03-28 10:45:34', '2026-03-28 10:47:52');
INSERT INTO `score` VALUES (380, 83, 52, '2026-03-28 10:48:22', '/scores/0c1af98a-fbd7-4ad8-aaf6-f5be5b74e26f.jpg', 3, 1, 1, '[#1] ', 0, '2026-03-28 10:48:22', '2026-03-28 10:48:43');
INSERT INTO `score` VALUES (381, 83, 230, '2026-03-28 10:48:32', '/scores/bf5caeb9-b76a-453b-8b05-ee4f0a0a7335.jpg', -2, 1, 21, '[#21] ', 0, '2026-03-28 10:48:32', '2026-03-28 10:49:13');
INSERT INTO `score` VALUES (382, 83, 45, '2026-03-28 10:49:10', '/scores/1bc36eb9-6ff4-4829-b760-61af365fe999.jpg', 3, 1, 2, '[#2] ', 0, '2026-03-28 10:49:10', '2026-03-28 10:49:35');
INSERT INTO `score` VALUES (383, 83, 99, '2026-03-28 10:50:22', '/scores/5c9c34b6-697e-4f14-8e01-33b8eb0c020e.jpg', 5, 1, 25, '[#25] nm-y美国曲师', 0, '2026-03-28 10:50:22', '2026-03-28 10:50:32');
INSERT INTO `score` VALUES (384, 83, 199, '2026-03-28 10:54:21', '/scores/0fb01f83-c76f-4317-8787-d8626c2f27a5.png', 3, 1, 7, '[#7] ', 0, '2026-03-28 10:54:21', '2026-03-28 10:55:07');
INSERT INTO `score` VALUES (385, 83, 39, '2026-03-28 10:55:16', '/scores/bbb286ac-6472-4de6-9a47-6d9d97381e55.jpg', -2, 1, 21, '[#21] ', 0, '2026-03-28 10:55:16', '2026-03-28 11:11:21');
INSERT INTO `score` VALUES (386, 83, 126, '2026-03-28 10:55:17', '/scores/fdccf7ae-fc33-4544-aa96-cff622c16409.jpg', 2, 1, 1, 'XCCode', 0, '2026-03-28 10:55:17', '2026-03-28 10:55:28');
INSERT INTO `score` VALUES (387, 83, 85, '2026-03-28 10:56:01', '/scores/7d24e4b1-4465-4a33-bc19-e7e98a9cdba2.jpg', 5, 1, 21, '[#21] saki1箱', 0, '2026-03-28 10:56:01', '2026-03-28 10:57:00');
INSERT INTO `score` VALUES (388, 83, 39, '2026-03-28 10:57:20', '/scores/652050da-c786-40b9-a935-500a1048806c.jpg', 2, 1, 7, '[#7] ', 0, '2026-03-28 10:57:20', '2026-03-28 10:57:53');
INSERT INTO `score` VALUES (389, 83, 130, '2026-03-28 11:02:14', '/scores/7092ae24-8589-43cd-b7ce-43653bcb256c.jpg', -2, 1, 21, '[#21] ', 0, '2026-03-28 11:02:14', '2026-03-28 11:03:10');
INSERT INTO `score` VALUES (390, 83, 39, '2026-03-28 11:04:33', '/scores/56f7d4b6-c3e4-422b-969d-fc86048434cc.jpg', -2, 1, 22, '大划段落全miss', 0, '2026-03-28 11:04:33', '2026-03-28 11:05:05');
INSERT INTO `score` VALUES (391, 83, 86, '2026-03-28 11:05:32', '/scores/b3dd0ba4-e17b-4198-b48c-6dea06a9336b.png', -1, 1, 23, '[#23] 曲绘缺失部分拼出来恰好为random，一成不变的为m，推测为mas难度', 0, '2026-03-28 11:05:32', '2026-03-28 11:05:42');
INSERT INTO `score` VALUES (392, 83, 230, '2026-03-28 11:06:18', '/scores/96cbc2cb-d6a2-4579-8739-104af527c275.jpg', 5, 1, 5, '[#5] ', 0, '2026-03-28 11:06:18', '2026-03-28 11:07:02');
INSERT INTO `score` VALUES (393, 83, 105, '2026-03-28 11:07:07', '/scores/fa2166e1-20af-4722-bfee-2848a5b6e8ba.jpg', 2, 1, 2, '[#2] ', 0, '2026-03-28 11:07:07', '2026-03-28 11:07:44');
INSERT INTO `score` VALUES (394, 83, 126, '2026-03-28 11:08:22', '/scores/8b7f617a-2ec5-474c-a23c-aa3a0bbb3446.jpg', 3, 1, 25, '[#25] ', 0, '2026-03-28 11:08:22', '2026-03-28 11:09:09');
INSERT INTO `score` VALUES (395, 83, 39, '2026-03-28 11:11:05', '/scores/ecf0756a-e24c-4e17-aa1c-1d4bf165d527.jpg', -1, 1, 23, '[#23] ', 0, '2026-03-28 11:11:05', '2026-03-28 11:11:53');
INSERT INTO `score` VALUES (396, 83, 85, '2026-03-28 11:11:08', '/scores/54e27b10-fe6e-4b43-88de-36bf51b3f114.jpg', -2, 1, 9, '[#9] 游玩rip在日语念词后退出游玩', 0, '2026-03-28 11:11:08', '2026-03-28 11:11:48');
INSERT INTO `score` VALUES (397, 83, 45, '2026-03-28 11:11:52', '/scores/c7f6e76f-c171-46de-ba5f-77c20a52ee1b.jpg', -2, 1, 11, '[#11] ', 0, '2026-03-28 11:11:52', '2026-03-28 11:12:27');
INSERT INTO `score` VALUES (398, 83, 29, '2026-03-28 11:12:57', '/scores/d14044d9-07f9-4506-a233-64c1188601d4.jpeg', 2, 1, 2, '[#2] ', 0, '2026-03-28 11:12:57', '2026-03-28 11:13:14');
INSERT INTO `score` VALUES (399, 83, 29, '2026-03-28 11:14:27', '/scores/549eefcd-2242-4870-98e7-fcbccbf78875.png', -2, 1, 11, '[#11] ', 0, '2026-03-28 11:14:27', '2026-03-28 11:14:50');
INSERT INTO `score` VALUES (400, 83, 45, '2026-03-28 11:15:38', '/scores/5e9632e3-74a6-424a-b914-bd67fe9ec381.jpg', -2, 1, 11, '[#11] ', 0, '2026-03-28 11:15:38', '2026-03-28 11:16:41');
INSERT INTO `score` VALUES (401, 83, 199, '2026-03-28 11:16:15', '/scores/ebb3f509-6d0a-460b-9e02-76f5be112804.png', 2, 1, 24, '[#24] ', 0, '2026-03-28 11:16:15', '2026-03-28 11:16:30');
INSERT INTO `score` VALUES (402, 83, 29, '2026-03-28 11:17:00', '/scores/89a6589d-8d9e-47c9-ac62-cf98e9ec1396.png', -2, 1, 11, '[#11] ', 0, '2026-03-28 11:17:00', '2026-03-28 11:17:30');
INSERT INTO `score` VALUES (403, 83, 105, '2026-03-28 11:17:40', '/scores/c253320a-f4e4-4afd-a0de-e4c8f3923d9a.jpg', -2, 1, 3, '[#3] ', 0, '2026-03-28 11:17:40', '2026-03-28 11:18:23');
INSERT INTO `score` VALUES (404, 83, 130, '2026-03-28 11:18:40', '/scores/0c92fbb3-8902-47ce-9d67-9066f42a003a.jpg', 3, 1, 25, '[#25] ', 0, '2026-03-28 11:18:40', '2026-03-28 11:19:05');
INSERT INTO `score` VALUES (405, 83, 39, '2026-03-28 11:19:10', '/scores/41c74829-b4ce-427c-a4d9-474af49f4e14.jpg', 2, 1, 25, '[#25] ', 0, '2026-03-28 11:19:10', '2026-03-28 11:20:34');
INSERT INTO `score` VALUES (406, 83, 86, '2026-03-28 11:19:30', '/scores/bcf6d7be-750c-4c76-800a-2b46582b585d.png', 2, 1, 7, '[#7]适用重演游玩dis321', 0, '2026-03-28 11:19:30', '2026-03-28 11:19:51');
INSERT INTO `score` VALUES (407, 83, 74, '2026-03-28 11:19:50', '/scores/321131cc-49db-437d-a850-f95e8713bbee.jpg', -2, 1, 3, '[#3] ', 0, '2026-03-28 11:19:50', '2026-03-28 11:20:08');
INSERT INTO `score` VALUES (408, 83, 74, '2026-03-28 11:20:10', '/scores/fe0da068-2cdd-4970-ba01-d8e3c2b83998.jpg', -2, 1, 3, '[#3] ', 0, '2026-03-28 11:20:10', '2026-03-28 11:20:41');
INSERT INTO `score` VALUES (409, 83, 126, '2026-03-28 11:24:43', '/scores/f3a374c0-c658-4a7d-8fdc-1b74e2108024.jpg', 3, 1, 21, '[#21] ', 0, '2026-03-28 11:24:43', '2026-03-28 11:25:18');
INSERT INTO `score` VALUES (410, 83, 159, '2026-03-28 11:24:51', '/scores/50aed69b-563c-4944-8b14-bda57b7adaa2.jpg', 3, 1, 21, '[#21] 没有pjsk玩。。。', 0, '2026-03-28 11:24:51', '2026-03-28 11:25:07');
INSERT INTO `score` VALUES (411, 83, 42, '2026-03-28 11:26:15', '/scores/b84de216-fbee-48a6-84ff-1f9dbb692215.jpg', -2, 1, 23, '[#23] ', 0, '2026-03-28 11:26:15', '2026-03-28 11:26:59');
INSERT INTO `score` VALUES (412, 83, 74, '2026-03-28 11:26:54', '/scores/3476e676-fd53-4f5d-a1d3-298b9f146f6a.jpg', -2, 1, 20, '[#20] ', 0, '2026-03-28 11:26:54', '2026-03-28 11:27:05');
INSERT INTO `score` VALUES (413, 83, 86, '2026-03-28 11:33:36', '/scores/ebbf439f-cbe4-498c-9548-e21f96172536.png', -1, 1, 23, '[#23] 适用如图所示搭档游玩random', 0, '2026-03-28 11:33:36', '2026-03-28 11:34:16');
INSERT INTO `score` VALUES (414, 83, 39, '2026-03-28 11:36:02', '/scores/933d6deb-23b3-47af-9237-9feb38695717.jpg', 2, 1, 21, '[#21] ', 0, '2026-03-28 11:36:02', '2026-03-28 11:36:21');
INSERT INTO `score` VALUES (415, 83, 105, '2026-03-28 11:36:10', '/scores/39741e35-9220-4e5f-bd66-0bf3e1fc0d75.jpg', -2, 1, 11, '[#11] ', 0, '2026-03-28 11:36:10', '2026-03-28 11:36:25');
INSERT INTO `score` VALUES (416, 83, 39, '2026-03-28 11:37:08', '/scores/b29137c9-1e02-470a-a842-ed75c6967e1d.jpeg', -2, 1, 23, '[#23] ', 0, '2026-03-28 11:37:08', '2026-03-28 11:37:46');
INSERT INTO `score` VALUES (417, 83, 39, '2026-03-28 11:39:03', '/scores/d7f0c56b-db42-46f6-9e5a-fe56cf5299e3.jpg', -2, 1, 23, '[#23] ', 0, '2026-03-28 11:39:03', '2026-03-28 11:39:20');
INSERT INTO `score` VALUES (418, 83, 159, '2026-03-28 11:39:32', '/scores/ca247e49-0db2-4b40-ab2d-c4fd9ecdf7f6.jpg', -2, 1, 11, '[#11] ', 0, '2026-03-28 11:39:32', '2026-03-28 11:40:01');
INSERT INTO `score` VALUES (419, 83, 230, '2026-03-28 11:43:21', '/scores/e2a6e1c1-1b12-4573-a6aa-05e11263cc2d.jpg', -1, 1, 23, '[#23] ', 0, '2026-03-28 11:43:21', '2026-03-28 11:45:10');
INSERT INTO `score` VALUES (420, 83, 99, '2026-03-28 11:44:35', '/scores/6a3637da-21e8-458b-a27e-87b29cafee75.jpg', 2, 1, 7, '[#7] ', 0, '2026-03-28 11:44:35', '2026-03-28 11:45:04');
INSERT INTO `score` VALUES (421, 83, 93, '2026-03-28 11:44:45', '/scores/e54111f6-9ad0-4241-aa6d-dd1c0a4b4edc.jpg', -2, 1, 23, '[#23] ', 0, '2026-03-28 11:44:45', '2026-03-28 11:45:01');
INSERT INTO `score` VALUES (422, 83, 93, '2026-03-28 11:45:06', '/scores/08254f45-0960-4798-bd61-60a60d0d44b2.jpg', -2, 1, 23, '[#23] ', 0, '2026-03-28 11:45:06', '2026-03-28 11:45:19');
INSERT INTO `score` VALUES (423, 83, 85, '2026-03-28 11:45:24', '/scores/868e4de4-3444-43df-8fbf-502ed1f50622.jpg', -1, 1, 17, '[#17] ', 0, '2026-03-28 11:45:24', '2026-03-28 11:45:54');
INSERT INTO `score` VALUES (424, 83, 159, '2026-03-28 11:45:28', '/scores/92090011-5257-4a8e-bd9a-e8819bb9eff4.jpg', 5, 1, 19, '[#19] ', 0, '2026-03-28 11:45:28', '2026-03-28 11:45:50');
INSERT INTO `score` VALUES (425, 83, 159, '2026-03-28 11:45:56', '/scores/ecb04a5e-ebd3-460f-af71-db71a71db01b.jpg', -2, 1, 11, '[#11] ', 0, '2026-03-28 11:45:56', '2026-03-28 11:46:20');
INSERT INTO `score` VALUES (426, 83, 159, '2026-03-28 11:47:03', '/scores/2695fa41-90b6-4240-8053-70986e4c4379.jpg', -2, 1, 11, '[#11] ', 0, '2026-03-28 11:47:03', '2026-03-28 11:47:47');
INSERT INTO `score` VALUES (427, 83, 42, '2026-03-28 11:47:54', '/scores/8619ce29-4329-44bc-935e-66c30f42352a.jpg', -1, 1, 23, '[#23] ', 0, '2026-03-28 11:47:54', '2026-03-28 11:48:07');
INSERT INTO `score` VALUES (428, 83, 85, '2026-03-28 11:49:43', '/scores/3ceb8de6-be39-4344-88cb-32068b729b02.jpg', 3, 1, 15, '[#15] ', 0, '2026-03-28 11:49:43', '2026-03-28 11:50:48');
INSERT INTO `score` VALUES (429, 83, 233, '2026-03-28 11:52:26', '/scores/613ea4d5-e779-43e4-9775-b920c562a4ab.jpg', 3, 1, 19, '[#19] 在别的游戏找到极圈', 0, '2026-03-28 11:52:26', '2026-03-28 11:52:56');
INSERT INTO `score` VALUES (432, 83, 126, '2026-03-28 11:53:20', '/scores/7f1618c5-3fcf-4d44-86e5-a55b4873d5ba.jpg', 3, 1, 5, '[#5] ', 0, '2026-03-28 11:53:20', '2026-03-28 11:54:27');
INSERT INTO `score` VALUES (433, 83, 85, '2026-03-28 11:53:24', '/scores/1d21d1bc-4ca2-418b-b0cd-2c110e80dec4.jpg', -1, 1, 23, '[#23] ', 0, '2026-03-28 11:53:24', '2026-03-28 11:54:19');
INSERT INTO `score` VALUES (434, 83, 159, '2026-03-28 11:57:17', '/scores/8e21e10a-2078-4a06-99e8-211754e921c2.jpg', -2, 1, 11, '[#11] ', 0, '2026-03-28 11:57:17', '2026-03-28 11:58:13');
INSERT INTO `score` VALUES (435, 83, 85, '2026-03-28 11:57:55', '/scores/ac453a14-2c8e-4d78-9ec8-1ed7fcc7f5de.jpg', 3, 1, 17, '[#17] 谱面掉帧段放置', 0, '2026-03-28 11:57:55', '2026-03-28 11:58:08');
INSERT INTO `score` VALUES (436, 83, 199, '2026-03-28 12:02:05', '/scores/9731433c-85a8-43c4-94ad-f71e04575fc3.jpeg', 3, 1, 19, '[#19] ', 0, '2026-03-28 12:02:05', '2026-03-28 12:03:34');
INSERT INTO `score` VALUES (437, 83, 54, '2026-03-28 12:02:10', '/scores/3dc75a45-76b2-4228-b3b4-68ac5711abda.jpg', 2, 1, 24, '[#24] ', 0, '2026-03-28 12:02:10', '2026-03-28 12:03:30');
INSERT INTO `score` VALUES (438, 83, 29, '2026-03-28 12:02:47', '/scores/bdd7a583-ac5e-4106-980c-fdeb12383151.png', 2, 1, 7, '[#7] ', 0, '2026-03-28 12:02:47', '2026-03-28 12:03:29');
INSERT INTO `score` VALUES (439, 83, 74, '2026-03-28 12:03:36', '/scores/cafdc101-b704-489b-8e28-019a58f9471b.jpg', -2, 1, 11, '[#11] ', 0, '2026-03-28 12:03:36', '2026-03-28 12:04:00');
INSERT INTO `score` VALUES (440, 83, 8, '2026-03-28 12:05:04', '/scores/98405570-1591-4493-9d25-39379e4916e8.jpg', 5, 1, 22, '不打天键', 0, '2026-03-28 12:05:04', '2026-03-28 12:05:22');
INSERT INTO `score` VALUES (441, 83, 130, '2026-03-28 12:06:28', '', -2, 1, 11, '[#11] ', 0, '2026-03-28 12:06:28', '2026-03-28 12:07:45');
INSERT INTO `score` VALUES (442, 83, 230, '2026-03-28 12:07:08', '/scores/1f000d25-3ddc-4cc7-815c-b898bc4130ea.jpg', -2, 1, 11, '[#11] ', 0, '2026-03-28 12:07:08', '2026-03-28 12:07:43');
INSERT INTO `score` VALUES (443, 83, 159, '2026-03-28 12:08:02', '/scores/8e5d7f3c-af9c-42f6-9171-44d0c069340d.jpg', -2, 1, 11, '[#11] ', 0, '2026-03-28 12:08:02', '2026-03-28 12:08:33');
INSERT INTO `score` VALUES (444, 83, 74, '2026-03-28 12:09:03', '/scores/59bb6dc3-0190-41d7-b0db-0176b2b7f2eb.jpg', -2, 1, 11, '[#11] ', 0, '2026-03-28 12:09:03', '2026-03-28 12:10:04');
INSERT INTO `score` VALUES (445, 83, 85, '2026-03-28 12:09:18', '/scores/57b1c9f5-780a-4c28-b33c-b1b95490485e.jpg', -1, 1, 2, '[#2] ', 0, '2026-03-28 12:09:18', '2026-03-28 12:09:57');
INSERT INTO `score` VALUES (446, 83, 130, '2026-03-28 12:09:42', '/scores/5ddc0c85-8a5c-4ed3-9e82-43d7138064d7.jpg', -2, 1, 11, '[#11] ', 0, '2026-03-28 12:09:42', '2026-03-28 12:09:49');
INSERT INTO `score` VALUES (447, 83, 105, '2026-03-28 12:13:00', '/scores/13521612-9a9a-4a11-b679-60d80fce5585.jpg', -1, 1, 23, '[#23] 不打天键', 0, '2026-03-28 12:13:00', '2026-03-28 12:13:25');
INSERT INTO `score` VALUES (448, 83, 45, '2026-03-28 12:13:33', '/scores/6e6ca8c9-bde0-43d3-aae9-8514aab68a8d.jpg', -2, 1, 11, '[#11] ', 0, '2026-03-28 12:13:33', '2026-03-28 12:14:30');
INSERT INTO `score` VALUES (449, 83, 130, '2026-03-28 12:13:48', '/scores/734856bb-b87d-45d7-89a0-539d53fae456.jpg', -2, 1, 11, '[#11] ', 0, '2026-03-28 12:13:48', '2026-03-28 12:14:29');
INSERT INTO `score` VALUES (450, 83, 29, '2026-03-28 12:14:40', '/scores/79f1952c-fc0b-4589-ac5d-71d1728cbbdc.png', -2, 1, 11, '[#11] ', 0, '2026-03-28 12:14:40', '2026-03-28 12:15:28');
INSERT INTO `score` VALUES (451, 83, 45, '2026-03-28 12:16:20', '/scores/7e61f5f2-8fcb-4690-93cb-aa78638e4f1d.jpg', -2, 1, 11, '[#11] ', 0, '2026-03-28 12:16:20', '2026-03-28 12:17:35');
INSERT INTO `score` VALUES (452, 83, 199, '2026-03-28 12:17:10', '/scores/d3e46184-4970-44a5-a39b-a286d908e7ca.png', -2, 1, 10, '[#10] ', 0, '2026-03-28 12:17:10', '2026-03-28 12:46:52');
INSERT INTO `score` VALUES (453, 83, 93, '2026-03-28 12:17:49', '/scores/26f072ac-c43a-479f-b9fb-8f90ea988bc1.jpg', -2, 1, 23, '[#23] ', 0, '2026-03-28 12:17:49', '2026-03-28 12:19:58');
INSERT INTO `score` VALUES (454, 83, 130, '2026-03-28 12:18:00', '/scores/aa3e8b3d-69d0-4e6f-8cf0-358c215ad0c1.jpg', -2, 1, 11, '[#11] ', 0, '2026-03-28 12:18:00', '2026-03-28 12:19:57');
INSERT INTO `score` VALUES (455, 83, 29, '2026-03-28 12:18:02', '/scores/2b67367f-e353-4baf-aacb-b1907aab8523.png', -2, 1, 11, '[#11] ', 0, '2026-03-28 12:18:02', '2026-03-28 12:19:56');
INSERT INTO `score` VALUES (456, 83, 47, '2026-03-28 12:21:31', '/scores/4d68a337-9c5e-4f02-a273-8d986d6f126c.jpg', 3, 1, 9, '[#9] ', 0, '2026-03-28 12:21:31', '2026-03-28 12:22:16');
INSERT INTO `score` VALUES (457, 83, 85, '2026-03-28 12:22:04', '/scores/807805a9-c04d-40cf-8363-fc3acf9fe674.jpg', -1, 1, 2, '[#2] ', 0, '2026-03-28 12:22:04', '2026-03-28 12:22:41');
INSERT INTO `score` VALUES (458, 83, 126, '2026-03-28 12:22:28', '/scores/3c242f1f-6570-4077-880d-a1b148ad5c72.jpg', -1, 1, 20, '[#20] ', 0, '2026-03-28 12:22:28', '2026-03-28 12:26:53');
INSERT INTO `score` VALUES (459, 83, 121, '2026-03-28 12:26:05', '', -2, 1, 19, '[#19] ', 0, '2026-03-28 12:26:05', '2026-03-28 12:28:43');
INSERT INTO `score` VALUES (460, 83, 85, '2026-03-28 12:27:03', '/scores/d6e469d0-1a16-4bf8-bb11-0c6e24e9e659.jpg', -1, 1, 22, '[#22] ', 0, '2026-03-28 12:27:03', '2026-03-28 12:47:01');
INSERT INTO `score` VALUES (461, 83, 105, '2026-03-28 12:27:04', '/scores/345dccad-52a0-493a-98bd-2491318e003d.jpg', -1, 1, 23, '[#23] ', 0, '2026-03-28 12:27:04', '2026-03-28 12:28:42');
INSERT INTO `score` VALUES (462, 83, 93, '2026-03-28 12:29:43', '/scores/ca726516-1d55-4f80-8e44-6f1ece4099f4.jpg', -1, 1, 22, '[#22] ', 0, '2026-03-28 12:29:43', '2026-03-28 12:34:44');
INSERT INTO `score` VALUES (463, 83, 8, '2026-03-28 12:29:47', '/scores/1201563d-e899-4ff2-b07a-5d3a2fd8a457.png', 5, 1, 23, '[#23] 游玩random【M】', 0, '2026-03-28 12:29:47', '2026-03-28 12:35:09');
INSERT INTO `score` VALUES (464, 83, 159, '2026-03-28 12:33:18', '/scores/2ca57879-f304-4e56-ab53-fd1df20a5ee3.jpg', 3, 1, 17, '[#17] sv放置', 0, '2026-03-28 12:33:18', '2026-03-28 12:35:13');
INSERT INTO `score` VALUES (465, 83, 121, '2026-03-28 12:35:21', '', 2, 1, 19, '[#19] ', 0, '2026-03-28 12:35:21', '2026-03-28 12:38:00');
INSERT INTO `score` VALUES (466, 83, 130, '2026-03-28 12:37:36', '/scores/7f755da5-62b6-4209-ab9e-98063400288d.jpg', -2, 1, 11, '[#11] ', 0, '2026-03-28 12:37:36', '2026-03-28 12:38:44');
INSERT INTO `score` VALUES (467, 83, 86, '2026-03-28 12:38:40', '/scores/3db318ad-ed9d-4039-9199-6748843c8e1f.png', -1, 1, 23, '[#23] 长按M进行游玩', 0, '2026-03-28 12:38:40', '2026-03-28 12:39:49');
INSERT INTO `score` VALUES (468, 83, 86, '2026-03-28 12:38:40', '/scores/581280e0-70a4-4665-9530-0d20f03ed3be.png', -1, 1, 23, '[#23] 长按M进行游玩', 0, '2026-03-28 12:38:40', '2026-03-28 12:39:49');
INSERT INTO `score` VALUES (469, 83, 86, '2026-03-28 12:38:40', '/scores/b94882be-cc3e-4145-baa8-523ea4eca7de.png', 3, 1, 23, '[#23] 长按M进行游玩', 0, '2026-03-28 12:38:40', '2026-03-28 12:39:44');
INSERT INTO `score` VALUES (470, 83, 93, '2026-03-28 12:39:41', '/scores/3ac680d5-94f7-4a9a-88ba-368f0423f6c0.jpg', -1, 1, 22, '[#22]硬核挑战终极审判模式 放置', 0, '2026-03-28 12:39:41', '2026-03-28 12:40:13');
INSERT INTO `score` VALUES (471, 83, 52, '2026-03-28 12:39:53', '/scores/7872f980-8017-4667-88ce-99ba87916bba.jpg', 3, 1, 5, '[#5] ', 0, '2026-03-28 12:39:53', '2026-03-28 12:41:25');
INSERT INTO `score` VALUES (472, 83, 52, '2026-03-28 12:40:21', '/scores/0add447a-fa11-4143-8682-3f6d62525ba3.jpg', 2, 1, 21, '[#21] ', 0, '2026-03-28 12:40:21', '2026-03-28 12:41:21');
INSERT INTO `score` VALUES (473, 83, 85, '2026-03-28 12:40:23', '/scores/9c7f49e0-7463-4725-aab9-492b5bf756b8.jpg', 3, 1, 9, '[#9] 风暴进入异象跳阶后tl', 0, '2026-03-28 12:40:23', '2026-03-28 12:41:15');
INSERT INTO `score` VALUES (474, 83, 159, '2026-03-28 12:40:27', '/scores/01550598-a239-4f7e-b2c5-db26e1958de0.jpg', -1, 1, 22, '[#22] 中段演出放置', 0, '2026-03-28 12:40:27', '2026-03-28 12:41:30');
INSERT INTO `score` VALUES (475, 83, 52, '2026-03-28 12:40:41', '/scores/b6919f3a-af3e-4ca8-987e-c72eae8f6a94.jpg', 2, 1, 25, '[#25] ', 0, '2026-03-28 12:40:41', '2026-03-28 12:41:40');
INSERT INTO `score` VALUES (476, 83, 45, '2026-03-28 12:40:41', '/scores/83862620-b9dd-4446-a3ba-2962f91b121f.jpg', 2, 1, 7, '[#7] ', 0, '2026-03-28 12:40:41', '2026-03-28 12:41:33');
INSERT INTO `score` VALUES (477, 83, 130, '2026-03-28 12:41:08', '/scores/22963cdc-995b-4cca-a749-d92881903187.jpg', -2, 1, 11, '[#11] ', 0, '2026-03-28 12:41:08', '2026-03-28 12:41:44');
INSERT INTO `score` VALUES (478, 83, 199, '2026-03-28 12:44:37', '/scores/a394181d-8cec-48c6-b58f-ee4b096529f9.png', 5, 1, 3, '[#3] ', 0, '2026-03-28 12:44:37', '2026-03-28 12:46:34');
INSERT INTO `score` VALUES (479, 83, 8, '2026-03-28 12:48:10', '/scores/b12ba724-5d4a-4b27-bd16-ea4c4ea8024a.jpg', 2, 1, 9, '[#9] 异象之后放置', 0, '2026-03-28 12:48:10', '2026-03-28 12:48:28');
INSERT INTO `score` VALUES (480, 83, 159, '2026-03-28 12:48:21', '', -1, 1, 22, '[#22] 中段演出坠机', 0, '2026-03-28 12:48:21', '2026-03-28 12:50:44');
INSERT INTO `score` VALUES (481, 83, 85, '2026-03-28 12:49:59', '/scores/1d738d5e-3c0e-48fa-ac44-1938f88bb397.jpg', -2, 1, 3, '[#3] ', 0, '2026-03-28 12:49:59', '2026-03-28 12:50:31');
INSERT INTO `score` VALUES (482, 83, 105, '2026-03-28 12:51:34', '/scores/3c4d50db-b06c-4c12-ad29-4c3cdd76a1d6.jpg', 2, 1, 9, '[#9] ', 0, '2026-03-28 12:51:34', '2026-03-28 12:55:16');
INSERT INTO `score` VALUES (483, 83, 93, '2026-03-28 12:53:57', '/scores/6d8f6626-a308-4b1c-a149-cbc9f56f89cc.jpg', 2, 1, 9, '[#9] 骨折光打风暴 异象后放置', 0, '2026-03-28 12:53:57', '2026-03-28 12:55:12');
INSERT INTO `score` VALUES (484, 83, 136, '2026-03-28 12:55:57', '/scores/e79b1b1c-7f84-415a-8dc4-4532047adfee.jpeg', 5, 1, 20, '[#20] 天盖', 0, '2026-03-28 12:55:57', '2026-03-28 12:56:49');
INSERT INTO `score` VALUES (485, 83, 99, '2026-03-28 12:56:04', '/scores/3cdc2092-88ae-451b-81b5-f96a36f45342.jpg', -1, 1, 2, '[#2] >=607928', 0, '2026-03-28 12:56:04', '2026-03-28 12:56:54');
INSERT INTO `score` VALUES (486, 83, 105, '2026-03-28 12:56:24', '', 3, 1, 3, '[#3] chaos', 0, '2026-03-28 12:56:24', '2026-03-28 12:56:55');
INSERT INTO `score` VALUES (487, 83, 136, '2026-03-28 13:00:02', '/scores/9c79b03d-4a6b-462f-9a8a-b862a2504197.jpeg', -2, 1, 11, '[#11] 纯外键游玩', 0, '2026-03-28 13:00:02', '2026-03-28 13:00:27');
INSERT INTO `score` VALUES (488, 83, 99, '2026-03-28 13:01:14', '/scores/c1bd4b04-2eb7-4eba-823e-3389304b105f.jpg', -1, 1, 2, '[#2] N=10,000,000;M=6000000/π²≈607927', 0, '2026-03-28 13:01:14', '2026-03-28 13:02:08');
INSERT INTO `score` VALUES (489, 83, 93, '2026-03-28 13:01:28', '/scores/be98ebee-71e4-4826-9239-2d1c9e37c053.jpg', 2, 1, 17, '[#17] AQ卡顿段全放置', 0, '2026-03-28 13:01:28', '2026-03-28 13:02:02');
INSERT INTO `score` VALUES (490, 83, 85, '2026-03-28 13:03:16', '/scores/f4aea26a-dcff-4b14-938d-d925a06089e6.jpg', 5, 1, 12, '[#12] ieo里谱', 0, '2026-03-28 13:03:16', '2026-03-28 13:05:18');
INSERT INTO `score` VALUES (491, 83, 222, '2026-03-28 13:06:33', '/scores/2847e8e0-48a1-48ca-9a64-c3492c8c0c55.jpg', -2, 1, 20, '[#20] ', 0, '2026-03-28 13:06:33', '2026-03-28 13:08:11');
INSERT INTO `score` VALUES (492, 83, 136, '2026-03-28 13:07:59', '/scores/27df3fab-9187-4682-bb61-43e9c8dcc079.jpeg', -1, 1, 16, '[#16] 跟着pv跳舞', 0, '2026-03-28 13:07:59', '2026-03-28 13:08:45');
INSERT INTO `score` VALUES (493, 83, 222, '2026-03-28 13:14:02', '/scores/241cfdd4-3741-4569-abc9-b32545d846f2.jpg', -2, 1, 20, '[#20] ', 0, '2026-03-28 13:14:02', '2026-03-28 13:15:40');
INSERT INTO `score` VALUES (494, 83, 136, '2026-03-28 13:15:24', '/scores/073dd82e-7d13-4a89-bfe8-98821b4e3b4b.jpeg', -2, 1, 11, '[#11] 纯外键游玩', 0, '2026-03-28 13:15:24', '2026-03-28 13:15:33');
INSERT INTO `score` VALUES (495, 83, 136, '2026-03-28 13:17:05', '/scores/e0715ebf-0ffe-46f7-8d01-f4a537c8842a.jpeg', -1, 1, 16, '[#16] pv出现小人时不打，摆图中pose', 0, '2026-03-28 13:17:05', '2026-03-28 13:17:37');
INSERT INTO `score` VALUES (496, 83, 105, '2026-03-28 13:18:52', '/scores/3e50032c-c51c-4f98-89cd-8393cbc4e4e2.jpg', -2, 1, 20, '[#20] ', 0, '2026-03-28 13:18:52', '2026-03-28 13:19:29');
INSERT INTO `score` VALUES (497, 83, 93, '2026-03-28 13:22:18', '/scores/795e998a-61db-487c-bab3-50461c4a5d5e.jpg', 2, 1, 2, '[#2] ', 0, '2026-03-28 13:22:18', '2026-03-28 13:23:20');
INSERT INTO `score` VALUES (498, 83, 105, '2026-03-28 13:22:31', '/scores/3b906b36-8c02-4c4c-94fe-8cc23f3b7cb1.jpg', -1, 1, 20, '[#20] ', 0, '2026-03-28 13:22:31', '2026-03-28 13:23:24');
INSERT INTO `score` VALUES (499, 83, 136, '2026-03-28 13:26:20', '/scores/c33a5109-dd55-4be5-a8e3-be200fa78071.jpeg', -1, 1, 16, '[#16] 背对着小人跳舞', 0, '2026-03-28 13:26:20', '2026-03-28 13:27:18');
INSERT INTO `score` VALUES (500, 83, 126, '2026-03-28 13:28:14', '/scores/cc0bed5b-0164-4c3c-98f9-e1ffd9a5cb1c.jpg', -2, 1, 10, '[#10] ', 0, '2026-03-28 13:28:14', '2026-03-28 13:30:41');
INSERT INTO `score` VALUES (501, 83, 86, '2026-03-28 13:29:02', '/scores/075d6e64-20f6-4a94-bc43-9dce8913a9e7.jpg', -1, 1, 2, '[#2] ', 0, '2026-03-28 13:29:02', '2026-03-28 13:30:45');
INSERT INTO `score` VALUES (502, 83, 105, '2026-03-28 13:30:42', '/scores/6164ba79-ea0c-4875-8695-e532a6fc57ab.jpg', -1, 1, 20, '[#20] ', 0, '2026-03-28 13:30:42', '2026-03-28 13:32:31');
INSERT INTO `score` VALUES (503, 83, 42, '2026-03-28 13:33:15', '/scores/aebd3e3e-7dbf-43f4-a314-19d79894f2df.jpg', -1, 1, 20, '[#20] ', 0, '2026-03-28 13:33:15', '2026-03-28 13:35:46');
INSERT INTO `score` VALUES (504, 83, 222, '2026-03-28 13:33:23', '/scores/2b7b5a3d-3fde-4ca0-9712-fc257d23f88e.jpg', -1, 1, 20, '[#20] ', 0, '2026-03-28 13:33:23', '2026-03-28 13:35:52');
INSERT INTO `score` VALUES (505, 83, 222, '2026-03-28 13:33:23', '/scores/2b7b5a3d-3fde-4ca0-9712-fc257d23f88e.jpg', -1, 1, 20, '[#20] ', 0, '2026-03-28 13:33:23', '2026-03-28 13:35:52');
INSERT INTO `score` VALUES (506, 83, 222, '2026-03-28 13:36:52', '/scores/f0abfd24-4d10-4317-a121-f65bc3516e93.jpg', 3, 1, 20, '[#20] ', 0, '2026-03-28 13:36:52', '2026-03-28 13:37:33');
INSERT INTO `score` VALUES (507, 83, 93, '2026-03-28 13:38:25', '/scores/ae505db7-1af0-4196-8d12-12014142e301.jpg', -1, 1, 23, '[#23] ', 0, '2026-03-28 13:38:25', '2026-03-28 13:39:42');
INSERT INTO `score` VALUES (508, 83, 130, '2026-03-28 13:38:32', '/scores/28d4e0c7-2545-42b9-91ed-0ffe275303c1.jpg', 2, 1, 21, '补一下', 0, '2026-03-28 13:38:32', '2026-03-28 13:40:03');
INSERT INTO `score` VALUES (509, 83, 126, '2026-03-28 13:41:32', '/scores/8e3ef836-9801-4762-ba74-5c87503246b9.jpg', -2, 1, 18, '1速游玩', 0, '2026-03-28 13:41:32', '2026-03-28 13:42:14');
INSERT INTO `score` VALUES (510, 83, 230, '2026-03-28 13:44:24', '/scores/82806fa6-3b7b-44b0-823d-1b44bad279c7.jpg', 3, 1, 20, '出自天盖', 0, '2026-03-28 13:44:24', '2026-03-28 13:45:58');
INSERT INTO `score` VALUES (511, 83, 86, '2026-03-28 13:44:27', '/scores/e019df4d-285b-404f-ab66-7389197bf420.png', 2, 1, 2, '[#2] ', 0, '2026-03-28 13:44:27', '2026-03-28 13:46:44');
INSERT INTO `score` VALUES (512, 83, 105, '2026-03-28 13:45:53', '/scores/ece3f65b-b50b-4173-a997-c7e9df28f06e.jpg', -1, 1, 20, '[#20] 开全反', 0, '2026-03-28 13:45:53', '2026-03-28 13:47:01');
INSERT INTO `score` VALUES (513, 83, 230, '2026-03-28 13:46:34', '/scores/033a5494-4471-4395-bbe7-822e3fe1612c.jpg', 5, 1, 4, '单手play GoBack2YourRave', 0, '2026-03-28 13:46:34', '2026-03-28 13:47:27');
INSERT INTO `score` VALUES (514, 83, 126, '2026-03-28 13:50:54', '/scores/ce97b578-cf6c-4890-b082-c03dd3896ac5.jpg', -2, 1, 14, '[#14] ', 0, '2026-03-28 13:50:54', '2026-03-28 13:51:32');
INSERT INTO `score` VALUES (515, 83, 54, '2026-03-28 13:51:36', '/scores/cfc2dcc3-e281-4565-887a-364192e077b9.jpg', 3, 1, 12, '[#12] ', 0, '2026-03-28 13:51:36', '2026-03-28 13:52:31');
INSERT INTO `score` VALUES (516, 83, 159, '2026-03-28 13:52:49', '/scores/ef1d0539-a20c-449d-b174-20997ca776d0.jpg', -1, 1, 16, '[#16] 只打跳舞', 0, '2026-03-28 13:52:49', '2026-03-28 13:56:37');
INSERT INTO `score` VALUES (517, 83, 159, '2026-03-28 13:53:30', '/scores/31f25dc0-6708-4ded-aa67-bf8c4e01fc97.jpg', -1, 1, 4, '[#4] 单手打', 0, '2026-03-28 13:53:30', '2026-03-28 13:58:44');
INSERT INTO `score` VALUES (518, 83, 126, '2026-03-28 13:56:03', '/scores/f2f3dff3-4c92-4cc7-8a14-92394b19508b.jpg', -2, 1, 18, '1速', 0, '2026-03-28 13:56:03', '2026-03-28 13:59:07');
INSERT INTO `score` VALUES (519, 83, 8, '2026-03-28 13:56:44', '/scores/9bb741f6-0ebb-4e41-9187-050beb0a1082.png', -2, 1, 8, '[#8] 就问你是不是578吧', 0, '2026-03-28 13:56:44', '2026-03-28 13:59:21');
INSERT INTO `score` VALUES (520, 83, 233, '2026-03-28 13:56:52', '/scores/6fbd5335-fb38-4e11-a9b8-0cc8f03f7994.jpg', -1, 1, 16, '[#16] 跟着背景跳舞', 0, '2026-03-28 13:56:52', '2026-03-28 13:59:26');
INSERT INTO `score` VALUES (521, 83, 230, '2026-03-28 13:58:53', '/scores/a1ce314d-5c5d-4146-a813-8e8a06ef4e96.jpg', -1, 1, 19, '[#19] ', 0, '2026-03-28 13:58:53', '2026-03-28 13:59:53');
INSERT INTO `score` VALUES (522, 83, 52, '2026-03-28 13:59:29', '/scores/e41b0cc2-4391-45d0-aa19-4677e0b6e20f.png', 3, 1, 12, '[#12] ', 0, '2026-03-28 13:59:29', '2026-03-28 14:00:29');
INSERT INTO `score` VALUES (523, 83, 159, '2026-03-28 14:03:13', '/scores/192cea72-757e-4a8c-9792-01c70a022d1d.jpg', 3, 1, 4, '[#4]只 用右手打', 0, '2026-03-28 14:03:13', '2026-03-28 14:04:03');
INSERT INTO `score` VALUES (524, 83, 85, '2026-03-28 14:03:32', '/scores/3a5038e8-93df-4862-9c83-596f713cc129.jpg', -1, 1, 22, '[#22] 带有蜘蛛网的tap不打击', 0, '2026-03-28 14:03:32', '2026-03-28 14:04:26');
INSERT INTO `score` VALUES (525, 83, 199, '2026-03-28 14:06:06', '/scores/adce82c5-f1dd-458c-8e44-2e2d2c059fd1.jpg', 3, 1, 4, '单手游玩gb2yr', 0, '2026-03-28 14:06:06', '2026-03-28 14:07:42');
INSERT INTO `score` VALUES (526, 83, 121, '2026-03-28 14:06:36', '/scores/86cfa779-d091-4f55-ba00-16edec592801.jpg', 2, 1, 4, '[#4] 右手单手游玩', 0, '2026-03-28 14:06:36', '2026-03-28 14:07:45');
INSERT INTO `score` VALUES (527, 83, 29, '2026-03-28 14:07:37', '/scores/4c9ead04-bf28-4128-8c49-c645618ebac5.jpeg', -1, 1, 20, '只打花星星', 0, '2026-03-28 14:07:37', '2026-03-28 14:08:00');
INSERT INTO `score` VALUES (528, 83, 233, '2026-03-28 14:09:26', '/scores/1d4a302c-b236-45d3-a1ae-fc3c369d20ae.jpg', 2, 1, 4, '[#4] 单手', 0, '2026-03-28 14:09:26', '2026-03-28 14:10:03');
INSERT INTO `score` VALUES (529, 83, 199, '2026-03-28 14:09:39', '/scores/269ddbfa-317b-4f8a-af64-08c5fc3d76e6.jpg', -2, 1, 11, '外键游玩妈宝蓝', 0, '2026-03-28 14:09:39', '2026-03-28 14:09:51');
INSERT INTO `score` VALUES (530, 83, 159, '2026-03-28 14:10:30', '/scores/81ede04d-8b46-461f-95d8-a8ca4ff0a87f.jpg', 5, 1, 16, '[#16] 只打两段跳舞', 0, '2026-03-28 14:10:30', '2026-03-28 14:11:58');
INSERT INTO `score` VALUES (531, 83, 8, '2026-03-28 14:10:59', '/scores/479fdaf9-6ac2-4aa2-8f9d-64d4fb4edd1b.jpg', 2, 1, 4, '[#4] 单手游玩', 0, '2026-03-28 14:10:59', '2026-03-28 14:11:27');
INSERT INTO `score` VALUES (532, 83, 159, '2026-03-28 14:11:21', '/scores/686ff0bc-fd51-477f-b820-9b5a8031f58b.jpg', -1, 1, 20, '[#20] 不打花星星', 0, '2026-03-28 14:11:21', '2026-03-28 14:11:40');
INSERT INTO `score` VALUES (533, 83, 230, '2026-03-28 14:16:19', '/scores/823f740f-0be3-4bd5-b2f8-8e49fe9358da.jpg', -2, 1, 3, '[#3] ', 0, '2026-03-28 14:16:19', '2026-03-28 14:16:43');
INSERT INTO `score` VALUES (534, 83, 8, '2026-03-28 14:16:56', '/scores/3ae26232-2a48-4c20-81eb-4ca68305bdb7.png', 5, 1, 8, '[#8] ', 0, '2026-03-28 14:16:56', '2026-03-28 14:17:02');
INSERT INTO `score` VALUES (535, 83, 233, '2026-03-28 14:17:51', '/scores/e36394e3-75fd-40e5-918b-825e3bb34e0b.jpg', -1, 1, 16, '[#16] 只打跳舞段落', 0, '2026-03-28 14:17:51', '2026-03-28 14:19:56');
INSERT INTO `score` VALUES (536, 83, 8, '2026-03-28 14:20:30', '/scores/313fd5df-3eb4-4c08-8e6b-0d812dc9580c.jpg', -1, 1, 16, '[#16] 跳舞', 0, '2026-03-28 14:20:30', '2026-03-28 14:20:36');
INSERT INTO `score` VALUES (537, 83, 126, '2026-03-28 14:21:42', '/scores/86e245be-b1fb-4b7f-8b7c-ef7698d3bd7d.jpg', -2, 1, 18, '[#18] 1速', 0, '2026-03-28 14:21:42', '2026-03-28 14:23:35');
INSERT INTO `score` VALUES (538, 83, 199, '2026-03-28 14:21:43', '/scores/4d3737b0-dbec-4bf2-8050-f311877b019e.jpg', 5, 1, 11, '外键游玩附魔爱2', 0, '2026-03-28 14:21:43', '2026-03-28 14:23:48');
INSERT INTO `score` VALUES (539, 83, 159, '2026-03-28 14:25:20', '/scores/c5122a73-101c-4f26-a518-399f938c903e.jpg', 3, 1, 11, '[#11] 纯外键', 0, '2026-03-28 14:25:20', '2026-03-28 14:25:39');
INSERT INTO `score` VALUES (540, 83, 105, '2026-03-28 14:26:55', '/scores/dc291750-61bb-4c8e-8e94-bdc330460d24.jpg', -2, 1, 4, '[#4] 单手打', 0, '2026-03-28 14:26:55', '2026-03-28 14:30:13');
INSERT INTO `score` VALUES (541, 83, 105, '2026-03-28 14:30:50', '/scores/29b5e605-1926-4dd0-843d-dd8d05c528d7.jpg', -1, 1, 4, '[#4] 单手玩', 0, '2026-03-28 14:30:50', '2026-03-28 14:36:00');
INSERT INTO `score` VALUES (542, 83, 199, '2026-03-28 14:34:39', '/scores/2925d9a8-6855-482e-bc6a-a2cf733ec360.jpg', -1, 1, 16, '只打有小人跳舞的地方', 0, '2026-03-28 14:34:39', '2026-03-28 14:47:56');
INSERT INTO `score` VALUES (543, 83, 105, '2026-03-28 14:34:56', '/scores/13c46640-59a6-4a93-88d9-c8db7b434f7c.jpg', 2, 1, 20, '[#20] ', 0, '2026-03-28 14:34:56', '2026-03-28 14:48:06');
INSERT INTO `score` VALUES (544, 83, 130, '2026-03-28 14:35:38', '/scores/4d1e3cd0-3c4d-47b0-b0e7-4b3134760d7e.jpg', -1, 1, 16, '[#16] 只打跳舞', 0, '2026-03-28 14:35:38', '2026-03-28 14:48:11');
INSERT INTO `score` VALUES (545, 83, 121, '2026-03-28 14:36:27', '', 3, 1, 16, '[#16] 在小人跳舞的时候打', 0, '2026-03-28 14:36:27', '2026-03-28 14:52:32');
INSERT INTO `score` VALUES (546, 83, 8, '2026-03-28 14:36:31', '/scores/bf5193e0-d4e7-402d-9c8e-87fdd0bed01d.jpg', -1, 1, 16, '[#16] 跳舞', 0, '2026-03-28 14:36:31', '2026-03-28 14:52:43');
INSERT INTO `score` VALUES (547, 83, 105, '2026-03-28 14:37:26', '/scores/d7a437ba-8e15-4b51-bdb1-f77ac7cf488a.jpg', 2, 1, 4, '[#4] 右手打的', 0, '2026-03-28 14:37:26', '2026-03-28 14:49:16');
INSERT INTO `score` VALUES (548, 83, 42, '2026-03-28 14:37:56', '/scores/8cfb7dcb-548e-4140-a56c-5306b4469884.jpg', -1, 1, 22, '[#22] 终极审判', 0, '2026-03-28 14:37:56', '2026-03-28 14:49:22');
INSERT INTO `score` VALUES (549, 83, 85, '2026-03-28 14:40:01', '/scores/077e240a-9ae0-4ff9-ba85-16f74e4476aa.jpg', -1, 1, 22, '[#22] tl', 0, '2026-03-28 14:40:01', '2026-03-28 14:43:31');
INSERT INTO `score` VALUES (550, 83, 52, '2026-03-28 14:41:21', '/scores/10819b46-91b9-41a0-a8d9-45737d69deb7.jpg', 2, 1, 17, '[#17] 放置sv段', 0, '2026-03-28 14:41:21', '2026-03-28 14:49:24');
INSERT INTO `score` VALUES (551, 83, 105, '2026-03-28 14:44:56', '/scores/466d72dd-549c-407b-ad15-dab031357ae4.jpg', -2, 1, 17, '[#17] 卡顿段全放掉', 0, '2026-03-28 14:44:56', '2026-03-28 14:48:06');
INSERT INTO `score` VALUES (552, 83, 8, '2026-03-28 14:48:22', '/scores/8f8a5953-446d-4565-a89d-ddb91a35bc48.jpg', 3, 1, 11, '[#11] 全外', 0, '2026-03-28 14:48:22', '2026-03-28 14:49:47');
INSERT INTO `score` VALUES (553, 83, 136, '2026-03-28 14:48:27', '/scores/d2779a7e-2a69-42af-83f6-274774ffe1fd.jpeg', 2, 1, 9, '[#9] 在进入byd异象时结束游戏', 0, '2026-03-28 14:48:27', '2026-03-28 14:49:44');
INSERT INTO `score` VALUES (554, 83, 45, '2026-03-28 14:49:40', '/scores/34eec234-907e-455c-9376-8b10e4b262df.jpg', -1, 1, 16, '[#16] ', 0, '2026-03-28 14:49:40', '2026-03-28 14:52:59');
INSERT INTO `score` VALUES (555, 83, 45, '2026-03-28 14:50:48', '/scores/4dc9c12b-8e84-4940-a0b1-6c295972d895.jpg', -1, 1, 4, '[#4] ', 0, '2026-03-28 14:50:48', '2026-03-28 14:55:15');
INSERT INTO `score` VALUES (556, 83, 52, '2026-03-28 14:51:54', '/scores/67b0d4f7-ec51-45e6-955b-3195555c4763.jpg', 2, 1, 9, '[#9] 异象后放置', 0, '2026-03-28 14:51:54', '2026-03-28 14:55:29');
INSERT INTO `score` VALUES (557, 83, 130, '2026-03-28 14:53:15', '/scores/f775733a-2351-42a3-b72d-d15d22bdd454.jpg', 2, 1, 11, '[#11] ', 0, '2026-03-28 14:53:15', '2026-03-28 14:55:42');
INSERT INTO `score` VALUES (558, 83, 199, '2026-03-28 14:54:24', '/scores/ec70540b-f0ae-4799-9687-371aaa2723d4.jpg', 2, 1, 17, '掉帧段放置', 0, '2026-03-28 14:54:24', '2026-03-28 14:55:51');
INSERT INTO `score` VALUES (559, 83, 105, '2026-03-28 14:54:59', '/scores/bc2583ad-59cc-4f7d-897a-265d82733c4b.jpg', 2, 1, 17, '[#17] 卡顿段全放掉', 0, '2026-03-28 14:54:59', '2026-03-28 14:55:59');
INSERT INTO `score` VALUES (560, 83, 45, '2026-03-28 14:56:35', '/scores/167747eb-a157-474d-906c-8a05d33ff6f5.jpg', 2, 1, 4, '[#4] 严肃单手游玩', 0, '2026-03-28 14:56:35', '2026-03-28 14:59:42');
INSERT INTO `score` VALUES (561, 83, 126, '2026-03-28 14:57:23', '/scores/5a51fbc7-41e4-4f48-b4b3-14ac9461d325.jpg', -1, 1, 22, '[#22] ', 0, '2026-03-28 14:57:23', '2026-03-28 14:58:07');
INSERT INTO `score` VALUES (562, 83, 39, '2026-03-28 14:58:49', '/scores/92421370-bb1f-477e-ae3c-ba6a15a646a4.jpg', 2, 1, 12, '[#12] ', 0, '2026-03-28 14:58:49', '2026-03-28 14:59:48');
INSERT INTO `score` VALUES (563, 83, 126, '2026-03-28 15:02:38', '/scores/8552ef6d-b1cd-4305-ace0-a95363adf80f.jpg', 3, 1, 22, '[#22] 终极审判', 0, '2026-03-28 15:02:38', '2026-03-28 15:03:39');
INSERT INTO `score` VALUES (564, 83, 105, '2026-03-28 15:03:11', '/scores/0238e73b-3805-41fa-a14d-a377eba8bf0c.jpg', -1, 1, 23, '[#23] 可恶的超V蓝🐱', 0, '2026-03-28 15:03:11', '2026-03-28 15:04:13');
INSERT INTO `score` VALUES (565, 83, 136, '2026-03-28 15:08:34', '/scores/381aee28-df45-42a4-80c9-d6bb740c7fd5.jpeg', -1, 1, 16, '[#16] 只打背景中小人跳舞的段落', 0, '2026-03-28 15:08:34', '2026-03-28 15:11:48');
INSERT INTO `score` VALUES (566, 83, 99, '2026-03-28 15:09:26', '/scores/ca006eb6-3791-433d-8b42-a1fc4d6c464f.jpg', 2, 1, 11, '[#11] ', 0, '2026-03-28 15:09:26', '2026-03-28 15:11:57');
INSERT INTO `score` VALUES (567, 83, 105, '2026-03-28 15:10:58', '/scores/c915f5c6-3527-4945-8ba8-86b19a77ae93.jpg', -2, 1, 6, '[#6] ', 0, '2026-03-28 15:10:58', '2026-03-28 15:12:07');
INSERT INTO `score` VALUES (568, 83, 45, '2026-03-28 15:12:04', '/scores/62f6141e-6e6f-44f5-9174-878f1bed5a57.jpg', 2, 1, 11, '[#11] ', 0, '2026-03-28 15:12:04', '2026-03-28 15:12:14');
INSERT INTO `score` VALUES (569, 83, 42, '2026-03-28 15:12:07', '/scores/4ed77e90-e056-45a4-9b67-a571c940e3be.jpg', 3, 1, 22, '[#22] 不接air', 0, '2026-03-28 15:12:07', '2026-03-28 15:12:21');
INSERT INTO `score` VALUES (570, 83, 39, '2026-03-28 15:12:20', '/scores/18646077-92ad-43a5-a790-bf27b4336984.jpg', -2, 1, 6, '难度变为awaken后全程全连', 0, '2026-03-28 15:12:20', '2026-03-28 15:12:29');
INSERT INTO `score` VALUES (571, 83, 52, '2026-03-28 15:13:54', '/scores/d2deae63-63d6-4532-9b55-04dee1d6b104.jpg', -2, 1, 6, '[#6] ', 0, '2026-03-28 15:13:54', '2026-03-28 15:14:17');
INSERT INTO `score` VALUES (572, 83, 230, '2026-03-28 15:14:58', '/scores/56922e13-c561-4362-956a-948047ba6f12.jpg', -2, 1, 14, '水神2？', 0, '2026-03-28 15:14:58', '2026-03-28 15:15:36');
INSERT INTO `score` VALUES (573, 83, 136, '2026-03-28 15:17:14', '/scores/1d62a768-9d3b-4a0a-9f21-1b106dec5deb.jpeg', 3, 1, 16, '[#16] 只打两段跳舞', 0, '2026-03-28 15:17:14', '2026-03-28 15:19:21');
INSERT INTO `score` VALUES (574, 83, 45, '2026-03-28 15:18:43', '/scores/5624dccb-77a2-4884-9c5a-3c971a15c797.jpg', -1, 1, 16, '[#16] 空挥ing', 0, '2026-03-28 15:18:43', '2026-03-28 15:20:07');
INSERT INTO `score` VALUES (575, 83, 85, '2026-03-28 15:19:46', '/scores/1e7f9a07-3424-4c17-9f87-76c01df7c81c.jpg', -1, 1, 16, '[#16] 出现火柴人后放置并跳舞', 0, '2026-03-28 15:19:46', '2026-03-28 15:20:14');
INSERT INTO `score` VALUES (576, 83, 52, '2026-03-28 15:20:54', '/scores/dee7a7b2-f4be-419a-8434-845146331b6d.jpg', -2, 1, 6, '[#6] ', 0, '2026-03-28 15:20:54', '2026-03-28 15:21:10');
INSERT INTO `score` VALUES (577, 83, 105, '2026-03-28 15:22:27', '/scores/255d8cad-a361-4a77-a4f5-5ee3df975457.jpg', -2, 1, 5, '[#5] ', 0, '2026-03-28 15:22:27', '2026-03-28 15:23:15');
INSERT INTO `score` VALUES (578, 83, 233, '2026-03-28 15:22:59', '/scores/52a4e81f-a6ee-42ec-9f8b-5098454471fa.jpg', -2, 1, 14, '[#14] ', 0, '2026-03-28 15:22:59', '2026-03-28 15:23:34');
INSERT INTO `score` VALUES (579, 83, 85, '2026-03-28 15:23:41', '/scores/9ee8df24-8044-4a9b-9ec9-2c83877760e3.jpg', -1, 1, 16, '[#16] 放置跳舞', 0, '2026-03-28 15:23:41', '2026-03-28 15:24:16');
INSERT INTO `score` VALUES (580, 83, 105, '2026-03-28 15:24:41', '/scores/fa3af68a-8108-4a53-9051-a494086d8968.jpg', -2, 1, 10, '[#10] ', 0, '2026-03-28 15:24:41', '2026-03-28 15:26:11');
INSERT INTO `score` VALUES (581, 83, 74, '2026-03-28 15:24:49', '/scores/706eb5ba-d2a8-4914-aa4e-8f8996f1d801.jpg', -1, 1, 12, '[#12] ', 0, '2026-03-28 15:24:49', '2026-03-28 15:26:29');
INSERT INTO `score` VALUES (582, 83, 8, '2026-03-28 15:26:11', '', -2, 1, 6, '[#6] ', 0, '2026-03-28 15:26:11', '2026-03-28 15:26:40');
INSERT INTO `score` VALUES (583, 83, 93, '2026-03-28 15:26:14', '/scores/ac4d35ee-a0e5-4c5a-917b-e56a589a1ea1.jpg', 2, 1, 11, '[#11] ', 0, '2026-03-28 15:26:14', '2026-03-28 15:27:00');
INSERT INTO `score` VALUES (584, 83, 8, '2026-03-28 15:27:11', '/scores/5831c58c-30ee-4e2a-8f2b-7c6d3e75762c.png', -2, 1, 6, '[#6] 光对立游玩再见初恋\n', 0, '2026-03-28 15:27:11', '2026-03-28 15:27:14');
INSERT INTO `score` VALUES (585, 83, 93, '2026-03-28 15:27:40', '/scores/6d9d5b7b-9635-4082-8b85-96d46eb2d452.jpg', -1, 1, 22, '[#22] 放置结尾天键', 0, '2026-03-28 15:27:40', '2026-03-28 15:28:44');
INSERT INTO `score` VALUES (586, 83, 199, '2026-03-28 15:28:23', '/scores/defb6b38-1f17-4d7f-8a0f-413627f35fd5.jpg', -1, 1, 23, '[#23] ', 0, '2026-03-28 15:28:23', '2026-03-28 15:28:55');
INSERT INTO `score` VALUES (587, 83, 52, '2026-03-28 15:28:40', '/scores/790a993d-51fc-4397-b9a9-4569f26ebaa6.jpg', -1, 1, 6, '[#6] ', 0, '2026-03-28 15:28:40', '2026-03-28 15:30:01');
INSERT INTO `score` VALUES (588, 83, 105, '2026-03-28 15:31:46', '/scores/05d2f3fa-b2e9-4189-876b-946c01c47797.jpg', -2, 1, 10, '[#10] ', 0, '2026-03-28 15:31:46', '2026-03-28 15:33:31');
INSERT INTO `score` VALUES (589, 83, 86, '2026-03-28 15:31:53', '/scores/c75fb811-4831-4f84-a414-bbae2ac1ecf5.png', 2, 1, 22, '[#22] ', 0, '2026-03-28 15:31:53', '2026-03-28 15:33:43');
INSERT INTO `score` VALUES (590, 83, 86, '2026-03-28 15:33:09', '/scores/b92eb086-de5a-4873-9a36-b3e865c67053.jpeg', -2, 1, 6, '[#6] ', 0, '2026-03-28 15:33:09', '2026-03-28 15:33:57');
INSERT INTO `score` VALUES (591, 83, 222, '2026-03-28 15:34:30', '/scores/d3bd4c24-a6b9-4b23-96e5-a58308025fbe.jpg', -1, 1, 22, '[#22] 硬核挑战最后死在天键尾杀', 0, '2026-03-28 15:34:30', '2026-03-28 15:36:51');
INSERT INTO `score` VALUES (592, 83, 105, '2026-03-28 15:35:11', '/scores/ee99f6c0-f69c-44d9-afcb-b253d9e9f323.jpg', -2, 1, 6, '[#6] ', 0, '2026-03-28 15:35:11', '2026-03-28 15:36:56');
INSERT INTO `score` VALUES (593, 83, 230, '2026-03-28 15:36:08', '/scores/aa36eedd-22e3-4864-b5c2-016e71021784.jpg', 2, 1, 22, '蜘蛛丝，但是不打air', 0, '2026-03-28 15:36:08', '2026-03-28 15:37:05');
INSERT INTO `score` VALUES (594, 83, 121, '2026-03-28 15:36:42', '/scores/901ceb43-7569-4ca1-b122-3d6becdedd21.jpg', 2, 1, 11, '[#11] 全外', 0, '2026-03-28 15:36:42', '2026-03-28 15:37:13');
INSERT INTO `score` VALUES (595, 83, 52, '2026-03-28 15:36:49', '/scores/f740bd73-86bd-4233-a7d1-a7fa0d456691.jpg', 5, 1, 6, '[#6] ', 0, '2026-03-28 15:36:49', '2026-03-28 15:37:28');
INSERT INTO `score` VALUES (596, 83, 86, '2026-03-28 15:41:18', '/scores/5a7b256f-a074-4da0-aacf-97ea49a4a114.png', -1, 1, 6, '[#6] ', 0, '2026-03-28 15:41:18', '2026-03-28 15:42:16');
INSERT INTO `score` VALUES (597, 83, 29, '2026-03-28 15:43:47', '/scores/dfa04ad4-809b-464a-9aae-ea72f1aef53a.jpeg', 3, 1, 6, '[#6] ', 0, '2026-03-28 15:43:47', '2026-03-28 15:44:30');
INSERT INTO `score` VALUES (598, 83, 86, '2026-03-28 15:44:50', '/scores/8e917986-7145-4ac0-beca-a4c6972e4672.png', -2, 1, 18, '[#18] ', 0, '2026-03-28 15:44:50', '2026-03-28 15:48:45');
INSERT INTO `score` VALUES (599, 83, 126, '2026-03-28 15:45:24', '/scores/9e6a8040-e8ff-41f9-acb9-c20988722fd4.jpg', 3, 1, 6, '[#6] ', 0, '2026-03-28 15:45:24', '2026-03-28 15:48:58');
INSERT INTO `score` VALUES (600, 83, 233, '2026-03-28 15:46:11', '/scores/15c2b910-b885-4191-8f4a-c1144765f9e0.jpg', 2, 1, 16, '[#16] ', 0, '2026-03-28 15:46:11', '2026-03-28 15:49:16');
INSERT INTO `score` VALUES (601, 83, 39, '2026-03-28 15:46:43', '/scores/7eecfecf-1c69-477b-811f-59908533ec22.jpg', 3, 1, 3, '[#3] ', 0, '2026-03-28 15:46:43', '2026-03-28 15:49:26');
INSERT INTO `score` VALUES (602, 83, 86, '2026-03-28 15:48:51', '/scores/33eda5be-521c-45c6-bd60-f4d9076f09fb.png', -1, 1, 6, '[#6] ', 0, '2026-03-28 15:48:51', '2026-03-28 15:49:33');
INSERT INTO `score` VALUES (603, 83, 99, '2026-03-28 15:51:22', '/scores/50e4647a-dcca-49be-a2b0-11d149cb7c4f.jpg', -1, 1, 16, '[#16] ', 0, '2026-03-28 15:51:22', '2026-03-28 15:52:40');
INSERT INTO `score` VALUES (604, 83, 39, '2026-03-28 15:52:11', '/scores/75fb9e4e-d36e-4bf7-862c-ef62c60864e7.jpg', 2, 1, 16, '[#16] ', 0, '2026-03-28 15:52:11', '2026-03-28 15:52:50');
INSERT INTO `score` VALUES (605, 83, 52, '2026-03-28 15:54:25', '/scores/8c9b9745-2a69-4320-801f-4818ab44cd93.jpg', -2, 1, 20, '[#20] ', 0, '2026-03-28 15:54:25', '2026-03-28 15:56:11');
INSERT INTO `score` VALUES (606, 83, 121, '2026-03-28 15:54:27', '/scores/5ad7bb03-370e-4615-a22c-13959f8ce0dd.jpg', 2, 1, 2, '[#2] ', 0, '2026-03-28 15:54:27', '2026-03-28 15:56:26');
INSERT INTO `score` VALUES (607, 83, 159, '2026-03-28 15:54:32', '/scores/3b5ef546-acf7-4722-b4cd-9d11a98142c5.jpg', 2, 1, 9, '[#9] 在异象坠机', 0, '2026-03-28 15:54:32', '2026-03-28 15:56:44');
INSERT INTO `score` VALUES (608, 83, 86, '2026-03-28 15:57:15', '/scores/1b3a1e55-d9a5-41c8-8155-b6753aae0798.png', -1, 1, 6, '[#6] ', 0, '2026-03-28 15:57:15', '2026-03-28 15:59:41');
INSERT INTO `score` VALUES (609, 83, 86, '2026-03-28 16:01:02', '/scores/bd0c3959-08d1-460b-909f-0f6cb8fda8f6.png', 2, 1, 6, '[#6] ', 0, '2026-03-28 16:01:02', '2026-03-28 16:01:09');
INSERT INTO `score` VALUES (610, 83, 199, '2026-03-28 16:05:07', '/scores/a205b86f-50d5-4e75-ad9e-e51624a3aec5.jpg', -2, 1, 15, '[#15] ', 0, '2026-03-28 16:05:07', '2026-03-28 16:08:57');
INSERT INTO `score` VALUES (611, 83, 159, '2026-03-28 16:06:01', '/scores/e0ed8660-f626-4ef0-aba4-831941c5de74.jpg', 2, 1, 22, '[#22] 不打air', 0, '2026-03-28 16:06:01', '2026-03-28 16:07:48');
INSERT INTO `score` VALUES (612, 83, 129, '2026-03-28 16:06:42', '/scores/a7a8549c-2bc4-4752-920e-32589925c454.jpg', 5, 1, 10, '[#10] 第二首找半天没找到先打的宫下游，游戏玩伴选择了noa原型和31号', 0, '2026-03-28 16:06:42', '2026-03-28 16:07:45');
INSERT INTO `score` VALUES (613, 83, 39, '2026-03-28 16:11:01', '/scores/2ed92d83-9f3b-47ef-8101-075b71375667.jpg', 2, 1, 6, '[#6] ', 0, '2026-03-28 16:11:01', '2026-03-28 16:11:33');
INSERT INTO `score` VALUES (614, 83, 86, '2026-03-28 16:12:02', '/scores/3481afea-300f-4f4d-ad6b-9c1901bc6e38.png', -1, 1, 12, '[#12] ', 0, '2026-03-28 16:12:02', '2026-03-28 16:12:31');
INSERT INTO `score` VALUES (615, 83, 85, '2026-03-28 16:12:36', '/scores/8f7135a8-5266-475f-a1f4-9dfe35376774.jpg', 2, 1, 19, '[#19] ', 0, '2026-03-28 16:12:36', '2026-03-28 16:13:38');
INSERT INTO `score` VALUES (616, 83, 199, '2026-03-28 16:13:33', '/scores/f2859c93-88bc-4398-aac3-50a71aefd2d2.jpg', -2, 1, 15, '[#15] ', 0, '2026-03-28 16:13:33', '2026-03-28 16:13:50');
INSERT INTO `score` VALUES (617, 83, 126, '2026-03-28 16:13:49', '/scores/c727e9b9-daed-49b9-ba6b-f551bdf4cf88.jpg', 3, 1, 10, '[#10] ', 0, '2026-03-28 16:13:49', '2026-03-28 16:14:29');
INSERT INTO `score` VALUES (618, 83, 74, '2026-03-28 16:17:18', '/scores/634c3c31-a202-4393-8a21-db63c9db6244.jpg', -1, 1, 12, '[#12] ', 0, '2026-03-28 16:17:18', '2026-03-28 16:18:40');
INSERT INTO `score` VALUES (619, 83, 232, '2026-03-28 16:18:03', '/scores/840781fa-175e-4f0c-9611-850e4c4dcd22.jpg', 2, 1, 1, '[#1] ', 0, '2026-03-28 16:18:03', '2026-03-28 16:18:46');
INSERT INTO `score` VALUES (620, 83, 199, '2026-03-28 16:18:28', '/scores/308c9124-e1fd-4ae6-bf73-a2847bf62f6a.jpg', -2, 1, 15, '[#15] ', 0, '2026-03-28 16:18:28', '2026-03-28 16:18:59');
INSERT INTO `score` VALUES (621, 83, 222, '2026-03-28 16:19:05', '/scores/af1e7d73-d372-4212-a8d0-9f3467a9255e.jpg', -1, 1, 16, '[#16] 只游玩bga中含有小人跳舞的片段', 0, '2026-03-28 16:19:05', '2026-03-28 16:20:59');
INSERT INTO `score` VALUES (622, 83, 99, '2026-03-28 16:21:40', '/scores/1483126b-f20e-4292-a0af-3e302d0ea378.jpg', 3, 1, 10, '[#10]旅行伙伴带了天空街4的ノア', 0, '2026-03-28 16:21:40', '2026-03-28 16:23:50');
INSERT INTO `score` VALUES (623, 83, 47, '2026-03-28 16:21:54', '/scores/aad15b49-5209-4d43-9fab-e45b543585f8.jpg', 2, 1, 10, '[#10] 锁女主没拍到（\n公众号卡的一批', 0, '2026-03-28 16:21:54', '2026-03-28 16:28:36');
INSERT INTO `score` VALUES (624, 83, 121, '2026-03-28 16:22:22', '/scores/9931c607-f0cc-4224-a418-08ff037b652e.jpg', 2, 1, 22, '[#22] 不接air', 0, '2026-03-28 16:22:22', '2026-03-28 16:23:04');
INSERT INTO `score` VALUES (625, 83, 129, '2026-03-28 16:23:35', '/scores/5c2d1f0a-0c5f-40a6-9eb2-f6ba03105c91.jpg', -2, 1, 18, '[#18] ', 0, '2026-03-28 16:23:35', '2026-03-28 16:24:16');
INSERT INTO `score` VALUES (626, 83, 85, '2026-03-28 16:25:35', '/scores/8cbb353b-ecb1-4a6a-a3a2-9442955e5a41.jpg', 2, 1, 3, '[#3] ', 0, '2026-03-28 16:25:35', '2026-03-28 16:25:46');
INSERT INTO `score` VALUES (627, 83, 199, '2026-03-28 16:27:57', '/scores/af92b91b-d62f-4d64-aad1-98edc5d5d7b6.jpg', -2, 1, 15, '好难啊', 0, '2026-03-28 16:27:57', '2026-03-28 16:29:22');
INSERT INTO `score` VALUES (628, 83, 29, '2026-03-28 16:28:38', '/scores/248a6917-891b-4053-a2b6-7529f6c9d553.jpeg', 2, 1, 12, '[#12] ', 0, '2026-03-28 16:28:38', '2026-03-28 16:29:05');
INSERT INTO `score` VALUES (629, 83, 126, '2026-03-28 16:33:37', '/scores/4b45cc82-1838-4f25-bbff-8e011f8e6cf9.jpg', -2, 1, 18, '[#18] ', 0, '2026-03-28 16:33:37', '2026-03-28 16:34:25');
INSERT INTO `score` VALUES (630, 83, 129, '2026-03-28 16:33:44', '/scores/f71395cf-6130-40ac-b86a-029c42a04ea7.jpg', 2, 1, 24, '[#24] 尽力了', 0, '2026-03-28 16:33:44', '2026-03-28 16:34:23');
INSERT INTO `score` VALUES (631, 83, 45, '2026-03-28 16:34:26', '/scores/a5d900c9-89b9-4c19-aa79-e705021b3278.jpg', 2, 1, 16, '[#16] ', 0, '2026-03-28 16:34:26', '2026-03-28 16:34:50');
INSERT INTO `score` VALUES (632, 83, 86, '2026-03-28 16:35:44', '/scores/7cb7ff25-296b-4be8-bee9-c525d6ba6d08.png', -1, 1, 10, '[#10] ', 0, '2026-03-28 16:35:44', '2026-03-28 16:38:21');
INSERT INTO `score` VALUES (633, 83, 52, '2026-03-28 16:36:52', '/scores/68fda2dc-3317-4927-b276-9a94748e009d.jpg', -1, 1, 10, '[#10] ', 0, '2026-03-28 16:36:52', '2026-03-28 16:38:20');
INSERT INTO `score` VALUES (634, 83, 8, '2026-03-28 16:38:53', '/scores/71fad5f9-3e41-443e-9d3b-4f6ac61c2a7c.jpg', 2, 1, 5, '[#5] ', 0, '2026-03-28 16:38:53', '2026-03-28 16:39:08');
INSERT INTO `score` VALUES (635, 83, 199, '2026-03-28 16:39:09', '/scores/847c06b9-4b17-4756-860e-0f80913932e7.jpg', 3, 1, 15, '什\n么\n侧着打的', 0, '2026-03-28 16:39:09', '2026-03-28 16:39:20');
INSERT INTO `score` VALUES (636, 83, 232, '2026-03-28 16:40:54', '/scores/7de02205-455b-4024-99d4-6076c01f3150.jpg', 2, 1, 12, '[#12] ', 0, '2026-03-28 16:40:54', '2026-03-28 16:42:24');
INSERT INTO `score` VALUES (637, 83, 232, '2026-03-28 16:41:20', '/scores/b8b1dff4-1f31-44e0-baf9-b46a40860522.jpg', -1, 1, 21, '[#21] ', 0, '2026-03-28 16:41:20', '2026-03-28 16:42:13');
INSERT INTO `score` VALUES (638, 83, 29, '2026-03-28 16:42:35', '/scores/310fc172-7f4b-4cef-a05f-a82fc033610b.jpg', -2, 1, 14, '[#14] ', 0, '2026-03-28 16:42:35', '2026-03-28 16:43:36');
INSERT INTO `score` VALUES (639, 83, 86, '2026-03-28 16:43:36', '/scores/aad3ddf9-f565-43f2-960d-8cfaa83d03f2.png', 2, 1, 10, '[#10] ', 0, '2026-03-28 16:43:36', '2026-03-28 16:43:41');
INSERT INTO `score` VALUES (640, 83, 136, '2026-03-28 16:47:10', '/scores/55c92b7f-c37a-4598-bdd9-0ee89db5cf7b.jpeg', 2, 1, 12, '[#12] 撞死了求过', 0, '2026-03-28 16:47:10', '2026-03-28 16:47:48');
INSERT INTO `score` VALUES (641, 83, 29, '2026-03-28 16:49:32', '/scores/9d4ac834-fa6d-4f57-be7d-bcfa68383c2d.jpeg', -2, 1, 25, '[#25] ', 0, '2026-03-28 16:49:32', '2026-03-28 16:50:17');
INSERT INTO `score` VALUES (642, 83, 52, '2026-03-28 16:51:53', '/scores/cc862933-0931-4cee-9f31-d1e9be467719.jpg', -2, 1, 14, '[#14] ', 0, '2026-03-28 16:51:53', '2026-03-28 16:52:16');
INSERT INTO `score` VALUES (643, 83, 121, '2026-03-28 16:54:01', '', -2, 1, 7, '[#7] ', 0, '2026-03-28 16:54:01', '2026-03-28 16:55:19');
INSERT INTO `score` VALUES (644, 83, 222, '2026-03-28 16:54:52', '/scores/32340539-a5c6-4b06-b30b-5040f0780e2b.jpg', -1, 1, 10, '[#10] 按顺序游玩三首', 0, '2026-03-28 16:54:52', '2026-03-28 16:55:41');
INSERT INTO `score` VALUES (645, 83, 222, '2026-03-28 16:57:15', '/scores/42f23a10-276c-4a0f-9618-d4570a5453c3.jpg', 2, 1, 16, '[#16] 只打尾杀跳舞段', 0, '2026-03-28 16:57:15', '2026-03-28 16:58:54');
INSERT INTO `score` VALUES (646, 83, 121, '2026-03-28 16:57:19', '/scores/9da684b6-2b25-4b9b-8f57-4310418fa727.jpg', 2, 1, 7, '[#7] ', 0, '2026-03-28 16:57:19', '2026-03-28 16:59:04');
INSERT INTO `score` VALUES (647, 83, 52, '2026-03-28 17:02:03', '/scores/b81e182a-a1b7-4b2a-a34d-dccdcd990743.jpg', -1, 1, 10, '[#10] 从左到右游玩', 0, '2026-03-28 17:02:03', '2026-03-28 17:05:45');
INSERT INTO `score` VALUES (648, 83, 85, '2026-03-28 17:03:20', '/scores/d57f0a7c-8a27-4167-8338-d46ae02aaeeb.jpg', 2, 1, 2, '[#2] 憋笑', 0, '2026-03-28 17:03:20', '2026-03-28 17:04:47');
INSERT INTO `score` VALUES (649, 83, 159, '2026-03-28 17:03:21', '/scores/5b2847dd-2044-45d9-8dc2-2f1139b5301e.jpg', 2, 1, 25, '[#25] ', 0, '2026-03-28 17:03:21', '2026-03-28 17:04:54');
INSERT INTO `score` VALUES (650, 83, 93, '2026-03-28 17:03:39', '/scores/171de822-5dcf-43f4-89cd-5290153d2a44.jpg', -1, 1, 23, '[#23] ', 0, '2026-03-28 17:03:39', '2026-03-28 17:05:10');
INSERT INTO `score` VALUES (651, 83, 121, '2026-03-28 17:10:33', '', -2, 1, 3, '[#3] ', 0, '2026-03-28 17:10:33', '2026-03-28 17:12:32');
INSERT INTO `score` VALUES (652, 83, 230, '2026-03-28 17:12:12', '/scores/87fcbf79-8358-4f1b-9776-b36048597d04.jpg', -2, 1, 14, '反色xing', 0, '2026-03-28 17:12:12', '2026-03-28 17:12:26');
INSERT INTO `score` VALUES (653, 83, 129, '2026-03-28 17:13:29', '', -1, 1, 23, '[#23] 游玩random，没币买了', 0, '2026-03-28 17:13:29', '2026-03-28 17:13:41');
INSERT INTO `score` VALUES (654, 83, 129, '2026-03-28 17:14:07', '', -2, 1, 23, '[#23] 携带random称号游玩mint choco', 0, '2026-03-28 17:14:07', '2026-03-28 17:16:08');
INSERT INTO `score` VALUES (655, 83, 222, '2026-03-28 17:14:15', '/scores/1e6d9eb0-429a-4cfe-b5ff-da8abcb149c7.jpg', -1, 1, 10, '[#10] 顺序由下往上依次游玩', 0, '2026-03-28 17:14:15', '2026-03-28 17:16:23');
INSERT INTO `score` VALUES (656, 83, 199, '2026-03-28 17:14:20', '/scores/541ab0cd-b71a-4b33-8a42-77e9a97b03a4.jpg', -1, 1, 23, '[#23] ', 0, '2026-03-28 17:14:20', '2026-03-28 17:15:57');
INSERT INTO `score` VALUES (657, 83, 52, '2026-03-28 17:15:06', '/scores/e42df877-3c8c-4d47-b184-5c999b98d258.jpg', 2, 1, 3, '[#3] ', 0, '2026-03-28 17:15:06', '2026-03-28 17:16:15');
INSERT INTO `score` VALUES (658, 83, 29, '2026-03-28 17:15:13', '/scores/3027898f-0a44-42ce-bd37-67486bda3b9c.png', 2, 1, 3, '[#3] ', 0, '2026-03-28 17:15:13', '2026-03-28 17:16:06');
INSERT INTO `score` VALUES (659, 83, 39, '2026-03-28 17:15:13', '/scores/70b73fb8-0cf8-468e-b2a2-69ab581a5a85.jpg', 5, 1, 18, '[#18] ', 0, '2026-03-28 17:15:13', '2026-03-28 17:15:50');
INSERT INTO `score` VALUES (660, 83, 52, '2026-03-28 17:16:32', '/scores/8c023bd8-c0e8-43cc-85e1-a7cb6337a139.jpg', -1, 1, 10, '[#10] noa和31号', 0, '2026-03-28 17:16:32', '2026-03-28 17:17:13');
INSERT INTO `score` VALUES (661, 83, 129, '2026-03-28 17:16:34', '', -1, 1, 20, '[#20] 携带萨克斯白法院游玩天盖', 0, '2026-03-28 17:16:34', '2026-03-28 17:16:44');
INSERT INTO `score` VALUES (662, 83, 129, '2026-03-28 17:16:51', '', -1, 1, 23, '[#23] 携带小机器人角色游玩random', 0, '2026-03-28 17:16:51', '2026-03-28 17:16:57');
INSERT INTO `score` VALUES (663, 83, 129, '2026-03-28 17:18:49', '', -1, 1, 23, '[#23] 携带奸商游玩random', 0, '2026-03-28 17:18:49', '2026-03-28 17:19:11');
INSERT INTO `score` VALUES (664, 83, 41, '2026-03-28 17:19:03', '/scores/6b2e04fb-5683-4e32-aecc-f11fd3dddf7b.jpg', -2, 1, 14, '[#14] ', 0, '2026-03-28 17:19:03', '2026-03-28 17:19:16');
INSERT INTO `score` VALUES (665, 83, 52, '2026-03-28 17:20:43', '/scores/e0f6c1a8-2a5f-46fc-89d5-c67be6c26d25.jpg', -1, 1, 10, '[#10] 从左到右游玩，携带noa和31号', 0, '2026-03-28 17:20:43', '2026-03-28 17:20:52');
INSERT INTO `score` VALUES (666, 83, 199, '2026-03-28 17:20:50', '/scores/aea0a4d3-58c9-47c0-b453-9c22bb308b80.jpg', -1, 1, 23, '打到尾杀就放置', 0, '2026-03-28 17:20:50', '2026-03-28 17:21:23');
INSERT INTO `score` VALUES (667, 83, 159, '2026-03-28 17:21:04', '/scores/5310ddb8-3dc4-438f-b5a5-a722af1382e6.jpg', -2, 1, 14, '[#14] 反色', 0, '2026-03-28 17:21:04', '2026-03-28 17:21:19');
INSERT INTO `score` VALUES (668, 83, 52, '2026-03-28 17:21:34', '/scores/682e7510-9139-4cdc-85d7-92940b06b95f.jpg', 2, 1, 10, '[#10] ', 0, '2026-03-28 17:21:34', '2026-03-28 17:21:40');
INSERT INTO `score` VALUES (669, 83, 85, '2026-03-28 17:22:03', '/scores/5714ad08-ce6d-49e5-98b9-e8ee17cab898.jpg', -2, 1, 14, '[#14] 开启音弧配色改变', 0, '2026-03-28 17:22:03', '2026-03-28 17:22:07');
INSERT INTO `score` VALUES (670, 83, 86, '2026-03-28 17:23:15', '/scores/50bdf6ac-077e-4e58-ab2d-4c2b51d3286f.png', -2, 1, 14, '[#14] ', 0, '2026-03-28 17:23:15', '2026-03-28 17:23:19');
INSERT INTO `score` VALUES (671, 83, 54, '2026-03-28 17:23:32', '/scores/806a70a4-c7c4-4ce7-9085-90bd2d158d44.jpg', 2, 1, 19, '[#19] ', 0, '2026-03-28 17:23:32', '2026-03-28 17:23:42');
INSERT INTO `score` VALUES (672, 83, 129, '2026-03-28 17:25:40', '/scores/b745397e-70b8-4f29-b841-6e71a918aafc.jpg', -1, 1, 8, '[#8] ', 0, '2026-03-28 17:25:40', '2026-03-28 17:25:51');
INSERT INTO `score` VALUES (673, 83, 129, '2026-03-28 17:26:34', '', 3, 1, 8, '[#8] 没钱买歌了救救孩子吧', 0, '2026-03-28 17:26:34', '2026-03-28 17:26:52');
INSERT INTO `score` VALUES (674, 83, 39, '2026-03-28 17:26:37', '/scores/cee06c26-b63c-48aa-b443-6e6343247f17.jpg', 5, 1, 14, '[#14] ', 0, '2026-03-28 17:26:37', '2026-03-28 17:26:55');
INSERT INTO `score` VALUES (675, 83, 86, '2026-03-28 17:27:22', '/scores/ea7cb29a-18b4-430e-9b6b-b39085e97263.png', -2, 1, 14, '[#14] ', 0, '2026-03-28 17:27:22', '2026-03-28 17:27:28');
INSERT INTO `score` VALUES (676, 83, 129, '2026-03-28 17:27:28', '', -1, 1, 23, '[#23] 放置random', 0, '2026-03-28 17:27:28', '2026-03-28 17:27:35');
INSERT INTO `score` VALUES (677, 83, 136, '2026-03-28 17:28:17', '', -2, 1, 18, '[#18] 一速', 0, '2026-03-28 17:28:17', '2026-03-28 17:28:38');
INSERT INTO `score` VALUES (678, 83, 159, '2026-03-28 17:29:10', '/scores/b6af4246-950e-4aeb-bccd-927a500cf434.jpg', 3, 1, 14, '[#14] ', 0, '2026-03-28 17:29:10', '2026-03-28 17:29:37');
INSERT INTO `score` VALUES (679, 83, 85, '2026-03-28 17:30:14', '/scores/6f1cea22-cea3-4eb5-a90a-0a22c40f2526.jpg', -2, 1, 14, '[#14] 颜色反转', 0, '2026-03-28 17:30:14', '2026-03-28 17:30:25');
INSERT INTO `score` VALUES (680, 83, 52, '2026-03-28 17:30:45', '/scores/fe949601-fcef-43a7-8e4f-219df4202f42.jpg', 3, 1, 18, '[#18] 一速', 0, '2026-03-28 17:30:45', '2026-03-28 17:31:05');
INSERT INTO `score` VALUES (681, 83, 222, '2026-03-28 17:30:53', '/scores/c2aca570-a9eb-4c0e-8f8c-aa9d53a5442c.jpg', -1, 1, 10, '[#10] 顺序リフヴェイン 生命不详 チエルカ／エソテリカ', 0, '2026-03-28 17:30:53', '2026-03-28 17:31:02');
INSERT INTO `score` VALUES (682, 83, 129, '2026-03-28 17:31:10', '', -1, 1, 23, '[#23] 在random打且仅打最上面的十颗按键', 0, '2026-03-28 17:31:10', '2026-03-28 17:31:22');
INSERT INTO `score` VALUES (683, 83, 52, '2026-03-28 17:31:17', '', 3, 1, 14, '[#14] 范式 oriens', 0, '2026-03-28 17:31:17', '2026-03-28 17:31:35');
INSERT INTO `score` VALUES (684, 83, 232, '2026-03-28 17:31:36', '/scores/820dea1a-642e-4b00-a72a-aac7d2298edb.jpg', -2, 1, 14, '[#14] ', 0, '2026-03-28 17:31:36', '2026-03-28 17:32:04');
INSERT INTO `score` VALUES (685, 83, 136, '2026-03-28 17:31:52', '', -2, 1, 18, '[#18] 一速', 0, '2026-03-28 17:31:52', '2026-03-28 17:32:17');
INSERT INTO `score` VALUES (686, 83, 129, '2026-03-28 17:32:46', '', -1, 1, 23, '[#23] 打random且不打最上面的十颗按键', 0, '2026-03-28 17:32:46', '2026-03-28 17:33:03');
INSERT INTO `score` VALUES (687, 83, 86, '2026-03-28 17:32:51', '/scores/1c7e0a7c-d39a-4470-80ac-71992b554dfd.png', 2, 1, 14, '[#14] ', 0, '2026-03-28 17:32:51', '2026-03-28 17:33:07');
INSERT INTO `score` VALUES (688, 83, 199, '2026-03-28 17:32:59', '/scores/f62242c2-fa76-4ae6-9ad4-348767c46f64.jpg', -2, 1, 18, '一速 刚刚卡了', 0, '2026-03-28 17:32:59', '2026-03-28 17:33:13');
INSERT INTO `score` VALUES (689, 83, 93, '2026-03-28 17:34:32', '/scores/df23b1da-0c58-4ddb-bee0-44e8aa07743d.jpg', 2, 1, 22, '[#22] 放置全部天键', 0, '2026-03-28 17:34:32', '2026-03-28 17:34:37');
INSERT INTO `score` VALUES (690, 83, 85, '2026-03-28 17:35:10', '/scores/94c31410-39ea-49d4-bf39-53e516cd4cee.jpg', -1, 1, 23, '[#23] 只游玩phi几张谱面中具有相同部分的片段', 0, '2026-03-28 17:35:10', '2026-03-28 17:35:21');
INSERT INTO `score` VALUES (691, 83, 86, '2026-03-28 17:35:54', '/scores/f9c35fbb-a2f4-4974-8f95-758bfe36a4d6.png', -2, 1, 18, '[#18] 最低速最低距', 0, '2026-03-28 17:35:54', '2026-03-28 17:36:14');
INSERT INTO `score` VALUES (692, 83, 129, '2026-03-28 17:35:58', '', -1, 1, 23, '[#23] 打random且不爆early判定', 0, '2026-03-28 17:35:58', '2026-03-28 17:36:10');
INSERT INTO `score` VALUES (693, 83, 230, '2026-03-28 17:37:04', '/scores/5d59a089-2820-4a29-946e-8d1db063d724.jpg', 2, 1, 1, '[#1] ', 0, '2026-03-28 17:37:04', '2026-03-28 17:37:14');
INSERT INTO `score` VALUES (694, 83, 129, '2026-03-28 17:37:34', '', -1, 1, 23, '[#23] 打random且所有按键宽度为1', 0, '2026-03-28 17:37:34', '2026-03-28 17:37:39');
INSERT INTO `score` VALUES (695, 83, 136, '2026-03-28 17:38:05', '/scores/253b592c-6876-4ad6-8f51-01e8b5de9319.jpeg', -2, 1, 18, '[#18] 僵尸娘一速', 0, '2026-03-28 17:38:05', '2026-03-28 17:38:11');
INSERT INTO `score` VALUES (696, 83, 85, '2026-03-28 17:38:30', '/scores/9891302c-e3dd-421d-a79f-eff985677e07.jpg', -1, 1, 23, '[#23] 在相同部分结束后放置', 0, '2026-03-28 17:38:30', '2026-03-28 17:38:37');
INSERT INTO `score` VALUES (697, 83, 136, '2026-03-28 17:39:58', '/scores/593e2e6b-9161-4062-ac05-17489d2245f3.jpeg', -2, 1, 18, '[#18] 坏人形一速', 0, '2026-03-28 17:39:58', '2026-03-28 17:40:07');
INSERT INTO `score` VALUES (698, 83, 39, '2026-03-28 17:40:46', '/scores/b193f48a-d7e2-4f9d-9ea3-4537114f24bd.jpeg', 2, 1, 10, '用noa和31号作为搭档', 0, '2026-03-28 17:40:46', '2026-03-28 17:40:56');
INSERT INTO `score` VALUES (699, 83, 136, '2026-03-28 17:41:39', '/scores/8c53b602-292e-417f-9927-12eafd7550ee.jpeg', -2, 1, 18, '[#18] 反逆炎一速', 0, '2026-03-28 17:41:39', '2026-03-28 17:41:44');
INSERT INTO `score` VALUES (700, 83, 86, '2026-03-28 17:43:20', '/scores/4cafa673-4937-4a49-9990-8f3199878d1b.jpeg', -2, 1, 18, '[#18] 一速挑战', 0, '2026-03-28 17:43:20', '2026-03-28 17:43:39');
INSERT INTO `score` VALUES (701, 83, 222, '2026-03-28 17:43:22', '', -1, 1, 10, '[#10] 顺序为提示歌曲的132', 0, '2026-03-28 17:43:22', '2026-03-28 17:43:41');
INSERT INTO `score` VALUES (702, 83, 136, '2026-03-28 17:44:46', '/scores/cfb4f426-2174-4353-b808-a821e904ed8e.jpeg', 3, 1, 18, '[#18] keavo一速', 0, '2026-03-28 17:44:46', '2026-03-28 17:44:57');
INSERT INTO `score` VALUES (703, 83, 86, '2026-03-28 17:45:59', '/scores/aa57a9bb-f070-4aed-876a-902c30c8669b.jpg', 2, 1, 24, '[#24]', 0, '2026-03-28 17:45:59', '2026-03-28 17:46:25');
INSERT INTO `score` VALUES (704, 83, 129, '2026-03-28 17:46:02', '/scores/e53e74b7-c711-4bd5-ace7-ed6bafb8b16b.jpg', 3, 1, 23, '[#23] ', 0, '2026-03-28 17:46:02', '2026-03-28 17:46:21');
INSERT INTO `score` VALUES (705, 83, 93, '2026-03-28 17:47:51', '/scores/c00351f3-59cf-4705-bdbc-018fb5e59b01.jpg', 2, 1, 24, '[#24] ', 0, '2026-03-28 17:47:51', '2026-03-28 17:48:47');
INSERT INTO `score` VALUES (706, 83, 121, '2026-03-28 17:47:54', '/scores/a484bbd6-ffa7-4f7b-8f12-88e898619043.jpg', 2, 1, 23, '[#23] m', 0, '2026-03-28 17:47:54', '2026-03-28 17:48:49');
INSERT INTO `score` VALUES (707, 83, 232, '2026-03-28 17:50:06', '/scores/f3ea5868-1ce3-44bc-9fb0-8f69cea0cb5d.jpg', -2, 1, 18, '[#18] ', 0, '2026-03-28 17:50:06', '2026-03-28 17:50:16');
INSERT INTO `score` VALUES (708, 83, 199, '2026-03-28 17:51:00', '/scores/0f157b14-580d-43f3-8597-2c8c58b29b99.jpg', -1, 1, 23, '愚人节随机尾杀', 0, '2026-03-28 17:51:00', '2026-03-28 17:51:21');
INSERT INTO `score` VALUES (709, 83, 85, '2026-03-28 17:51:20', '/scores/8521b6e3-a87c-46a0-acd6-9f76fe782258.jpg', 2, 1, 23, '[#23] ', 0, '2026-03-28 17:51:20', '2026-03-28 17:51:29');
INSERT INTO `score` VALUES (710, 83, 159, '2026-03-28 17:53:27', '/scores/32d36bfc-46a0-49f8-a893-97caa9722e10.jpg', 2, 1, 5, '[#5] ', 0, '2026-03-28 17:53:27', '2026-03-28 17:54:24');
INSERT INTO `score` VALUES (711, 83, 129, '2026-03-28 17:58:16', '', -1, 1, 15, '[#15] 倒打inner norm chaotic谱', 0, '2026-03-28 17:58:16', '2026-03-28 20:41:56');
INSERT INTO `score` VALUES (712, 82, 199, '2026-03-28 18:57:49', '/scores/505c95dd-140d-4a49-ac99-fc8e6f29f4a1.jpg', 12, 1, NULL, '', 0, '2026-03-28 18:57:49', '2026-04-03 23:53:29');
INSERT INTO `score` VALUES (713, 82, 62, '2026-03-30 15:33:42', '/scores/927cd830-1fa5-487e-b6a9-586f8a6255a5.jpg', 12, 1, NULL, '99.89', 0, '2026-03-30 15:33:42', '2026-04-03 22:05:13');
INSERT INTO `score` VALUES (714, 82, 57, '2026-04-01 21:35:28', '/scores/2bcdb47c-659f-4e83-b38a-214f3e8f65d4.jpeg', 12, 1, NULL, '', 0, '2026-04-01 21:35:28', '2026-04-03 22:05:10');
INSERT INTO `score` VALUES (718, 85, 130, '2026-04-04 15:31:36', '/scores/2e68c7fe-d39f-459b-aca4-6e5233f6ba19.jpg', 1005620, 1, NULL, '', 0, '2026-04-04 15:31:36', '2026-04-04 15:32:11');
INSERT INTO `score` VALUES (719, 85, 159, '2026-04-04 15:31:41', '/scores/542792fa-f611-4a07-b276-0766064196cd.jpg', 1005620, 1, NULL, '', 0, '2026-04-04 15:31:41', '2026-04-04 15:33:09');
INSERT INTO `score` VALUES (720, 82, 177, '2026-04-04 17:10:25', '/scores/57190266-4306-46d3-8c5b-3a837ac3ad6a.jpg', 11, 1, NULL, '', 0, '2026-04-04 17:10:25', '2026-04-04 17:10:47');
INSERT INTO `score` VALUES (721, 86, 177, '2026-05-06 12:56:14', '/scores/4031127e-864d-4da5-9d85-4933b520ef2d.jpg', 12, 1, NULL, '', 0, '2026-05-06 12:56:14', '2026-05-06 12:56:47');
INSERT INTO `score` VALUES (722, 86, 100, '2026-05-06 21:05:30', '/scores/f6b81063-918a-44a4-8d83-fef0d44fc941.jpg', 10, 1, NULL, '', 0, '2026-05-06 21:05:25', '2026-05-07 09:44:56');
INSERT INTO `score` VALUES (723, 86, 8, '2026-05-07 12:07:13', '/scores/c52ba1b5-ff9c-4567-ba67-9be42f87fd0f.png', 0, 0, NULL, '', 1, '2026-05-07 12:07:13', '2026-05-07 12:07:25');
INSERT INTO `score` VALUES (724, 86, 8, '2026-05-07 12:07:13', '/scores/c52ba1b5-ff9c-4567-ba67-9be42f87fd0f.png', 12, 1, NULL, '', 0, '2026-05-07 12:07:13', '2026-05-07 12:07:28');
INSERT INTO `score` VALUES (725, 86, 45, '2026-05-07 17:53:37', '/scores/2d79bd57-3365-45e7-8900-e78198ab8d56.jpg', 12, 1, NULL, '', 0, '2026-05-07 17:53:37', '2026-05-08 10:22:37');

-- ----------------------------
-- Table structure for team
-- ----------------------------
DROP TABLE IF EXISTS `team`;
CREATE TABLE `team`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `course_id` int NOT NULL,
  `team_id` int NULL DEFAULT NULL,
  `identity_id` int NOT NULL,
  `is_touched` bit(1) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_team_course_identity`(`course_id` ASC, `identity_id` ASC) USING BTREE,
  INDEX `team_identity`(`identity_id` ASC) USING BTREE,
  INDEX `idx_team_course_team`(`course_id` ASC, `team_id` ASC) USING BTREE,
  INDEX `team_id`(`team_id` ASC) USING BTREE,
  CONSTRAINT `team_course` FOREIGN KEY (`course_id`) REFERENCES `course` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `team_identity` FOREIGN KEY (`identity_id`) REFERENCES `identity` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 47 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of team
-- ----------------------------
INSERT INTO `team` VALUES (19, 83, 6, 159, b'0');
INSERT INTO `team` VALUES (20, 83, 1, 8, b'0');
INSERT INTO `team` VALUES (21, 83, 1, 39, b'0');
INSERT INTO `team` VALUES (22, 83, 1, 41, b'0');
INSERT INTO `team` VALUES (23, 83, 2, 45, b'0');
INSERT INTO `team` VALUES (24, 83, 2, 54, b'0');
INSERT INTO `team` VALUES (25, 83, 2, 47, b'0');
INSERT INTO `team` VALUES (26, 83, 3, 126, b'0');
INSERT INTO `team` VALUES (27, 83, 3, 199, b'0');
INSERT INTO `team` VALUES (28, 83, 3, 136, b'0');
INSERT INTO `team` VALUES (29, 83, 4, 85, b'0');
INSERT INTO `team` VALUES (30, 83, 4, 230, b'0');
INSERT INTO `team` VALUES (31, 83, 4, 99, b'0');
INSERT INTO `team` VALUES (32, 83, 5, 105, b'0');
INSERT INTO `team` VALUES (33, 83, 5, 42, b'0');
INSERT INTO `team` VALUES (34, 83, 5, 74, b'0');
INSERT INTO `team` VALUES (35, 83, 6, 29, b'0');
INSERT INTO `team` VALUES (36, 83, 6, 129, b'0');
INSERT INTO `team` VALUES (37, 83, 7, 52, b'0');
INSERT INTO `team` VALUES (38, 83, 7, 121, b'0');
INSERT INTO `team` VALUES (39, 83, 7, 231, b'0');
INSERT INTO `team` VALUES (40, 83, 8, 93, b'0');
INSERT INTO `team` VALUES (41, 83, 8, 222, b'0');
INSERT INTO `team` VALUES (42, 83, 9, 130, b'0');
INSERT INTO `team` VALUES (43, 83, 9, 86, b'0');
INSERT INTO `team` VALUES (44, 83, 9, 233, b'0');
INSERT INTO `team` VALUES (45, 83, 8, 232, b'0');
INSERT INTO `team` VALUES (46, 83, 10, 44, b'0');

SET FOREIGN_KEY_CHECKS = 1;
