CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
    id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name                  TEXT        NOT NULL,
    email                 TEXT        NOT NULL UNIQUE,
    password_hash         TEXT        NOT NULL,
    email_verified        BOOLEAN     NOT NULL DEFAULT FALSE,
    email_verify_token    TEXT        NOT NULL DEFAULT '',
    email_verify_expiry   TIMESTAMPTZ,
    password_reset_token  TEXT        NOT NULL DEFAULT '',
    password_reset_expiry TIMESTAMPTZ,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at            TIMESTAMPTZ
);

CREATE INDEX idx_users_email               ON users (email)               WHERE deleted_at IS NULL;
CREATE INDEX idx_users_email_verify_token  ON users (email_verify_token)   WHERE email_verify_token  <> '';
CREATE INDEX idx_users_password_reset_token ON users (password_reset_token) WHERE password_reset_token <> '';

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT        NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_hash    ON refresh_tokens (token_hash);
