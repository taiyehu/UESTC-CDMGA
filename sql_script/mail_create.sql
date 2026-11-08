CREATE TABLE IF NOT EXISTS mail_message (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  recipient_id INT NOT NULL,
  kind VARCHAR(40) NOT NULL,
  title VARCHAR(160) NOT NULL,
  content TEXT NOT NULL,
  target_type VARCHAR(20) NULL,
  target_id BIGINT NULL,
  source_type VARCHAR(30) NULL,
  source_id BIGINT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at DATETIME NULL,
  CONSTRAINT fk_mail_recipient FOREIGN KEY (recipient_id) REFERENCES identity(id),
  UNIQUE KEY uk_mail_source_recipient (source_type, source_id, recipient_id),
  INDEX idx_mail_inbox (recipient_id, created_at, id),
  INDEX idx_mail_unread (recipient_id, read_at, target_type, target_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='站内通知';
