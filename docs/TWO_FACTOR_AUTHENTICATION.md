# Two-Factor Authentication (2FA) Guide

## Overview

This document provides comprehensive information about the Two-Factor Authentication (2FA) implementation in the Hakouna Matata platform.

## Table of Contents

1. [Features](#features)
2. [Supported Methods](#supported-methods)
3. [Architecture](#architecture)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Usage Examples](#usage-examples)
7. [Security Features](#security-features)
8. [Configuration](#configuration)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)

---

## Features

### TOTP (Time-based One-Time Password)
- ✅ QR code generation for authenticator apps
- ✅ Manual secret entry support
- ✅ 6-digit verification codes
- ✅ 30-second token validity window
- ✅ Support for Google Authenticator, Authy, 1Password, Microsoft Authenticator

### Backup Codes
- ✅ 10 single-use backup codes
- ✅ Secure bcrypt hashing
- ✅ Regeneration capability
- ✅ Download and print functionality

### Trusted Devices
- ✅ Remember device for 30 days
- ✅ Device fingerprinting
- ✅ IP address tracking
- ✅ User agent logging

### SMS OTP (Implemented - Requires Twilio)
- ✅ 6-digit SMS codes
- ✅ 5-minute expiration
- ✅ Rate limiting (3 attempts)
- ✅ Phone number verification
- ✅ Twilio integration

### Email OTP (Implemented - Requires Resend)
- ✅ 6-digit email codes
- ✅ Beautiful HTML email templates
- ✅ 5-minute expiration
- ✅ Rate limiting (3 attempts)

---

## Supported Methods

### 1. TOTP (Authenticator App)

**Pros:**
- Most secure method
- Works offline
- No additional costs
- Industry standard

**Cons:**
- Requires smartphone
- Initial setup complexity

**Recommended Authenticator Apps:**
- Google Authenticator (iOS, Android)
- Authy (iOS, Android, Desktop)
- 1Password (iOS, Android, Desktop)
- Microsoft Authenticator (iOS, Android)

### 2. SMS OTP

**Pros:**
- User-friendly
- No app required
- Works on any phone

**Cons:**
- Requires SMS service (Twilio)
- Costs per SMS
- Vulnerable to SIM swapping
- Requires cell signal

### 3. Email OTP

**Pros:**
- No additional app required
- Works on any device
- No SMS costs

**Cons:**
- Less secure than TOTP
- Requires email access
- Potential email delays

---

## Architecture

### Components

```
apps/web/src/
├── lib/2fa/
│   ├── totp.ts              # TOTP generation and verification
│   ├── qr-code.ts           # QR code generation
│   ├── backup-codes.ts      # Backup code management
│   ├── sms.ts               # SMS OTP via Twilio
│   └── email.ts             # Email OTP via Resend
├── server/routers/
│   └── 2fa.ts               # tRPC 2FA router
└── components/
    ├── auth/2fa/
    │   ├── SetupTOTP.tsx    # 2FA setup wizard
    │   └── VerifyTOTP.tsx   # 2FA verification form
    └── settings/
        └── TwoFactorSettings.tsx  # 2FA management UI
```

### Flow Diagram

#### Setup Flow

```
User → Request 2FA Setup
    → Generate TOTP Secret
    → Create QR Code
    → User Scans QR Code
    → User Enters Verification Code
    → Verify Code
    → Enable 2FA
    → Generate Backup Codes
    → Show Backup Codes
```

#### Login Flow

```
User → Login with Password
    → Check if 2FA Enabled
    → Show 2FA Verification
    → User Enters Code (TOTP or Backup)
    → Verify Code
    → Optional: Trust Device
    → Grant Access
```

---

## Database Schema

### TwoFactorSecret

```prisma
model TwoFactorSecret {
  id            String          @id @default(cuid())
  userId        String          @unique
  secret        String          // TOTP secret (should be encrypted)
  enabled       Boolean         @default(false)
  method        TwoFactorMethod @default(TOTP)
  phoneNumber   String?
  phoneVerified Boolean         @default(false)
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
  verifiedAt    DateTime?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

enum TwoFactorMethod {
  TOTP
  SMS
  EMAIL
}
```

### BackupCode

```prisma
model BackupCode {
  id        String   @id @default(cuid())
  userId    String
  code      String   // Hashed backup code
  used      Boolean  @default(false)
  usedAt    DateTime?
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### TrustedDevice

```prisma
model TrustedDevice {
  id          String   @id @default(cuid())
  userId      String
  deviceId    String   // Unique device identifier
  deviceName  String
  deviceType  String?
  ipAddress   String?
  userAgent   String?
  lastUsedAt  DateTime @default(now())
  expiresAt   DateTime
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

## API Endpoints

### tRPC Router: `twoFactor`

#### `getStatus`

Get 2FA status for current user.

```typescript
const status = await trpc.twoFactor.getStatus.query();
// Returns: { enabled, method, phoneNumber, phoneVerified, verifiedAt, backupCodesAvailable }
```

#### `setupTOTP`

Initialize TOTP setup (Step 1).

```typescript
const { qrCode, secret } = await trpc.twoFactor.setupTOTP.mutate();
```

#### `verifyAndEnableTOTP`

Verify TOTP code and enable 2FA (Step 2).

```typescript
const { success, backupCodes } = await trpc.twoFactor.verifyAndEnableTOTP.mutate({
  token: "123456",
});
```

#### `disable`

Disable 2FA (requires password).

```typescript
await trpc.twoFactor.disable.mutate({ password: "user_password" });
```

#### `regenerateBackupCodes`

Generate new backup codes (invalidates old ones).

```typescript
const { backupCodes } = await trpc.twoFactor.regenerateBackupCodes.mutate();
```

#### `verifyToken`

Verify 2FA code during login.

```typescript
const { success } = await trpc.twoFactor.verifyToken.mutate({
  token: "123456",
  trustDevice: true,
});
```

#### `setupSMS`

Setup SMS 2FA (requires phone number).

```typescript
await trpc.twoFactor.setupSMS.mutate({
  phoneNumber: "+1234567890",
});
```

#### `verifySMS`

Verify SMS OTP and enable SMS 2FA.

```typescript
const { success, backupCodes } = await trpc.twoFactor.verifySMS.mutate({
  code: "123456",
});
```

---

## Usage Examples

### 1. Enable TOTP 2FA

```typescript
import { SetupTOTP } from "@/components/auth/2fa/SetupTOTP";

function SecuritySettingsPage() {
  return (
    <div>
      <h1>Enable Two-Factor Authentication</h1>
      <SetupTOTP onSuccess={() => router.push("/settings")} />
    </div>
  );
}
```

### 2. Verify 2FA During Login

```typescript
import { VerifyTOTP } from "@/components/auth/2fa/VerifyTOTP";

function LoginPage() {
  const [showTwoFactor, setShowTwoFactor] = useState(false);

  const handleLoginSuccess = async (user) => {
    if (user.twoFactorEnabled) {
      setShowTwoFactor(true);
    } else {
      router.push("/dashboard");
    }
  };

  if (showTwoFactor) {
    return (
      <VerifyTOTP
        onSuccess={() => router.push("/dashboard")}
      />
    );
  }

  return <LoginForm onSuccess={handleLoginSuccess} />;
}
```

### 3. Manage 2FA Settings

```typescript
import { TwoFactorSettings } from "@/components/settings/TwoFactorSettings";

function SettingsPage() {
  return (
    <div>
      <h1>Security Settings</h1>
      <TwoFactorSettings />
    </div>
  );
}
```

### 4. Programmatic TOTP Verification

```typescript
import { verifyTOTPToken, decryptTOTPSecret } from "@/lib/2fa/totp";

// In your authentication flow
const twoFactorSecret = await prisma.twoFactorSecret.findUnique({
  where: { userId: user.id },
});

if (twoFactorSecret?.enabled) {
  const secret = await decryptTOTPSecret(twoFactorSecret.secret);
  const isValid = verifyTOTPToken(userInputToken, secret, 1);

  if (!isValid) {
    throw new Error("Invalid 2FA code");
  }
}
```

---

## Security Features

### TOTP Security

- **Algorithm:** SHA-1 (industry standard for TOTP)
- **Code Length:** 6 digits
- **Time Step:** 30 seconds
- **Time Window:** ±30 seconds (configurable)
- **Secret Length:** 160 bits (20 bytes)
- **Secret Encoding:** Base32

### Backup Code Security

- **Hashing:** bcrypt with 12 rounds
- **Format:** 8 uppercase alphanumeric characters (XXXX-XXXX)
- **Character Set:** Removes ambiguous characters (I, O, 0, 1)
- **Quantity:** 10 codes per user
- **Single-use:** Each code can only be used once

### Trusted Device Security

- **Expiration:** 30 days
- **Device Fingerprinting:** deviceId from headers
- **Tracking:** IP address, user agent, last used timestamp
- **Cleanup:** Expired devices automatically removed

### Audit Logging

All 2FA operations are logged in the `AuditLog` table:
- 2FA_SETUP_INITIATED
- 2FA_ENABLED
- 2FA_DISABLED
- 2FA_VERIFICATION_SUCCESS
- 2FA_VERIFICATION_FAILED
- 2FA_BACKUP_CODES_REGENERATED

---

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/hakounamatata"

# JWT Secret (for session management)
JWT_SECRET="your-super-secret-jwt-key-here"

# Twilio (for SMS OTP)
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"

# Resend (for Email OTP)
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
RESEND_FROM_EMAIL="noreply@hakounamatata.com"
```

### Dependencies

All required dependencies are in `apps/web/package.json`:

```json
{
  "dependencies": {
    "otpauth": "^9.3.1",
    "qrcode": "^1.5.4",
    "twilio": "^5.3.4",
    "bcryptjs": "^2.4.3"
  },
  "devDependencies": {
    "@types/qrcode": "^1.5.5"
  }
}
```

### Prisma Setup

1. Run migrations:
```bash
cd apps/web
pnpm prisma migrate dev --name add-2fa
```

2. Generate Prisma Client:
```bash
pnpm prisma generate
```

---

## Testing

### Test TOTP Locally

```typescript
import { generateTOTPSecret, generateCurrentTOTPToken, verifyTOTPToken } from "@/lib/2fa/totp";

// Generate secret
const { secret, uri } = generateTOTPSecret({
  userEmail: "test@example.com",
});

console.log("Secret:", secret);
console.log("URI:", uri);

// Generate current token
const currentToken = generateCurrentTOTPToken(secret);
console.log("Current Token:", currentToken);

// Verify token
const isValid = verifyTOTPToken(currentToken, secret);
console.log("Valid:", isValid); // Should be true
```

### Test Backup Codes

```typescript
import { generateBackupCodes, hashBackupCodes, verifyBackupCode } from "@/lib/2fa/backup-codes";

// Generate codes
const codes = generateBackupCodes(10);
console.log("Backup Codes:", codes);

// Hash codes
const hashed = await hashBackupCodes(codes);

// Verify first code
const isValid = await verifyBackupCode(codes[0], hashed[0].hash);
console.log("Valid:", isValid); // Should be true
```

### Test SMS OTP

```typescript
import { generateSMSOTP, sendSMSOTP } from "@/lib/2fa/sms";

const otp = generateSMSOTP();
console.log("OTP:", otp);

const result = await sendSMSOTP({
  phoneNumber: "+1234567890",
  code: otp,
});

console.log("SMS Sent:", result.success);
```

---

## Troubleshooting

### Common Issues

#### 1. QR Code Not Displaying

**Problem:** QR code doesn't appear after clicking "Generate QR Code"

**Solution:**
- Check browser console for errors
- Ensure `qrcode` package is installed
- Verify tRPC connection is working
- Check that TOTP secret is being generated

#### 2. "Invalid verification code" Error

**Problem:** Valid TOTP code is rejected

**Solutions:**
- Check device time synchronization (must be accurate)
- Increase time window in `verifyTOTPToken` function
- Verify secret is correctly stored and retrieved
- Check that code hasn't been used recently (TOTP prevents replay attacks)

#### 3. SMS Not Received

**Problem:** SMS OTP doesn't arrive

**Solutions:**
- Verify Twilio credentials in `.env`
- Check Twilio account balance
- Verify phone number format (E.164: +1234567890)
- Check Twilio logs in dashboard
- Ensure phone number is not on DNC list

#### 4. Email OTP Not Received

**Problem:** Email with OTP doesn't arrive

**Solutions:**
- Verify Resend API key in `.env`
- Check spam/junk folder
- Verify email address is correct
- Check Resend dashboard for delivery status
- Ensure sender email is verified in Resend

#### 5. Backup Codes Not Working

**Problem:** Backup code is rejected

**Solutions:**
- Ensure code is entered without spaces or dashes (or normalize it)
- Verify code hasn't been used before
- Check that codes were regenerated recently
- Try different backup code

#### 6. Database Errors

**Problem:** Prisma errors when accessing 2FA tables

**Solutions:**
- Run migrations: `pnpm prisma migrate dev`
- Regenerate Prisma Client: `pnpm prisma generate`
- Check database connection in `.env`
- Verify schema is up to date

### Debug Mode

Enable debug logging for 2FA:

```typescript
// In totp.ts, qr-code.ts, etc.
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('[2FA Debug]', data);
}
```

---

## Best Practices

### For Developers

1. **Never Log Secrets**
   ```typescript
   // ❌ Bad
   console.log('TOTP Secret:', secret);

   // ✅ Good
   console.log('TOTP Secret generated successfully');
   ```

2. **Always Encrypt Secrets**
   ```typescript
   // Use proper encryption (AES-256-GCM) for storing TOTP secrets
   // Current implementation is simplified - replace with proper encryption
   ```

3. **Implement Rate Limiting**
   ```typescript
   // Limit verification attempts to prevent brute force
   const MAX_ATTEMPTS = 5;
   const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
   ```

4. **Validate Input**
   ```typescript
   // Always validate token format
   if (!/^\d{6}$/.test(token)) {
     throw new Error('Invalid token format');
   }
   ```

5. **Audit Everything**
   ```typescript
   // Log all 2FA operations for security audits
   await prisma.auditLog.create({
     data: {
       userId: user.id,
       action: '2FA_VERIFICATION_FAILED',
       resource: 'TwoFactorAuth',
       status: 'FAILED',
     },
   });
   ```

### For Users

1. **Save Backup Codes Securely**
   - Download and print backup codes
   - Store in secure location (password manager, safe)
   - Never share backup codes

2. **Use Strong Authenticator Apps**
   - Use reputable authenticator apps
   - Enable biometric protection on phone
   - Consider cloud backup (e.g., Authy)

3. **Trust Devices Wisely**
   - Only trust personal devices
   - Don't trust public/shared computers
   - Review trusted devices regularly

4. **Keep Phone Number Updated**
   - Ensure SMS 2FA phone number is current
   - Update before changing carriers
   - Have backup authentication method

---

## Additional Resources

- [RFC 6238 - TOTP Specification](https://tools.ietf.org/html/rfc6238)
- [NIST Digital Identity Guidelines](https://pages.nist.gov/800-63-3/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Twilio SMS API Documentation](https://www.twilio.com/docs/sms)
- [Resend Email API Documentation](https://resend.com/docs)

---

**Last Updated:** November 2025
**Version:** 1.0.0
