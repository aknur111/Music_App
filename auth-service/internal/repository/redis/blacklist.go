package redis

import (
	"context"
	"fmt"
	"time"

	"github.com/music-app/auth-service/internal/domain/repository"
	goredis "github.com/redis/go-redis/v9"
)

type tokenBlacklist struct {
	client *goredis.Client
}

func NewTokenBlacklist(client *goredis.Client) repository.TokenBlacklist {
	return &tokenBlacklist{client: client}
}

func (b *tokenBlacklist) Add(ctx context.Context, jti string, ttlSeconds int64) error {
	return b.client.Set(ctx, key(jti), 1, time.Duration(ttlSeconds)*time.Second).Err()
}

func (b *tokenBlacklist) Exists(ctx context.Context, jti string) (bool, error) {
	n, err := b.client.Exists(ctx, key(jti)).Result()
	return n > 0, err
}

func key(jti string) string {
	return fmt.Sprintf("blacklist:%s", jti)
}
