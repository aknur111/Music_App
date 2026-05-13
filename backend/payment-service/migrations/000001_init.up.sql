CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS plans (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    slug          TEXT        NOT NULL UNIQUE,
    name          TEXT        NOT NULL,
    description   TEXT        NOT NULL DEFAULT '',
    price_kzt     BIGINT      NOT NULL DEFAULT 0,
    duration_days INTEGER     NOT NULL DEFAULT 0,
    is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL,
    plan_id    UUID        NOT NULL REFERENCES plans(id),
    status     TEXT        NOT NULL DEFAULT 'pending',
    starts_at  TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions (user_id);
CREATE INDEX idx_subscriptions_status  ON subscriptions (status);

CREATE TABLE IF NOT EXISTS payments (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL,
    plan_id         UUID        NOT NULL REFERENCES plans(id),
    subscription_id UUID        REFERENCES subscriptions(id),
    provider_id     TEXT        NOT NULL,
    provider_ref    TEXT        NOT NULL DEFAULT '',
    amount_kzt      BIGINT      NOT NULL,
    status          TEXT        NOT NULL DEFAULT 'created',
    checkout_url    TEXT        NOT NULL DEFAULT '',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_user_id ON payments (user_id);
CREATE INDEX idx_payments_status  ON payments (status);

CREATE TABLE IF NOT EXISTS payment_attempts (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id   UUID        NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    status       TEXT        NOT NULL,
    provider_raw TEXT        NOT NULL DEFAULT '',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_attempts_payment_id ON payment_attempts (payment_id);
