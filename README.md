# Hakouna Matata - Enterprise Multi-Platform Demo Application

A comprehensive, enterprise-grade multi-platform demo application showcasing modern development best practices across web, mobile, and backend platforms.

## Overview

Hakouna Matata is a production-ready, open-source demo application that demonstrates enterprise-level architecture, security, and development practices. It includes a full-stack web application, native Android app, and robust backend services.

## Features

- **Enterprise Security** - PCI-DSS compliant, ready for payment solutions
- **Multi-Database Support** - PostgreSQL (SQL) and MongoDB (NoSQL)
- **Role-Based Access Control** - USER, ADMIN, and SUPERADMIN roles
- **Type-Safe APIs** - End-to-end type safety with tRPC and TypeScript
- **Modern UI** - Beautiful, accessible components with shadcn/ui
- **Real-Time Analytics** - Google Analytics and Firebase integration
- **Audit Logging** - Complete audit trail for compliance
- **Rate Limiting** - Protection against abuse and DDoS
- **Email Services** - Transactional and marketing emails with Resend
- **OAuth Support** - Google, GitHub, Facebook, Discord authentication

## Project Structure

```
hakouna-matata/
├── apps/
│   ├── web/              # Next.js 16 web application
│   ├── android/          # Android app (Jetpack Compose)
│   ├── backend-go/       # Go backend (Clean Architecture)
│   └── backend-node/     # Node.js backend (Layered Architecture)
├── packages/
│   ├── shared/           # Shared types and utilities
│   ├── ui/               # Shared UI components
│   ├── config/           # Shared configurations
│   └── database/         # Shared database schemas
├── docs/                 # Comprehensive documentation
└── turbo.json            # Turborepo configuration
```

## Tech Stack

### Web Application
- **Framework:** Next.js 16 with App Router
- **Language:** TypeScript
- **UI:** shadcn/ui + Tailwind CSS
- **State Management:** TanStack Query
- **API:** tRPC for type-safe APIs
- **Database:** Prisma ORM (PostgreSQL + MongoDB)
- **Auth:** BetterAuth with multiple OAuth providers
- **Email:** Resend + React Email
- **Analytics:** Google Analytics 4
- **Backend Services:** Firebase

### Android Application
- **Language:** Kotlin
- **UI:** Jetpack Compose + Orbit Compose
- **Architecture:** MVVM + Clean Architecture
- **DI:** Dagger Hilt
- **Networking:** Retrofit
- **Image Loading:** Coil
- **Navigation:** Navigation Component
- **Backend:** Firebase (Auth, Firestore, Analytics, Crashlytics)

### Go Backend
- **Language:** Go 1.21+
- **Framework:** Gin
- **Architecture:** Clean Architecture
- **Databases:** PostgreSQL (GORM) + MongoDB
- **Auth:** JWT
- **Logging:** Zap

### Node.js Backend
- **Language:** TypeScript
- **Framework:** Express.js
- **Architecture:** Layered Architecture
- **Databases:** Prisma (PostgreSQL) + MongoDB
- **Auth:** JWT
- **Logging:** Winston

### DevOps & Tooling
- **Monorepo:** Turborepo
- **Linting:** ESLint
- **Formatting:** Prettier
- **Git Hooks:** Husky
- **Validation:** Zod
- **Package Manager:** pnpm

## Getting Started

### Prerequisites

- Node.js 20+ and pnpm 9+
- Go 1.21+ (for Go backend)
- PostgreSQL 14+ (or compatible database)
- MongoDB 6+ (optional, for NoSQL features)
- Android Studio (for Android app)

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/yourusername/hakouna-matata.git
cd hakouna-matata
```

2. **Install dependencies:**
```bash
pnpm install
```

3. **Set up environment variables:**
```bash
# Copy environment files for each app
cp apps/web/.env.example apps/web/.env
cp apps/backend-go/.env.example apps/backend-go/.env
cp apps/backend-node/.env.example apps/backend-node/.env
```

4. **Set up databases:**
```bash
# Run Prisma migrations
cd apps/web
pnpm prisma migrate dev
```

5. **Start development servers:**
```bash
# From root directory - starts all apps
pnpm dev

# Or start individual apps
pnpm dev --filter=@hakouna-matata/web
pnpm dev --filter=@hakouna-matata/backend-node
```

## Documentation

Comprehensive documentation is available for each component:

- [Web Application](./apps/web/README.md)
- [Android Application](./apps/android/README.md)
- [Go Backend](./apps/backend-go/README.md)
- [Node.js Backend](./apps/backend-node/README.md)
- [Architecture Overview](./docs/ARCHITECTURE.md)
- [Security Guidelines](./docs/SECURITY.md)
- [API Documentation](./docs/API.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)

## Security Features

### PCI-DSS Compliance
- Encrypted data transmission (HTTPS/TLS)
- Secure password storage (bcrypt)
- Tokenized payment processing
- No storage of sensitive card data
- Audit logging for all transactions
- Role-based access control
- Regular security updates

### Application Security
- Security headers (HSTS, CSP, X-Frame-Options)
- Rate limiting and DDoS protection
- SQL injection prevention
- XSS protection
- CSRF protection
- Input validation and sanitization
- Encrypted sessions
- Secure cookie handling

## Architecture Patterns

### Web App (Next.js)
- **Pattern:** Server Components + Client Components
- **Data Fetching:** tRPC + TanStack Query
- **State Management:** React hooks + TanStack Query cache
- **Styling:** Tailwind CSS with CSS-in-JS

### Android App
- **Pattern:** MVVM + Clean Architecture
- **Layers:** Presentation → Domain → Data
- **DI:** Dagger Hilt
- **Navigation:** Single-Activity architecture

### Go Backend
- **Pattern:** Clean Architecture
- **Layers:** Delivery → UseCase → Domain → Infrastructure
- **DI:** Manual dependency injection
- **Error Handling:** Custom error types

### Node.js Backend
- **Pattern:** Layered Architecture
- **Layers:** Routes → Controllers → Services → Repositories
- **DI:** Simple factory pattern
- **Error Handling:** Custom error middleware

## Testing

```bash
# Run all tests
pnpm test

# Run tests for specific app
pnpm test --filter=@hakouna-matata/web

# Run with coverage
pnpm test:coverage
```

## Building for Production

```bash
# Build all apps
pnpm build

# Build specific app
pnpm build --filter=@hakouna-matata/web
```

## Deployment

See [Deployment Guide](./docs/DEPLOYMENT.md) for detailed instructions on deploying to various platforms:

- Vercel (Web App)
- Google Play Store (Android)
- AWS/GCP/Azure (Backends)
- Docker containers
- Kubernetes

## Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Acknowledgments

- Next.js team for the amazing framework
- shadcn for the beautiful UI components
- The open-source community for all the excellent tools and libraries

## Support

For support, email support@hakounamatata.com or join our Discord community.

## Roadmap

- [ ] Real-time features with WebSockets
- [ ] GraphQL API option
- [ ] iOS app with SwiftUI
- [ ] Desktop apps with Electron/Tauri
- [ ] Microservices architecture example
- [ ] Kubernetes deployment configs
- [ ] CI/CD pipeline templates
- [ ] Comprehensive test suites
- [ ] Performance benchmarks
- [ ] Internationalization (i18n)

---

**Built with ❤️ for the developer community**
