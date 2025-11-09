/**
 * Email-based OTP for Two-Factor Authentication
 * Using Resend for email delivery
 */

import { Resend } from "resend";
import { randomInt } from "crypto";

// Initialize Resend client
const resendApiKey = process.env.RESEND_API_KEY;
let resendClient: Resend | null = null;

function getResendClient() {
  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY not configured");
  }

  if (!resendClient) {
    resendClient = new Resend(resendApiKey);
  }

  return resendClient;
}

/**
 * Generate a 6-digit email OTP code
 */
export function generateEmailOTP(): string {
  return randomInt(100000, 999999).toString();
}

/**
 * Send email OTP
 */
export async function sendEmailOTP(params: {
  email: string;
  code: string;
  userName?: string;
  appName?: string;
}): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    const {
      email,
      code,
      userName,
      appName = "Hakouna Matata",
    } = params;

    const client = getResendClient();
    const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@hakounamatata.com";

    const { data, error } = await client.emails.send({
      from: fromEmail,
      to: email,
      subject: `Your ${appName} Verification Code`,
      html: generateEmailOTPHTML({ code, userName, appName }),
    });

    if (error) {
      console.error("Email OTP send error:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      emailId: data?.id,
    };
  } catch (error) {
    console.error("Email OTP send error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}

/**
 * Generate HTML for email OTP
 */
function generateEmailOTPHTML(params: {
  code: string;
  userName?: string;
  appName: string;
}): string {
  const { code, userName, appName } = params;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Code</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">🔐 Verification Code</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    ${userName ? `<p>Hi ${userName},</p>` : "<p>Hi there,</p>"}

    <p>Your ${appName} verification code is:</p>

    <div style="background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
      <h2 style="color: #667eea; font-size: 36px; margin: 0; letter-spacing: 8px; font-weight: bold;">
        ${code}
      </h2>
    </div>

    <p style="color: #666; font-size: 14px;">
      This code will expire in <strong>5 minutes</strong>.
    </p>

    <p style="color: #666; font-size: 14px;">
      If you didn't request this code, please ignore this email or contact support if you have concerns.
    </p>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    <p style="color: #999; font-size: 12px; text-align: center;">
      This is an automated email from ${appName}. Please do not reply to this email.
    </p>
  </div>
</body>
</html>
  `;
}

/**
 * Store OTP in memory cache (Redis in production)
 * In-memory for demonstration
 */
const otpCache = new Map<
  string,
  { code: string; expiresAt: number; attempts: number }
>();

/**
 * Store email OTP with expiration
 */
export function storeEmailOTP(
  email: string,
  code: string,
  expiresInMinutes: number = 5
): void {
  const expiresAt = Date.now() + expiresInMinutes * 60 * 1000;

  otpCache.set(email, {
    code,
    expiresAt,
    attempts: 0,
  });

  // Auto-cleanup after expiration
  setTimeout(() => {
    otpCache.delete(email);
  }, expiresInMinutes * 60 * 1000);
}

/**
 * Verify email OTP
 */
export function verifyEmailOTP(
  email: string,
  code: string,
  maxAttempts: number = 3
): { valid: boolean; error?: string } {
  const cached = otpCache.get(email);

  if (!cached) {
    return { valid: false, error: "OTP not found or expired" };
  }

  // Check expiration
  if (Date.now() > cached.expiresAt) {
    otpCache.delete(email);
    return { valid: false, error: "OTP expired" };
  }

  // Check attempts
  if (cached.attempts >= maxAttempts) {
    otpCache.delete(email);
    return { valid: false, error: "Too many attempts" };
  }

  // Verify code
  cached.attempts++;

  if (cached.code === code) {
    otpCache.delete(email);
    return { valid: true };
  }

  // Update attempts
  otpCache.set(email, cached);

  return { valid: false, error: "Invalid code" };
}

/**
 * Clear email OTP from cache
 */
export function clearEmailOTP(email: string): void {
  otpCache.delete(email);
}

/**
 * Mask email address for display
 * Example: john.doe@example.com -> j***e@example.com
 */
export function maskEmail(email: string): string {
  const [localPart, domain] = email.split("@");

  if (localPart.length <= 2) {
    return `${localPart[0]}***@${domain}`;
  }

  const firstChar = localPart[0];
  const lastChar = localPart[localPart.length - 1];
  const maskedLength = Math.min(localPart.length - 2, 3);

  return `${firstChar}${"*".repeat(maskedLength)}${lastChar}@${domain}`;
}
