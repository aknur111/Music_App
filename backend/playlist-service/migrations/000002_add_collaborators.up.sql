CREATE TABLE playlist_collaborators (
                                        playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
                                        user_id UUID NOT NULL,
                                        added_at TIMESTAMP NOT NULL DEFAULT NOW(),
                                        PRIMARY KEY (playlist_id, user_id)
);

CREATE INDEX idx_playlist_collaborators_user_id ON playlist_collaborators(user_id);