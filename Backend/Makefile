.PHONY: help run build test clean migrate-up migrate-down migrate-create docker-up docker-down swagger

help:
	@echo "Available commands:"
	@echo "  make run           - Run the application"
	@echo "  make build         - Build the application"
	@echo "  make test          - Run tests"
	@echo "  make clean         - Clean build artifacts"
	@echo "  make swagger       - Generate Swagger documentation"
	@echo "  make migrate-up    - Run database migrations"
	@echo "  make migrate-down  - Rollback database migrations"
	@echo "  make docker-up     - Start Docker containers"
	@echo "  make docker-down   - Stop Docker containers"

run:
	go run cmd/api/main.go

build:
	go build -o bin/api cmd/api/main.go

test:
	go test -v -cover ./...

clean:
	rm -rf bin/
	rm -rf tmp/

migrate-up:
	@echo "Running migrations..."
	@for file in migrations/*up.sql; do \
		echo "Applying $$file"; \
		psql $(DB_URL) -f $$file; \
	done

migrate-down:
	@echo "Rolling back migrations..."
	@for file in $$(ls -r migrations/*down.sql); do \
		echo "Rolling back $$file"; \
		psql $(DB_URL) -f $$file; \
	done

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

lint:
	golangci-lint run

deps:
	go mod download
	go mod tidy

swagger:
	@echo "Generating Swagger documentation..."
	swag init -g cmd/api/main.go -o docs/swagger
	@echo "Swagger docs generated at docs/swagger/"
	@echo "Access at: http://localhost:8089/swagger/index.html"
