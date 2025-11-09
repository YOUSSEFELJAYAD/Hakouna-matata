# Security Implementation Guide

## Overview

This document details the security implementations across all platforms in the Hakouna Matata application. Each platform has comprehensive security layers designed for enterprise-grade protection.

## Table of Contents

1. [Web Application Security](#web-application-security)
2. [Android Application Security](#android-application-security)
3. [Go Backend Security](#go-backend-security)
4. [Node.js Backend Security](#nodejs-backend-security)
5. [Security Best Practices](#security-best-practices)

---

## Web Application Security

### Security Utilities

Located in: `apps/web/src/lib/security/`

#### Password Security (`password.ts`)

```typescript
import { hashPassword, verifyPassword, calculatePasswordStrength } from '@/lib/security/password';

// Hash a password (validates strength automatically)
const hashed = await hashPassword('MyP@ssw0rd!');

// Verify password
const isValid = await verifyPassword('MyP@ssw0rd!', hashed);

// Check password strength
const strength = calculatePasswordStrength('MyP@ssw0rd!');
console.log(strength.score); // 0-100
console.log(strength.feedback); // Improvement suggestions
```

**Features:**
- bcrypt hashing with 12 rounds (OWASP recommended)
- Automatic password strength validation
- Enforces: 8+ chars, uppercase, lowercase, numbers, special characters
- Password strength calculator with feedback
- Secure random password generator

#### JWT Security (`jwt.ts`)

```typescript
import { generateAccessToken, verifyToken, generateTokenPair } from '@/lib/security/jwt';

// Generate access token (15 minutes)
const accessToken = await generateAccessToken({
  userId: 'user-id',
  email: 'user@example.com',
  role: 'USER',
  sessionId: 'session-id'
});

// Generate token pair
const { accessToken, refreshToken } = await generateTokenPair(payload);

// Verify token
const decoded = await verifyToken(token);
```

**Features:**
- HS256 signing algorithm
- Automatic expiration (15min access, 30 days refresh)
- Issuer and audience validation
- Unique JWT ID (jti) for revocation
- Secure token extraction from headers

#### Input Sanitization (`sanitize.ts`)

```typescript
import {
  sanitizeHtml,
  sanitizeEmail,
  sanitizeFilename,
  sanitizeUrl,
  removeScripts
} from '@/lib/security/sanitize';

// Sanitize user input
const cleanHtml = sanitizeHtml(userInput);
const email = sanitizeEmail(emailInput);
const filename = sanitizeFilename(uploadedFilename);
```

**Features:**
- HTML entity encoding (prevents XSS)
- Email validation and normalization
- Filename sanitization (prevents path traversal)
- URL validation with domain whitelisting
- Script tag and event handler removal
- SQL injection prevention helpers
- Deep object sanitization

#### CSRF Protection (`csrf.ts`)

```typescript
import { generateCsrfToken, verifyCsrfToken, initializeCsrf } from '@/lib/security/csrf';

// Initialize CSRF protection
const token = await initializeCsrf();

// Verify CSRF token from request
const isValid = await verifyCsrfToken(headerToken);
```

**Features:**
- Double-submit cookie pattern
- Timing-safe comparison
- Automatic token rotation
- httpOnly cookies
- Strict SameSite policy

#### Rate Limiting (`rate-limit.ts`)

```typescript
import { applyRateLimit, RateLimitConfigs } from '@/lib/security/rate-limit';

// Apply rate limiting
const result = applyRateLimit(request, RateLimitConfigs.auth);

if (result.limited) {
  // Return 429 Too Many Requests
}
```

**Features:**
- Token bucket algorithm
- Per-IP and per-user tracking
- Configurable limits per endpoint
- Exponential backoff on violations
- Automatic cleanup

**Rate Limit Configurations:**
- Auth endpoints: 5 requests / 15 minutes
- API endpoints: 100 requests / 15 minutes
- Admin endpoints: 200 requests / 15 minutes
- File uploads: 10 requests / hour
- Email sending: 3 requests / hour
- Password reset: 3 requests / hour

### Middleware (`middleware.ts`)

Next.js middleware provides global security:

1. **Security Headers** - HSTS, CSP, X-Frame-Options, etc.
2. **Rate Limiting** - Automatic rate limit enforcement
3. **CSRF Protection** - For state-changing operations
4. **Authentication** - Session validation
5. **Request Logging** - Security audit trail

---

## Android Application Security

### Security Utilities

Located in: `apps/android/app/src/main/java/com/hakounamatata/security/`

#### SecurityUtils.kt

```kotlin
import com.hakounamatata.security.SecurityUtils

// Root detection
if (SecurityUtils.isDeviceRooted()) {
    // Handle rooted device
}

// Emulator detection
if (SecurityUtils.isEmulator()) {
    // Handle emulator
}

// Encrypted storage
val prefs = SecurityUtils.getEncryptedPreferences(context)
prefs.edit().putString("key", "value").apply()

// Signature validation
SecurityUtils.validateAppSignature(context, expectedSignature)
```

**Features:**
- Root detection (multiple methods)
- Emulator detection
- Encrypted SharedPreferences (AES256-GCM)
- SHA-256 hashing
- AES encryption/decryption
- App signature validation (anti-tampering)
- Screen lock detection
- Secure token generation

### Network Security

#### Certificate Pinning (`network_security_config.xml`)

```xml
<network-security-config>
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">api.hakounamatata.com</domain>
        <pin-set expiration="2026-01-01">
            <pin digest="SHA-256">...</pin>
        </pin-set>
    </domain-config>
</network-security-config>
```

**Features:**
- Certificate pinning for API endpoints
- No cleartext traffic allowed
- Backup pin for certificate rotation
- Debug override for development

### Security Implementation

```kotlin
class MyApplication : Application() {
    override fun onCreate() {
        super.onCreate()

        // Check device security
        if (SecurityUtils.isDeviceRooted()) {
            // Show warning or exit
        }

        // Validate app integrity
        if (!SecurityUtils.validateAppSignature(this, EXPECTED_SIGNATURE)) {
            // App has been tampered with
        }
    }
}
```

---

## Go Backend Security

### Security Package

Located in: `apps/backend-go/pkg/security/`

#### Password Security (`password.go`)

```go
import "github.com/hakounamatata/backend-go/pkg/security"

// Hash password
hashed, err := security.HashPassword("MyP@ssw0rd!")

// Verify password
isValid := security.VerifyPassword("MyP@ssw0rd!", hashed)

// Validate password requirements
err := security.ValidatePassword(password)

// Calculate strength
strength := security.CalculatePasswordStrength(password)
```

**Features:**
- bcrypt with 12 rounds
- Password strength validation
- Character diversity requirements
- Common password detection

#### JWT Security (`jwt.go`)

```go
import "github.com/hakounamatata/backend-go/pkg/security"

// Create JWT manager
jwtManager := security.NewJWTManager(secretKey, duration, issuer)

// Generate token
token, err := jwtManager.GenerateToken(userID, email, role, sessionID)

// Verify token
claims, err := jwtManager.VerifyToken(token)

// Extract from header
token, err := security.ExtractBearerToken(authHeader)
```

**Features:**
- HS256 signing
- Automatic expiration
- Issuer/subject validation
- Refresh token support

#### Input Sanitization (`sanitize.go`)

```go
import "github.com/hakounamatata/backend-go/pkg/security"

// Sanitize inputs
cleanHtml := security.SanitizeHTML(input)
email, valid := security.SanitizeEmail(emailInput)
filename := security.SanitizeFilename(uploadName)
url, valid := security.SanitizeURL(urlInput, allowedDomains)
```

**Features:**
- HTML entity escaping
- SQL injection prevention
- Email validation
- Filename sanitization
- URL validation
- Phone number formatting
- Script removal
- IP validation

---

## Node.js Backend Security

### Security Utilities

Located in: `apps/backend-node/src/utils/security/`

#### Password Security (`password.ts`)

```typescript
import { hashPassword, verifyPassword, validatePassword } from './utils/security/password';

// Hash password
const hashed = await hashPassword('MyP@ssw0rd!');

// Verify password
const isValid = await verifyPassword('MyP@ssw0rd!', hashed);

// Validate password
const validation = validatePassword(password);
```

#### JWT Security (`jwt.ts`)

```typescript
import { generateTokenPair, verifyToken } from './utils/security/jwt';

// Generate tokens
const tokens = generateTokenPair({
  userId, email, role, sessionId
});

// Verify token
const decoded = verifyToken(token);
```

#### Authentication Middleware (`middleware/auth.ts`)

```typescript
import { authenticate, requireAdmin, requireRole } from './middleware/auth';

// Protect routes
app.get('/api/protected', authenticate, handler);

// Require admin
app.get('/api/admin', authenticate, requireAdmin, handler);

// Require specific role
app.get('/api/custom', authenticate, requireRole('MANAGER'), handler);
```

---

## Security Best Practices

### Development

1. **Never commit secrets**
   - Use environment variables
   - Add `.env` to `.gitignore`
   - Use secret management services in production

2. **Always validate inputs**
   - Use Zod schemas on frontend and backend
   - Sanitize all user inputs
   - Validate file uploads

3. **Implement least privilege**
   - Default to minimum permissions
   - Grant additional permissions explicitly
   - Regular permission audits

4. **Keep dependencies updated**
   - Regular `npm audit` / `go mod tidy`
   - Automated dependency updates
   - Security patch monitoring

### Deployment

1. **Use HTTPS everywhere**
   - TLS 1.3 minimum
   - HSTS headers
   - Certificate monitoring

2. **Enable security headers**
   - CSP, X-Frame-Options, etc.
   - All headers already configured

3. **Monitor and log**
   - Security events
   - Failed login attempts
   - Rate limit violations
   - Unusual access patterns

4. **Regular security audits**
   - Penetration testing
   - Code reviews
   - Dependency scanning
   - Compliance checks

### User Education

1. **Password policies**
   - Minimum requirements enforced
   - Strength indicator shown
   - No common passwords

2. **2FA (Future Enhancement)**
   - TOTP support
   - SMS backup
   - Recovery codes

3. **Session management**
   - Automatic logout
   - Concurrent session limits
   - Device tracking

---

## Security Checklist

### Pre-Deployment

- [ ] All secrets in environment variables
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] CSRF protection active
- [ ] Input validation on all endpoints
- [ ] SQL injection protection
- [ ] XSS protection
- [ ] Authentication required for sensitive routes
- [ ] Role-based access control implemented
- [ ] Audit logging enabled
- [ ] Error messages don't leak sensitive info
- [ ] Dependencies up to date
- [ ] Security tests passing

### Post-Deployment

- [ ] Monitor security logs
- [ ] Review failed login attempts
- [ ] Check rate limit violations
- [ ] Audit user permissions
- [ ] Rotate secrets regularly
- [ ] Backup encryption keys
- [ ] Test disaster recovery
- [ ] Update security documentation

---

## Security Contacts

- **Security Issues**: security@hakounamatata.com
- **Bug Bounty**: Coming soon
- **Emergency**: 24/7 on-call rotation

---

**Remember: Security is everyone's responsibility!**
