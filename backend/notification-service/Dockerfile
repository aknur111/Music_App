FROM golang:1.24-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /notification-service ./cmd/...

FROM alpine:3.19
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=builder /notification-service .
COPY migrations ./migrations
COPY templates ./templates
EXPOSE 50054
CMD ["./notification-service"]
