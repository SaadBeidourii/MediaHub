# Use Go as the base image
FROM golang:1.24-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy Go modules files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy the rest of the code
COPY . .

# Build the Go project
RUN go build -o /app/bin/mediahub ./cmd/api

# Use a lightweight image for running the binary
FROM alpine:latest

# Install certificates for HTTPS
RUN apk add --no-cache ca-certificates

# Set working directory in the container
WORKDIR /root/

# Copy the binary from the builder stage
COPY --from=builder /app/bin/mediahub .

# Expose the API port
EXPOSE 8080

# Run the Go binary
CMD ["./mediahub"]
