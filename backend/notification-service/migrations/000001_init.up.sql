CREATE TABLE IF NOT EXISTS notification_logs (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id        VARCHAR(255) NOT NULL,
    event_type      VARCHAR(100) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    subject         VARCHAR(500) NOT NULL,
    status          VARCHAR(50)  NOT NULL DEFAULT 'pending',
    error_message   TEXT,
    retry_count     INT          NOT NULL DEFAULT 0,
    sent_at         TIMESTAMP,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_event_id_type ON notification_logs(event_id, event_type);
CREATE INDEX IF NOT EXISTS idx_status ON notification_logs(status);
