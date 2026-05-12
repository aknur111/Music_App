CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE tracks (
    id                UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    spotify_id        VARCHAR(255) UNIQUE NOT NULL,
    name              TEXT NOT NULL,
    artists           TEXT NOT NULL,
    album             TEXT,
    genre             VARCHAR(100),
    duration_ms       INT,
    popularity        INT,
    valence           FLOAT,
    energy            FLOAT,
    danceability      FLOAT,
    tempo             FLOAT,
    acousticness      FLOAT,
    instrumentalness  FLOAT,
    loudness          FLOAT,
    speechiness       FLOAT
);

CREATE INDEX idx_tracks_genre      ON tracks(genre);
CREATE INDEX idx_tracks_popularity ON tracks(popularity DESC);
CREATE INDEX idx_tracks_features   ON tracks(valence, energy, danceability);

CREATE TABLE user_taste_profiles (
    user_id          UUID      PRIMARY KEY,
    avg_valence      FLOAT     NOT NULL DEFAULT 0.5,
    avg_energy       FLOAT     NOT NULL DEFAULT 0.5,
    avg_danceability FLOAT     NOT NULL DEFAULT 0.5,
    avg_tempo        FLOAT     NOT NULL DEFAULT 120,
    play_count       INT       NOT NULL DEFAULT 0,
    updated_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE play_history (
    id        UUID      PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id   UUID      NOT NULL,
    track_id  UUID      NOT NULL,
    played_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_play_history_user ON play_history(user_id, played_at DESC);
