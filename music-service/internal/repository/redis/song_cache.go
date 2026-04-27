package redis

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	goredis "github.com/redis/go-redis/v9"
	"github.com/music-app/music-service/internal/domain/entity"
	"github.com/music-app/music-service/internal/domain/repository"
)

const (
	songTTL  = 5 * time.Minute
	albumTTL = 5 * time.Minute
)

type songCache struct {
	client *goredis.Client
}

func NewSongCache(client *goredis.Client) repository.SongCache {
	return &songCache{client: client}
}

func (c *songCache) GetSong(ctx context.Context, id string) (*entity.Song, error) {
	data, err := c.client.Get(ctx, fmt.Sprintf("song:%s", id)).Bytes()
	if errors.Is(err, goredis.Nil) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	var song entity.Song
	return &song, json.Unmarshal(data, &song)
}

func (c *songCache) SetSong(ctx context.Context, song *entity.Song) error {
	data, err := json.Marshal(song)
	if err != nil {
		return err
	}
	return c.client.Set(ctx, fmt.Sprintf("song:%s", song.ID), data, songTTL).Err()
}

func (c *songCache) GetAlbum(ctx context.Context, id string) (*entity.Album, error) {
	data, err := c.client.Get(ctx, fmt.Sprintf("album:%s", id)).Bytes()
	if errors.Is(err, goredis.Nil) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	var album entity.Album
	return &album, json.Unmarshal(data, &album)
}

func (c *songCache) SetAlbum(ctx context.Context, album *entity.Album) error {
	data, err := json.Marshal(album)
	if err != nil {
		return err
	}
	return c.client.Set(ctx, fmt.Sprintf("album:%s", album.ID), data, albumTTL).Err()
}
