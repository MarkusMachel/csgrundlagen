FROM golang:1.27-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/api ./cmd/api \
 && CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/adduser ./cmd/adduser

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /out/api /out/adduser /usr/local/bin/
EXPOSE 8080
USER nonroot:nonroot
ENTRYPOINT ["/usr/local/bin/api"]
