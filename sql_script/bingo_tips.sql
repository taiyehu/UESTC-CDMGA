/*
 Navicat Premium Dump SQL

 Source Server         : Admin_2025
 Source Server Type    : MySQL
 Source Server Version : 80045 (8.0.45-0ubuntu0.22.04.1)
 Source Host           : 47.109.27.209:3306
 Source Schema         : CDMGA

 Target Server Type    : MySQL
 Target Server Version : 80045 (8.0.45-0ubuntu0.22.04.1)
 File Encoding         : 65001

 Date: 24/03/2026 15:56:12
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

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
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

SET FOREIGN_KEY_CHECKS = 1;
