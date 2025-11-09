# Hakouna Matata Node.js Backend

Enterprise-grade Node.js backend service built with TypeScript and Express following Layered Architecture.

## Architecture

Layered Architecture with the following structure:

```
backend-node/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Request handlers
│   ├── services/       # Business logic
│   ├── repositories/   # Data access layer
│   ├── models/         # Data models
│   ├── middleware/     # Express middleware
│   ├── routes/         # API routes
│   ├── utils/          # Utility functions
│   └── server.ts       # Application entry point
└── dist/               # Compiled JavaScript
```

## Tech Stack

- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Prisma** - ORM for PostgreSQL
- **MongoDB** - NoSQL database
- **JWT** - Authentication
- **Helmet** - Security headers
- **Winston** - Logging
- **Zod** - Validation
- **Express Rate Limit** - Rate limiting

## Features

- Layered Architecture
- TypeScript for type safety
- JWT Authentication
- Role-based Access Control
- Rate Limiting (100 req/15min)
- CORS Support
- Security Headers (Helmet + Custom)
- Request Validation
- Structured Logging with Winston
- Error Handling
- Graceful Shutdown
- Health Check Endpoint
- PostgreSQL & MongoDB Support
- Request Compression

## Setup

1. Install dependencies:
```bash
npm install
# or
pnpm install
```

2. Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

3. Run development server:
```bash
npm run dev
```

## Environment Variables

```
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
MONGODB_URI=mongodb://localhost:27017/dbname
JWT_SECRET=your-secret-key
ALLOWED_ORIGINS=http://localhost:3000
LOG_LEVEL=info
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## API Endpoints

### Public Endpoints

- `GET /health` - Health check
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login

### Protected Endpoints

- `GET /api/v1/users/me` - Get current user
- `PUT /api/v1/users/me` - Update current user

### Admin Endpoints

- `GET /api/v1/admin/users` - Get all users (admin only)

## Security Features

- **Helmet** - Sets various HTTP headers for security
- **CORS** - Configurable cross-origin resource sharing
- **Rate Limiting** - Prevents brute force attacks
- **JWT Authentication** - Secure token-based auth
- **Input Validation** - Using Zod for request validation
- **Error Handling** - Proper error responses without leaking sensitive info
- **HTTPS Required** - Strict-Transport-Security header
- **XSS Protection** - Content Security Policy headers
- **SQL Injection Prevention** - Parameterized queries with Prisma

## Logging

Logs are stored in:
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only

## Production Deployment

1. Build the application:
```bash
npm run build
```

2. Set environment variables for production

3. Start the server:
```bash
npm start
```

4. Recommended setup:
   - Use PM2 or similar process manager
   - Set up nginx as reverse proxy
   - Enable HTTPS with Let's Encrypt
   - Configure firewall rules
   - Set up monitoring and alerting

## Testing

```bash
npm test
```

## License

MIT
