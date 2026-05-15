DROP INDEX IF EXISTS uq_songs_source_external_id;
DROP INDEX IF EXISTS uq_albums_source_external_id;
DROP INDEX IF EXISTS uq_artists_source_external_id;

ALTER TABLE songs
DROP COLUMN IF EXISTS external_url,
DROP COLUMN IF EXISTS cover_url,
DROP COLUMN IF EXISTS preview_url,
DROP COLUMN IF EXISTS external_id,
DROP COLUMN IF EXISTS source;

ALTER TABLE albums
DROP COLUMN IF EXISTS external_url,
DROP COLUMN IF EXISTS cover_url,
DROP COLUMN IF EXISTS external_id,
DROP COLUMN IF EXISTS source;

ALTER TABLE artists
DROP COLUMN IF EXISTS external_url,
DROP COLUMN IF EXISTS external_id,
DROP COLUMN IF EXISTS source;