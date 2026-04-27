CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS playlists (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL,
    name        TEXT        NOT NULL,
    description TEXT,
    song_count  INT         NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_playlists_user_id ON playlists (user_id);

CREATE TABLE IF NOT EXISTS playlist_songs (
    playlist_id UUID        NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    song_id     UUID        NOT NULL,
    position    INT         NOT NULL DEFAULT 1,
    added_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (playlist_id, song_id)
);

CREATE INDEX idx_playlist_songs_playlist ON playlist_songs (playlist_id, position);
