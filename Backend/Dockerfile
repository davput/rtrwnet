# Build stage
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Install dependencies
RUN apk add --no-cache git

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o api ./cmd/api

# Final stage
FROM alpine:latest

WORKDIR /app

# Install ca-certificates for HTTPS
RUN apk --no-cache add ca-certificates tzdata

# Set timezone
ENV TZ=Asia/Jakarta

# Copy binary from builder
COPY --from=builder /app/api .

# Copy migrations if exists
COPY --from=builder /app/migrations ./migrations

# Expose ports
EXPOSE 8089
EXPOSE 1812/udp
EXPOSE 1813/udp

# Run
CMD ["./api"]
