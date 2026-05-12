package middleware

import (
	"net/http"
	"strconv"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

var (
	httpRequestsTotal = promauto.NewCounterVec(prometheus.CounterOpts{
		Name: "http_requests_total",
		Help: "Total number of HTTP requests",
	}, []string{"method", "path", "status"})

	httpRequestDuration = promauto.NewHistogramVec(prometheus.HistogramOpts{
		Name:    "http_request_duration_seconds",
		Help:    "HTTP request duration in seconds",
		Buckets: []float64{.005, .01, .025, .05, .1, .25, .5, 1, 2.5, 5, 10},
	}, []string{"method", "path"})

	httpRequestsInFlight = promauto.NewGauge(prometheus.GaugeOpts{
		Name: "http_requests_in_flight",
		Help: "Current number of HTTP requests being served",
	})
)

func Metrics(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/metrics" {
			next.ServeHTTP(w, r)
			return
		}

		httpRequestsInFlight.Inc()
		defer httpRequestsInFlight.Dec()

		rw := &captureWriter{ResponseWriter: w, statusCode: http.StatusOK}
		start := time.Now()
		next.ServeHTTP(rw, r)
		duration := time.Since(start).Seconds()

		path := normalizePath(r.URL.Path)
		status := strconv.Itoa(rw.statusCode)

		httpRequestsTotal.WithLabelValues(r.Method, path, status).Inc()
		httpRequestDuration.WithLabelValues(r.Method, path).Observe(duration)
	})
}

func normalizePath(path string) string {
	switch {
	case path == "/health":
		return "/health"
	case path == "/api/v1/auth/login":
		return "/api/v1/auth/login"
	case path == "/api/v1/auth/register":
		return "/api/v1/auth/register"
	case path == "/api/v1/auth/refresh":
		return "/api/v1/auth/refresh"
	case path == "/api/v1/auth/profile":
		return "/api/v1/auth/profile"
	default:
		return "other"
	}
}

type captureWriter struct {
	http.ResponseWriter
	statusCode int
}

func (cw *captureWriter) WriteHeader(code int) {
	cw.statusCode = code
	cw.ResponseWriter.WriteHeader(code)
}
