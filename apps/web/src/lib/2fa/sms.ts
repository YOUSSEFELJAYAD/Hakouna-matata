/**
 * SMS-based OTP for Two-Factor Authentication
 * Using Twilio for SMS delivery
 */

import twilio from "twilio";
import { randomInt } from "crypto";

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

let twilioClient: ReturnType<typeof twilio> | null = null;

function getTwilioClient() {
  if (!accountSid || !authToken) {
    throw new Error(
      "Twilio credentials not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables."
    );
  }

  if (!twilioClient) {
    twilioClient = twilio(accountSid, authToken);
  }

  return twilioClient;
}

/**
 * Generate a 6-digit SMS OTP code
 */
export function generateSMSOTP(): string {
  return randomInt(100000, 999999).toString();
}

/**
 * Send SMS OTP to a phone number
 */
export async function sendSMSOTP(params: {
  phoneNumber: string;
  code: string;
  appName?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const { phoneNumber, code, appName = "Hakouna Matata" } = params;

    if (!twilioPhoneNumber) {
      throw new Error("TWILIO_PHONE_NUMBER not configured");
    }

    // Validate phone number format (basic validation)
    if (!isValidPhoneNumber(phoneNumber)) {
      return {
        success: false,
        error: "Invalid phone number format",
      };
    }

    const client = getTwilioClient();

    const message = await client.messages.create({
      body: `Your ${appName} verification code is: ${code}. This code expires in 5 minutes.`,
      from: twilioPhoneNumber,
      to: phoneNumber,
    });

    return {
      success: true,
      messageId: message.sid,
    };
  } catch (error) {
    console.error("SMS OTP send error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send SMS",
    };
  }
}

/**
 * Validate phone number format (E.164)
 * Example: +1234567890
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  return /^\+[1-9]\d{1,14}$/.test(phoneNumber);
}

/**
 * Format phone number for display (mask middle digits)
 * Example: +1234567890 -> +1***7890
 */
export function maskPhoneNumber(phoneNumber: string): string {
  if (phoneNumber.length < 8) {
    return phoneNumber;
  }

  const visibleStart = phoneNumber.slice(0, 2);
  const visibleEnd = phoneNumber.slice(-4);
  const maskedLength = phoneNumber.length - 6;

  return `${visibleStart}${"*".repeat(maskedLength)}${visibleEnd}`;
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
 * Store SMS OTP with expiration
 */
export function storeSMSOTP(
  phoneNumber: string,
  code: string,
  expiresInMinutes: number = 5
): void {
  const expiresAt = Date.now() + expiresInMinutes * 60 * 1000;

  otpCache.set(phoneNumber, {
    code,
    expiresAt,
    attempts: 0,
  });

  // Auto-cleanup after expiration
  setTimeout(() => {
    otpCache.delete(phoneNumber);
  }, expiresInMinutes * 60 * 1000);
}

/**
 * Verify SMS OTP
 */
export function verifySMSOTP(
  phoneNumber: string,
  code: string,
  maxAttempts: number = 3
): { valid: boolean; error?: string } {
  const cached = otpCache.get(phoneNumber);

  if (!cached) {
    return { valid: false, error: "OTP not found or expired" };
  }

  // Check expiration
  if (Date.now() > cached.expiresAt) {
    otpCache.delete(phoneNumber);
    return { valid: false, error: "OTP expired" };
  }

  // Check attempts
  if (cached.attempts >= maxAttempts) {
    otpCache.delete(phoneNumber);
    return { valid: false, error: "Too many attempts" };
  }

  // Verify code
  cached.attempts++;

  if (cached.code === code) {
    otpCache.delete(phoneNumber);
    return { valid: true };
  }

  // Update attempts
  otpCache.set(phoneNumber, cached);

  return { valid: false, error: "Invalid code" };
}

/**
 * Clear SMS OTP from cache
 */
export function clearSMSOTP(phoneNumber: string): void {
  otpCache.delete(phoneNumber);
}
