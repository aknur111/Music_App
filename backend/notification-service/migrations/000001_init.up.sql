CREATE TABLE IF NOT EXISTS notification_logs (
    id         UUID        PRIMARY KEY,
    event_id   TEXT        NOT NULL,
    event_type TEXT        NOT NULL,
    recipient  TEXT        NOT NULL,
    subject    TEXT        NOT NULL,
    status     TEXT        NOT NULL DEFAULT 'sent',
    error      TEXT        NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_notification_logs_idempotency
    ON notification_logs (event_id, event_type)
    WHERE status = 'sent';

CREATE INDEX idx_notification_logs_recipient ON notification_logs (recipient);
CREATE INDEX idx_notification_logs_created_at ON notification_logs (created_at DESC);
