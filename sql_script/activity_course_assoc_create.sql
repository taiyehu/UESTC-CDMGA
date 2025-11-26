CREATE TABLE activity_course_assoc (
                                       id INT AUTO_INCREMENT PRIMARY KEY,
                                       activity_id INT NULL,
                                       course_id INT NULL,
                                       rule VARCHAR(255),
                                       INDEX idx_activity_id (activity_id),
                                       INDEX idx_course_id (course_id),
                                       CONSTRAINT fk_ac_assoc_activity FOREIGN KEY (activity_id) REFERENCES activity(id) ON DELETE SET NULL,
                                       CONSTRAINT fk_ac_assoc_course FOREIGN KEY (course_id) REFERENCES course(id) ON DELETE SET NULL
);
