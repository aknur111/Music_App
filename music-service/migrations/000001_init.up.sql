CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS artists (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT        NOT NULL,
    bio        TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS albums (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    title      TEXT        NOT NULL,
    artist_id  UUID        NOT NULL REFERENCES artists(id),
    year       INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS songs (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    title      TEXT        NOT NULL,
    artist_id  UUID        NOT NULL REFERENCES artists(id),
    album_id   UUID        REFERENCES albums(id),
    duration_s INT         NOT NULL DEFAULT 0,
    genre      TEXT,
    search_vec TSVECTOR    GENERATED ALWAYS AS (to_tsvector('english', title)) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_songs_artist    ON songs (artist_id);
CREATE INDEX idx_songs_album     ON songs (album_id);
CREATE INDEX idx_songs_search    ON songs USING GIN (search_vec);
CREATE INDEX idx_albums_artist   ON albums (artist_id);
