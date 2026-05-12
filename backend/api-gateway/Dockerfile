FROM golang:1.24-alpine AS builder

WORKDIR /app

COPY api-gateway/go.mod api-gateway/go.sum ./api-gateway/
COPY auth-service/go.mod ./auth-service/
COPY recommendation-service/go.mod ./recommendation-service/

WORKDIR /app/api-gateway
RUN go mod download

WORKDIR /app
COPY api-gateway ./api-gateway
COPY auth-service ./auth-service
COPY recommendation-service ./recommendation-service

WORKDIR /app/api-gateway
RUN CGO_ENABLED=0 GOOS=linux go build -o /api-gateway ./cmd/...

FROM alpine:3.19

RUN apk add --no-cache ca-certificates

WORKDIR /app
COPY --from=builder /api-gateway .
EXPOSE 8080

CMD ["./api-gateway"]