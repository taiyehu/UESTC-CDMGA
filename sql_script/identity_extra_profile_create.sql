-- Add optional per-identity details without changing identity or profile.
CREATE TABLE IF NOT EXISTS identity_extra_profile (
    identity_id INT NOT NULL,
    qq_number VARCHAR(20) NULL,
    qq_email VARCHAR(254) NULL,
    university VARCHAR(16) NOT NULL,
    PRIMARY KEY (identity_id),
    CONSTRAINT fk_identity_extra_profile_identity
        FOREIGN KEY (identity_id) REFERENCES identity (id) ON DELETE CASCADE,
    CONSTRAINT chk_identity_extra_profile_qq
        CHECK (qq_number REGEXP '^[1-9][0-9]{4,19}$'),
    CONSTRAINT chk_identity_extra_profile_email
        CHECK (qq_email REGEXP '^[^@[:space:]]+@qq[.]com$'),
    CONSTRAINT chk_identity_extra_profile_university
        CHECK (university IN ('UESTC', 'SWJTU'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;