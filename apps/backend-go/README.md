# Hakouna Matata Go Backend

Enterprise-grade backend service built with Go following Clean Architecture principles.

## Architecture

Clean Architecture with the following layers:

```
backend-go/
├── cmd/
│   └── server/          # Application entry point
├── internal/
│   ├── domain/          # Business entities and interfaces
│   │   ├── entity/      # Domain entities
│   │   └── repository/  # Repository interfaces
│   ├── usecase/         # Business logic
│   ├── delivery/        # Delivery mechanisms
│   │   └── http/        # HTTP handlers, middleware, routes
│   └── infrastructure/  # External concerns
│       ├── config/      # Configuration
│       └── database/    # Database connections
└── pkg/                 # Reusable packages
    ├── logger/          # Logging utilities
    ├── validator/       # Validation utilities
    └── security/        # Security utilities
```

## Tech Stack

- **Gin** - HTTP web framework
- **GORM** - ORM for PostgreSQL
- **MongoDB Driver** - NoSQL database
- **JWT** - Authentication
- **Zap** - Structured logging
- **Validator** - Request validation
- **Godotenv** - Environment variables

## Features

- Clean Architecture
- Dependency Injection
- JWT Authentication
- Role-based Access Control (RBAC)
- Rate Limiting
- CORS Support
- Security Headers
- Structured Logging
- Graceful Shutdown
- Health Check Endpoint
- PostgreSQL & MongoDB Support

## Setup

1. Install dependencies:
```bash
go mod download
```

2. Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

3. Run the server:
```bash
go run cmd/server/main.go
```

## Environment Variables

```
PORT=8080
ENV=development
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
MONGODB_URI=mongodb://localhost:27017/dbname
JWT_SECRET=your-secret-key
ALLOWED_ORIGINS=http://localhost:3000
```

## API Endpoints

### Public Endpoints

- `GET /health` - Health check
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login

### Protected Endpoints (Require Authentication)

- `GET /api/v1/users/me` - Get current user
- `PUT /api/v1/users/me` - Update current user

### Admin Endpoints (Require Admin Role)

- `GET /api/v1/admin/users` - Get all users

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting (100 req/15min)
- CORS protection
- Security headers (HSTS, CSP, X-Frame-Options)
- Request validation
- SQL injection prevention
- XSS protection

## Testing

```bash
go test ./...
```

## Build

```bash
go build -o bin/server cmd/server/main.go
```

## Production Deployment

1. Build the binary
2. Set environment variables
3. Run with proper permissions
4. Use a process manager (systemd, supervisor)
5. Set up reverse proxy (nginx, Caddy)

## License

MIT
