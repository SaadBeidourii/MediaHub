FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY backend/ .
RUN go build -o main ./cmd/api

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/main .
CMD ["./main"]