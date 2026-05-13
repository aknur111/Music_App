package client

import (
	"context"

	recommpb "github.com/music-app/recommendation-service/gen/recommendation"
	"google.golang.org/grpc"
)

type RecommendationClient struct {
	grpc recommpb.RecommendationServiceClient
}

func NewRecommendationClient(conn *grpc.ClientConn) *RecommendationClient {
	return &RecommendationClient{grpc: recommpb.NewRecommendationServiceClient(conn)}
}

func (c *RecommendationClient) GetByMood(ctx context.Context, mood string, limit int32) (interface{}, error) {
	resp, err := c.grpc.GetRecommendationsByMood(ctx, &recommpb.MoodRequest{Mood: mood, Limit: limit})
	if err != nil {
		return nil, err
	}
	return resp.GetTracks(), nil
}

func (c *RecommendationClient) GetMoodRadio(ctx context.Context, mood string) (interface{}, error) {
	resp, err := c.grpc.GetMoodRadio(ctx, &recommpb.MoodRadioRequest{Mood: mood})
	if err != nil {
		return nil, err
	}
	return resp.GetTracks(), nil
}

func (c *RecommendationClient) GetSimilar(ctx context.Context, trackID string, limit int32) (interface{}, error) {
	resp, err := c.grpc.GetSimilarTracks(ctx, &recommpb.SimilarRequest{TrackId: trackID, Limit: limit})
	if err != nil {
		return nil, err
	}
	return resp.GetTracks(), nil
}

func (c *RecommendationClient) GetPersonal(ctx context.Context, userID string, limit int32) (interface{}, error) {
	resp, err := c.grpc.GetPersonalRecommendations(ctx, &recommpb.PersonalRequest{UserId: userID, Limit: limit})
	if err != nil {
		return nil, err
	}
	return resp.GetTracks(), nil
}

func (c *RecommendationClient) RecordPlayback(ctx context.Context, userID, trackID string) error {
	_, err := c.grpc.RecordPlayback(ctx, &recommpb.PlaybackRequest{UserId: userID, TrackId: trackID})
	return err
}

func (c *RecommendationClient) GetTrending(ctx context.Context, limit int32) (interface{}, error) {
	resp, err := c.grpc.GetTrendingTracks(ctx, &recommpb.TrendingRequest{Limit: limit})
	if err != nil {
		return nil, err
	}
	return resp.GetTracks(), nil
}

func (c *RecommendationClient) RateTrack(ctx context.Context, userID, trackID string, rating int32) error {
	_, err := c.grpc.RateTrack(ctx, &recommpb.RateTrackRequest{
		UserId:  userID,
		TrackId: trackID,
		Rating:  rating,
	})
	return err
}

func (c *RecommendationClient) GetMyWave(ctx context.Context, userID, moodBias string, limit int32, excludeIDs []string) (interface{}, error) {
	resp, err := c.grpc.GetMyWave(ctx, &recommpb.WaveRequest{
		UserId:     userID,
		MoodBias:   moodBias,
		Limit:      limit,
		ExcludeIds: excludeIDs,
	})
	if err != nil {
		return nil, err
	}
	return resp.GetTracks(), nil
}
