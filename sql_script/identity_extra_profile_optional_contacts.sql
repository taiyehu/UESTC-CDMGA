-- Existing installations: allow omitted QQ number and QQ email.
-- Existing rows and identity table remain unchanged.
ALTER TABLE identity_extra_profile
    MODIFY qq_number VARCHAR(20) NULL,
    MODIFY qq_email VARCHAR(254) NULL;