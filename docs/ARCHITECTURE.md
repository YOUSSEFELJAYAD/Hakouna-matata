# Architecture Documentation

## Overview

Hakouna Matata follows a modular, scalable architecture designed for enterprise-grade applications. Each platform (Web, Android, Backend) implements industry-standard architectural patterns optimized for their respective ecosystems.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Clients                              │
├─────────────────┬───────────────────┬──────────────────────┤
│   Web Browser   │   Android App     │   iOS App (Future)   │
│   (Next.js)     │  (Jetpack Compose)│                      │
└────────┬────────┴─────────┬─────────┴──────────┬───────────┘
         │                   │                    │
         └───────────────────┼────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              │     API Gateway / CDN        │
              └──────────────┬──────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    ┌────▼────┐        ┌────▼────┐        ┌────▼────┐
    │ Next.js │        │   Go    │        │ Node.js │
    │  tRPC   │        │ Backend │        │ Backend │
    └────┬────┘        └────┬────┘        └────┬────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
              ┌──────────────┴──────────────┐
              │       Data Layer             │
              ├──────────────┬──────────────┤
              │  PostgreSQL  │   MongoDB    │
              └──────────────┴──────────────┘
                             │
              ┌──────────────┴──────────────┐
              │    External Services         │
              ├──────────────────────────────┤
              │ Firebase | Resend | Stripe   │
              └──────────────────────────────┘
```

## Web Application Architecture (Next.js)

### Pattern: Server Components + Client Components

```
apps/web/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page
│   │   └── [routes]/           # Dynamic routes
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── layout/             # Layout components
│   │   ├── auth/               # Auth components
│   │   └── dashboard/          # Dashboard components
│   ├── lib/                    # Utilities and configs
│   │   ├── auth/               # BetterAuth config
│   │   ├── db/                 # Database clients
│   │   ├── trpc/               # tRPC client
│   │   ├── firebase/           # Firebase config
│   │   └── utils/              # Helper functions
│   ├── server/                 # Server-side code
│   │   ├── routers/            # tRPC routers
│   │   ├── context.ts          # tRPC context
│   │   └── trpc.ts             # tRPC setup
│   └── styles/                 # Global styles
└── prisma/                     # Prisma schema
```

### Data Flow

1. **User Action** → Component
2. **Component** → tRPC Client Hook
3. **tRPC Client** → Server API Route
4. **Server Route** → tRPC Router
5. **Router** → Business Logic
6. **Business Logic** → Prisma/Database
7. **Database** → Response
8. **Response** → TanStack Query Cache
9. **Cache** → Component Re-render

### Key Principles

- **Server-First:** Use Server Components by default
- **Client When Needed:** Use 'use client' only for interactivity
- **Type Safety:** End-to-end type safety with tRPC
- **Data Fetching:** TanStack Query for caching and optimistic updates
- **Authentication:** BetterAuth for secure, flexible auth

## Android Application Architecture

### Pattern: MVVM + Clean Architecture

```
apps/android/app/src/main/
├── java/com/hakounamatata/
│   ├── presentation/           # UI Layer
│   │   ├── screens/            # Compose screens
│   │   ├── viewmodels/         # ViewModels
│   │   └── components/         # Reusable UI components
│   ├── domain/                 # Business Logic Layer
│   │   ├── model/              # Domain models
│   │   ├── usecase/            # Use cases
│   │   └── repository/         # Repository interfaces
│   ├── data/                   # Data Layer
│   │   ├── repository/         # Repository implementations
│   │   ├── remote/             # API services
│   │   ├── local/              # Local database
│   │   └── model/              # Data models
│   ├── di/                     # Dependency Injection
│   │   └── modules/            # Hilt modules
│   └── utils/                  # Utilities
└── res/                        # Resources
```

### Data Flow

1. **UI (Compose)** → ViewModel
2. **ViewModel** → Use Case
3. **Use Case** → Repository Interface
4. **Repository Impl** → Data Source (Remote/Local)
5. **Data Source** → API/Database
6. **Response** → Map to Domain Model
7. **Domain Model** → ViewModel State
8. **State** → UI Recomposition

### Key Principles

- **Separation of Concerns:** Clear layer boundaries
- **Dependency Rule:** Dependencies point inward
- **Testability:** Each layer independently testable
- **Immutability:** Immutable data classes
- **Reactive:** Flow/StateFlow for reactive data

## Go Backend Architecture

### Pattern: Clean Architecture

```
apps/backend-go/
├── cmd/server/                 # Application entry point
├── internal/
│   ├── domain/                 # Enterprise Business Rules
│   │   ├── entity/             # Domain entities
│   │   └── repository/         # Repository interfaces
│   ├── usecase/                # Application Business Rules
│   │   └── user/               # User use cases
│   ├── delivery/               # Interface Adapters
│   │   └── http/               # HTTP delivery
│   │       ├── handler/        # Request handlers
│   │       ├── middleware/     # Middleware
│   │       └── router/         # Route definitions
│   └── infrastructure/         # Frameworks & Drivers
│       ├── config/             # Configuration
│       └── database/           # Database connections
└── pkg/                        # Public packages
    ├── logger/                 # Logging
    ├── validator/              # Validation
    └── security/               # Security utilities
```

### Data Flow

1. **HTTP Request** → Router
2. **Router** → Middleware (Auth, Logging, etc.)
3. **Middleware** → Handler
4. **Handler** → Use Case
5. **Use Case** → Repository Interface
6. **Repository** → Database
7. **Database** → Entity
8. **Entity** → Use Case
9. **Use Case** → Handler
10. **Handler** → HTTP Response

### Key Principles

- **Independence:** Framework-independent core
- **Testability:** Business logic isolated
- **Flexibility:** Easy to swap implementations
- **SOLID:** All SOLID principles applied

## Node.js Backend Architecture

### Pattern: Layered Architecture

```
apps/backend-node/
├── src/
│   ├── routes/                 # API Routes
│   ├── controllers/            # Request Controllers
│   ├── services/               # Business Logic
│   ├── repositories/           # Data Access
│   ├── models/                 # Data Models
│   ├── middleware/             # Express Middleware
│   ├── utils/                  # Utilities
│   ├── config/                 # Configuration
│   └── server.ts               # App entry point
└── dist/                       # Compiled output
```

### Data Flow

1. **HTTP Request** → Route
2. **Route** → Middleware
3. **Middleware** → Controller
4. **Controller** → Service
5. **Service** → Repository
6. **Repository** → Database
7. **Database** → Model
8. **Model** → Repository
9. **Repository** → Service
10. **Service** → Controller
11. **Controller** → HTTP Response

### Key Principles

- **Layer Isolation:** Each layer has specific responsibility
- **Dependency Direction:** Layers depend on abstractions
- **Reusability:** Services can be reused
- **Maintainability:** Easy to understand and modify

## Database Architecture

### SQL (PostgreSQL) - Relational Data

**Schema Design:**
- Users and authentication
- Transactions and payments
- Audit logs
- Sessions
- Structured data with relationships

**Access Pattern:**
- ACID transactions for critical operations
- Foreign key constraints
- Complex queries with joins
- Prisma ORM for type safety

### NoSQL (MongoDB) - Document Data

**Schema Design:**
- Analytics events
- Logs and metrics
- User activity streams
- Flexible schema data
- Large unstructured datasets

**Access Pattern:**
- High-volume writes
- Flexible schema evolution
- Horizontal scaling
- Fast reads with denormalization

## Security Architecture

### Authentication Flow

```
1. User Login Request
   ↓
2. Validate Credentials
   ↓
3. Generate JWT Token
   ↓
4. Store Session in Database
   ↓
5. Return Token to Client
   ↓
6. Client Stores Token (httpOnly cookie)
   ↓
7. Subsequent Requests Include Token
   ↓
8. Server Validates Token
   ↓
9. Extract User from Token
   ↓
10. Check Permissions (RBAC)
    ↓
11. Process Request
```

### Role-Based Access Control (RBAC)

```
USER        → Basic access to own resources
  ↓
ADMIN       → Manage users, view analytics
  ↓
SUPERADMIN  → Full system access, manage admins
```

### Security Layers

1. **Transport Layer** - HTTPS/TLS encryption
2. **Application Layer** - Security headers, CORS, CSP
3. **Authentication** - JWT, OAuth, session management
4. **Authorization** - RBAC, resource-level permissions
5. **Data Layer** - Encryption at rest, secure connections
6. **Audit Layer** - Comprehensive logging

## Scalability Considerations

### Horizontal Scaling

- **Web:** Deploy multiple Next.js instances behind load balancer
- **Backend:** Stateless services for easy scaling
- **Database:** Read replicas, sharding strategies

### Caching Strategy

- **CDN:** Static assets and pages
- **Application:** TanStack Query, Redis
- **Database:** Query result caching

### Performance Optimization

- **Code Splitting:** Dynamic imports, lazy loading
- **Image Optimization:** Next.js Image component
- **API Optimization:** Batching with tRPC, DataLoader pattern
- **Database:** Indexes, query optimization

## Monitoring & Observability

### Logging

- **Web:** Console + Server logs
- **Backend:** Structured logging (Zap, Winston)
- **Database:** Query logs, slow query analysis

### Metrics

- **Application:** Response times, error rates
- **Infrastructure:** CPU, memory, disk usage
- **Business:** User actions, conversions

### Tracing

- **Distributed Tracing:** Request flow across services
- **Error Tracking:** Sentry, Firebase Crashlytics
- **Performance:** Core Web Vitals, API latency

## Deployment Architecture

### Development

```
Local Machine → Git Push → Development Branch
```

### Staging

```
Development → CI/CD Pipeline → Staging Environment
```

### Production

```
Staging → Manual Approval → Production Deployment
         → Health Checks → Traffic Routing
```

## Future Considerations

- Microservices migration path
- Event-driven architecture
- CQRS pattern for complex domains
- GraphQL API alternative
- gRPC for service-to-service communication
- Kubernetes orchestration
- Service mesh (Istio, Linkerd)

---

This architecture is designed to be:
- **Scalable** - Handle growth in users and data
- **Maintainable** - Easy to understand and modify
- **Secure** - Defense in depth
- **Performant** - Optimized at every layer
- **Resilient** - Graceful degradation and recovery
