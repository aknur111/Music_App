-- Drop the index
DROP INDEX IF EXISTS idx_playlist_collaborators_user_id;

-- Drop the many-to-many relationship table
DROP TABLE IF EXISTS playlist_collaborators;