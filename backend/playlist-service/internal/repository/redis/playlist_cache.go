package redis

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/music-app/playlist-service/internal/domain/entity"
	"github.com/music-app/playlist-service/internal/domain/repository"
	goredis "github.com/redis/go-redis/v9"
)

const playlistTTL = 2 * time.Minute

type playlistCache struct {
	client *goredis.Client
}

func NewPlaylistCache(client *goredis.Client) repository.PlaylistCache {
	return &playlistCache{client: client}
}

func (c *playlistCache) GetUserPlaylists(ctx context.Context, userID string) ([]*entity.Playlist, error) {
	data, err := c.client.Get(ctx, key(userID)).Bytes()
	if errors.Is(err, goredis.Nil) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	var playlists []*entity.Playlist
	return playlists, json.Unmarshal(data, &playlists)
}

func (c *playlistCache) SetUserPlaylists(ctx context.Context, userID string, playlists []*entity.Playlist) error {
	data, err := json.Marshal(playlists)
	if err != nil {
		return err
	}
	return c.client.Set(ctx, key(userID), data, playlistTTL).Err()
}

func (c *playlistCache) InvalidateUserPlaylists(ctx context.Context, userID string) error {
	return c.client.Del(ctx, key(userID)).Err()
}

func key(userID string) string {
	return fmt.Sprintf("playlists:user:%s", userID)
}
