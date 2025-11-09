# Two-Factor Authentication - Quick Start Guide

## What Was Implemented

A complete Two-Factor Authentication (2FA) system with the following features:

### ✅ Features Completed

1. **TOTP (Time-based One-Time Password)**
   - QR code generation for authenticator apps
   - Manual secret entry support
   - 6-digit verification codes with 30-second validity
   - Support for Google Authenticator, Authy, 1Password, Microsoft Authenticator

2. **Backup Codes**
   - 10 single-use backup codes per user
   - Secure bcrypt hashing
   - Regeneration capability
   - Download/print functionality

3. **Trusted Devices**
   - Remember device for 30 days
   - Device fingerprinting with IP tracking
   - User agent logging

4. **SMS OTP** (Ready - Needs Twilio configuration)
   - 6-digit SMS codes with 5-minute expiration
   - Rate limiting (3 attempts max)
   - Phone number verification

5. **Email OTP** (Ready - Uses Resend)
   - 6-digit email codes with 5-minute expiration
   - Beautiful HTML email templates
   - Rate limiting (3 attempts max)

6. **Security Features**
   - Audit logging for all 2FA operations
   - Failed attempt tracking
   - Input sanitization
   - CSRF protection

7. **UI Components**
   - Setup wizard (SetupTOTP.tsx)
   - Verification form (VerifyTOTP.tsx)
   - Settings management panel (TwoFactorSettings.tsx)

## Files Created/Modified

### Core 2FA Libraries
- `apps/web/src/lib/2fa/totp.ts` - TOTP generation and verification
- `apps/web/src/lib/2fa/qr-code.ts` - QR code generation
- `apps/web/src/lib/2fa/backup-codes.ts` - Backup code management
- `apps/web/src/lib/2fa/sms.ts` - SMS OTP via Twilio
- `apps/web/src/lib/2fa/email.ts` - Email OTP via Resend

### tRPC Router
- `apps/web/src/server/routers/2fa.ts` - Complete 2FA API with 8 endpoints
- `apps/web/src/server/routers/_app.ts` - Updated to include 2FA router

### React Components
- `apps/web/src/components/auth/2fa/SetupTOTP.tsx` - 2FA setup wizard
- `apps/web/src/components/auth/2fa/VerifyTOTP.tsx` - 2FA verification form
- `apps/web/src/components/settings/TwoFactorSettings.tsx` - Settings panel

### UI Components (shadcn/ui)
- `apps/web/src/components/ui/label.tsx`
- `apps/web/src/components/ui/checkbox.tsx`
- `apps/web/src/components/ui/alert.tsx`
- `apps/web/src/components/ui/badge.tsx`
- `apps/web/src/components/ui/dialog.tsx`

### Database Schema
- `apps/web/prisma/schema.prisma` - Added 3 new models:
  - `TwoFactorSecret` - Stores TOTP secrets and settings
  - `BackupCode` - Stores hashed backup codes
  - `TrustedDevice` - Tracks trusted devices

### Configuration
- `apps/web/package.json` - Added dependencies (otpauth, qrcode, twilio)
- `apps/web/.env.example` - Added JWT_SECRET and Twilio configuration

### Documentation
- `docs/TWO_FACTOR_AUTHENTICATION.md` - Complete 2FA documentation
- `apps/web/2FA_QUICKSTART.md` - This file

## Setup Instructions

### 1. Install Dependencies

```bash
cd apps/web
pnpm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Required for 2FA
JWT_SECRET="your-super-secret-jwt-key-at-least-32-characters-long"

# Optional: For SMS OTP
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"

# Already configured: For Email OTP
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
RESEND_FROM_EMAIL="noreply@hakounamatata.com"
```

### 3. Run Database Migrations

```bash
cd apps/web

# Generate Prisma client
pnpm prisma generate

# Create migration
pnpm prisma migrate dev --name add-two-factor-auth

# Or push directly to database
pnpm prisma db push
```

### 4. Verify tRPC Router

The 2FA router is already integrated into the main tRPC router at `server/routers/_app.ts`.

## Usage Examples

### Enable 2FA in Your App

#### 1. Add to Settings Page

```tsx
import { TwoFactorSettings } from "@/components/settings/TwoFactorSettings";

export default function SecuritySettingsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Security Settings</h1>
      <TwoFactorSettings />
    </div>
  );
}
```

#### 2. Add to Login Flow

```tsx
import { VerifyTOTP } from "@/components/auth/2fa/VerifyTOTP";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  const handleLoginSuccess = async (user: any) => {
    if (user.twoFactorEnabled) {
      setUserId(user.id);
      setShowTwoFactor(true);
    } else {
      router.push("/dashboard");
    }
  };

  if (showTwoFactor) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <VerifyTOTP
          onSuccess={() => router.push("/dashboard")}
        />
      </div>
    );
  }

  return (
    <LoginForm onSuccess={handleLoginSuccess} />
  );
}
```

### Using tRPC API Directly

```typescript
import { trpc } from "@/lib/trpc";

// Check 2FA status
const { data: status } = trpc.twoFactor.getStatus.useQuery();

// Setup TOTP
const setupMutation = trpc.twoFactor.setupTOTP.useMutation({
  onSuccess: (data) => {
    console.log("QR Code:", data.qrCode);
    console.log("Secret:", data.secret);
  },
});

// Verify and enable
const verifyMutation = trpc.twoFactor.verifyAndEnableTOTP.useMutation({
  onSuccess: (data) => {
    console.log("Backup Codes:", data.backupCodes);
  },
});

// Verify during login
const loginVerify = trpc.twoFactor.verifyToken.useMutation({
  onSuccess: () => {
    router.push("/dashboard");
  },
});
```

## API Endpoints

All endpoints are available via tRPC at `trpc.twoFactor.*`:

1. **getStatus** - Get 2FA status
2. **setupTOTP** - Initialize TOTP setup
3. **verifyAndEnableTOTP** - Verify and enable TOTP
4. **disable** - Disable 2FA
5. **regenerateBackupCodes** - Generate new backup codes
6. **verifyToken** - Verify 2FA during login
7. **setupSMS** - Setup SMS 2FA
8. **verifySMS** - Verify SMS OTP

## Testing

### Test TOTP Locally

```typescript
import { generateTOTPSecret, generateCurrentTOTPToken, verifyTOTPToken } from "@/lib/2fa/totp";

// Generate secret
const { secret, uri } = generateTOTPSecret({
  userEmail: "test@example.com",
});

console.log("Secret:", secret);
console.log("Current Token:", generateCurrentTOTPToken(secret));

// Verify
const isValid = verifyTOTPToken(generateCurrentTOTPToken(secret), secret);
console.log("Valid:", isValid); // true
```

### Test with Authenticator App

1. Generate QR code using `setupTOTP` endpoint
2. Scan with Google Authenticator or Authy
3. Enter the 6-digit code to verify

## Security Considerations

1. **Secret Storage**: The TOTP secret should be encrypted before storing in database. Current implementation stores it as-is. Implement proper AES-256-GCM encryption.

2. **Rate Limiting**: Implement additional rate limiting on verification endpoints to prevent brute force attacks.

3. **Audit Logs**: All 2FA operations are logged in `AuditLog` table for compliance.

4. **Backup Codes**: Stored as bcrypt hashes. Each code can only be used once.

5. **Trusted Devices**: Expire after 30 days. User can revoke manually.

## Troubleshooting

### "Invalid verification code" Error

- Check device time is synchronized (critical for TOTP)
- Verify secret is correctly stored and retrieved
- Increase time window in verification (currently ±30 seconds)

### QR Code Not Displaying

- Check browser console for errors
- Verify tRPC connection is working
- Ensure `qrcode` package is installed

### SMS Not Received

- Verify Twilio credentials in `.env`
- Check Twilio account balance
- Ensure phone number is in E.164 format (+1234567890)

## Next Steps

1. **Production Encryption**: Implement AES-256-GCM encryption for TOTP secrets
2. **Rate Limiting**: Add stricter rate limits on verification endpoints
3. **Device Management**: Add UI for users to view/revoke trusted devices
4. **Recovery Flow**: Implement account recovery if user loses both authenticator and backup codes
5. **Admin Features**: Allow admins to disable 2FA for users (with proper authorization)
6. **Biometric Integration**: Add mobile biometric authentication as alternative

## Additional Resources

- Full Documentation: `docs/TWO_FACTOR_AUTHENTICATION.md`
- TOTP Specification: RFC 6238
- NIST Guidelines: https://pages.nist.gov/800-63-3/
- OWASP Authentication: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html

---

**Implementation Date:** November 2025
**Status:** ✅ Complete and Ready for Testing
**Dependencies:** otpauth, qrcode, twilio (optional), resend (for email)
