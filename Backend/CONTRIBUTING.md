# Contributing to RT/RW Net SaaS Backend

Thank you for your interest in contributing to this project!

## Development Setup

1. Fork the repository
2. Clone your fork
3. Install dependencies: `go mod download`
4. Start Docker services: `docker-compose up -d`
5. Copy `.env.example` to `.env` and configure
6. Run migrations: `make migrate-up`
7. Run the application: `make run`

## Code Style

- Follow Go standard formatting: `gofmt`
- Run linter before committing: `make lint`
- Write tests for new features
- Maintain minimum 80% code coverage

## Commit Messages

Use conventional commit format:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `test:` Test additions or changes
- `refactor:` Code refactoring
- `chore:` Maintenance tasks

Example: `feat: add customer management API endpoints`

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Write/update tests
4. Run tests: `make test`
5. Run linter: `make lint`
6. Commit with conventional commit messages
7. Push to your fork
8. Create a Pull Request

## Testing

- Write unit tests for business logic
- Write integration tests for API endpoints
- Use table-driven tests where appropriate
- Mock external dependencies

## Architecture Guidelines

Follow Clean Architecture principles:
- Keep domain entities pure (no external dependencies)
- Use interfaces for dependencies
- Implement repository pattern for data access
- Keep business logic in service layer
- HTTP handlers should be thin

## Security

- Never commit sensitive data (passwords, keys)
- Use environment variables for configuration
- Validate all user input
- Follow OWASP security guidelines
- Report security issues privately

## Questions?

Open an issue for discussion before starting major changes.
