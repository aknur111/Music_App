ALTER TABLE artists
ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'local',
ADD COLUMN IF NOT EXISTS external_id TEXT,
ADD COLUMN IF NOT EXISTS external_url TEXT;

ALTER TABLE albums
ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'local',
ADD COLUMN IF NOT EXISTS external_id TEXT,
ADD COLUMN IF NOT EXISTS cover_url TEXT,
ADD COLUMN IF NOT EXISTS external_url TEXT;

ALTER TABLE songs
ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'local',
ADD COLUMN IF NOT EXISTS external_id TEXT,
ADD COLUMN IF NOT EXISTS preview_url TEXT,
ADD COLUMN IF NOT EXISTS cover_url TEXT,
ADD COLUMN IF NOT EXISTS external_url TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_artists_source_external_id
ON artists(source, external_id)
WHERE external_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_albums_source_external_id
ON albums(source, external_id)
WHERE external_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_songs_source_external_id
ON songs(source, external_id)
WHERE external_id IS NOT NULL;