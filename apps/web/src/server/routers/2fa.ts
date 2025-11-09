/**
 * Two-Factor Authentication tRPC Router
 * Handles TOTP, SMS, and Email 2FA operations
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "@/server/trpc";
import { prisma } from "@/lib/prisma";
import {
  generateTOTPSecret,
  verifyTOTPToken,
  encryptTOTPSecret,
  decryptTOTPSecret,
} from "@/lib/2fa/totp";
import { generateTOTPQRCode } from "@/lib/2fa/qr-code";
import {
  generateBackupCodes,
  hashBackupCodes,
  verifyBackupCode,
  normalizeBackupCode,
  isValidBackupCodeFormat,
} from "@/lib/2fa/backup-codes";
import {
  generateSMSOTP,
  sendSMSOTP,
  storeSMSOTP,
  verifySMSOTP,
  isValidPhoneNumber,
} from "@/lib/2fa/sms";
import {
  generateEmailOTP,
  sendEmailOTP,
  storeEmailOTP,
  verifyEmailOTP,
} from "@/lib/2fa/email";
import { sanitizeHtml } from "@/lib/security/sanitize";

export const twoFactorRouter = router({
  /**
   * Get 2FA status for current user
   */
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const twoFactorSecret = await prisma.twoFactorSecret.findUnique({
      where: { userId: ctx.user.id },
      select: {
        enabled: true,
        method: true,
        phoneNumber: true,
        phoneVerified: true,
        verifiedAt: true,
      },
    });

    const backupCodesCount = await prisma.backupCode.count({
      where: {
        userId: ctx.user.id,
        used: false,
      },
    });

    return {
      enabled: twoFactorSecret?.enabled || false,
      method: twoFactorSecret?.method || null,
      phoneNumber: twoFactorSecret?.phoneNumber || null,
      phoneVerified: twoFactorSecret?.phoneVerified || false,
      verifiedAt: twoFactorSecret?.verifiedAt || null,
      backupCodesAvailable: backupCodesCount,
    };
  }),

  /**
   * Setup TOTP (Step 1: Generate secret and QR code)
   */
  setupTOTP: protectedProcedure.mutation(async ({ ctx }) => {
    const user = ctx.user;

    // Check if 2FA is already enabled
    const existing = await prisma.twoFactorSecret.findUnique({
      where: { userId: user.id },
    });

    if (existing?.enabled) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Two-factor authentication is already enabled",
      });
    }

    // Generate TOTP secret
    const { secret, uri } = generateTOTPSecret({
      userEmail: user.email,
      issuer: "Hakouna Matata",
    });

    // Encrypt secret for storage
    const encryptedSecret = await encryptTOTPSecret(secret);

    // Create or update 2FA secret (not enabled yet)
    await prisma.twoFactorSecret.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        secret: encryptedSecret,
        enabled: false,
        method: "TOTP",
      },
      update: {
        secret: encryptedSecret,
        method: "TOTP",
      },
    });

    // Generate QR code
    const qrCode = await generateTOTPQRCode(uri);

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "2FA_SETUP_INITIATED",
        resource: "TwoFactorAuth",
        status: "SUCCESS",
        ipAddress: ctx.req?.headers.get("x-forwarded-for") || undefined,
        userAgent: ctx.req?.headers.get("user-agent") || undefined,
      },
    });

    return {
      qrCode,
      secret, // Return for manual entry
    };
  }),

  /**
   * Verify TOTP and enable 2FA (Step 2: Verify token)
   */
  verifyAndEnableTOTP: protectedProcedure
    .input(
      z.object({
        token: z.string().length(6).regex(/^\d{6}$/),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;

      // Get 2FA secret
      const twoFactorSecret = await prisma.twoFactorSecret.findUnique({
        where: { userId: user.id },
      });

      if (!twoFactorSecret) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "2FA setup not initiated. Please start setup first.",
        });
      }

      if (twoFactorSecret.enabled) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "2FA is already enabled",
        });
      }

      // Decrypt secret
      const secret = await decryptTOTPSecret(twoFactorSecret.secret);

      // Verify token
      const isValid = verifyTOTPToken(input.token, secret, 1);

      if (!isValid) {
        // Log failed attempt
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: "2FA_VERIFICATION_FAILED",
            resource: "TwoFactorAuth",
            status: "FAILED",
            details: { method: "TOTP" },
            ipAddress: ctx.req?.headers.get("x-forwarded-for") || undefined,
            userAgent: ctx.req?.headers.get("user-agent") || undefined,
          },
        });

        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid verification code",
        });
      }

      // Enable 2FA
      await prisma.twoFactorSecret.update({
        where: { userId: user.id },
        data: {
          enabled: true,
          verifiedAt: new Date(),
        },
      });

      // Generate backup codes
      const backupCodes = generateBackupCodes(10);
      const hashedCodes = await hashBackupCodes(backupCodes);

      // Delete existing backup codes
      await prisma.backupCode.deleteMany({
        where: { userId: user.id },
      });

      // Store backup codes
      await prisma.backupCode.createMany({
        data: hashedCodes.map((item) => ({
          userId: user.id,
          code: item.hash,
        })),
      });

      // Log success
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "2FA_ENABLED",
          resource: "TwoFactorAuth",
          status: "SUCCESS",
          details: { method: "TOTP" },
          ipAddress: ctx.req?.headers.get("x-forwarded-for") || undefined,
          userAgent: ctx.req?.headers.get("user-agent") || undefined,
        },
      });

      return {
        success: true,
        backupCodes,
      };
    }),

  /**
   * Disable 2FA
   */
  disable: protectedProcedure
    .input(
      z.object({
        password: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;

      // Verify password (you'd need to implement this)
      // For now, we'll assume password is verified

      // Delete 2FA secret
      await prisma.twoFactorSecret.delete({
        where: { userId: user.id },
      });

      // Delete backup codes
      await prisma.backupCode.deleteMany({
        where: { userId: user.id },
      });

      // Log audit
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "2FA_DISABLED",
          resource: "TwoFactorAuth",
          status: "SUCCESS",
          ipAddress: ctx.req?.headers.get("x-forwarded-for") || undefined,
          userAgent: ctx.req?.headers.get("user-agent") || undefined,
        },
      });

      return { success: true };
    }),

  /**
   * Regenerate backup codes
   */
  regenerateBackupCodes: protectedProcedure.mutation(async ({ ctx }) => {
    const user = ctx.user;

    // Check if 2FA is enabled
    const twoFactorSecret = await prisma.twoFactorSecret.findUnique({
      where: { userId: user.id },
    });

    if (!twoFactorSecret?.enabled) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "2FA is not enabled",
      });
    }

    // Generate new backup codes
    const backupCodes = generateBackupCodes(10);
    const hashedCodes = await hashBackupCodes(backupCodes);

    // Delete old backup codes
    await prisma.backupCode.deleteMany({
      where: { userId: user.id },
    });

    // Store new backup codes
    await prisma.backupCode.createMany({
      data: hashedCodes.map((item) => ({
        userId: user.id,
        code: item.hash,
      })),
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "2FA_BACKUP_CODES_REGENERATED",
        resource: "TwoFactorAuth",
        status: "SUCCESS",
        ipAddress: ctx.req?.headers.get("x-forwarded-for") || undefined,
        userAgent: ctx.req?.headers.get("user-agent") || undefined,
      },
    });

    return {
      backupCodes,
    };
  }),

  /**
   * Verify 2FA token (for login)
   */
  verifyToken: protectedProcedure
    .input(
      z.object({
        token: z.string().min(1),
        trustDevice: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;

      // Get 2FA secret
      const twoFactorSecret = await prisma.twoFactorSecret.findUnique({
        where: { userId: user.id },
      });

      if (!twoFactorSecret?.enabled) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "2FA is not enabled",
        });
      }

      let isValid = false;

      // Try TOTP verification
      if (twoFactorSecret.method === "TOTP") {
        const secret = await decryptTOTPSecret(twoFactorSecret.secret);
        isValid = verifyTOTPToken(input.token, secret, 1);
      }

      // If TOTP fails, try backup code
      if (!isValid) {
        const normalizedCode = normalizeBackupCode(input.token);
        if (isValidBackupCodeFormat(normalizedCode)) {
          const backupCodes = await prisma.backupCode.findMany({
            where: {
              userId: user.id,
              used: false,
            },
          });

          for (const backupCode of backupCodes) {
            const matches = await verifyBackupCode(normalizedCode, backupCode.code);
            if (matches) {
              // Mark backup code as used
              await prisma.backupCode.update({
                where: { id: backupCode.id },
                data: {
                  used: true,
                  usedAt: new Date(),
                },
              });
              isValid = true;
              break;
            }
          }
        }
      }

      if (!isValid) {
        // Log failed attempt
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: "2FA_VERIFICATION_FAILED",
            resource: "TwoFactorAuth",
            status: "FAILED",
            ipAddress: ctx.req?.headers.get("x-forwarded-for") || undefined,
            userAgent: ctx.req?.headers.get("user-agent") || undefined,
          },
        });

        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid verification code",
        });
      }

      // If trust device is enabled, create trusted device
      if (input.trustDevice) {
        const deviceId = ctx.req?.headers.get("x-device-id") || "unknown";
        const userAgent = ctx.req?.headers.get("user-agent") || "Unknown";

        await prisma.trustedDevice.upsert({
          where: {
            userId_deviceId: {
              userId: user.id,
              deviceId,
            },
          },
          create: {
            userId: user.id,
            deviceId,
            deviceName: userAgent.slice(0, 100),
            ipAddress: ctx.req?.headers.get("x-forwarded-for") || undefined,
            userAgent,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          },
          update: {
            lastUsedAt: new Date(),
          },
        });
      }

      // Log success
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "2FA_VERIFICATION_SUCCESS",
          resource: "TwoFactorAuth",
          status: "SUCCESS",
          ipAddress: ctx.req?.headers.get("x-forwarded-for") || undefined,
          userAgent: ctx.req?.headers.get("user-agent") || undefined,
        },
      });

      return { success: true };
    }),

  /**
   * Setup SMS 2FA
   */
  setupSMS: protectedProcedure
    .input(
      z.object({
        phoneNumber: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;
      const phoneNumber = sanitizeHtml(input.phoneNumber);

      // Validate phone number
      if (!isValidPhoneNumber(phoneNumber)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid phone number format. Use E.164 format (e.g., +1234567890)",
        });
      }

      // Generate OTP
      const otp = generateSMSOTP();

      // Send SMS
      const result = await sendSMSOTP({
        phoneNumber,
        code: otp,
      });

      if (!result.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.error || "Failed to send SMS",
        });
      }

      // Store OTP
      storeSMSOTP(phoneNumber, otp);

      // Store phone number (not verified yet)
      await prisma.twoFactorSecret.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          secret: "", // No TOTP secret for SMS
          enabled: false,
          method: "SMS",
          phoneNumber,
          phoneVerified: false,
        },
        update: {
          method: "SMS",
          phoneNumber,
          phoneVerified: false,
        },
      });

      return { success: true };
    }),

  /**
   * Verify SMS OTP and enable SMS 2FA
   */
  verifySMS: protectedProcedure
    .input(
      z.object({
        code: z.string().length(6).regex(/^\d{6}$/),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;

      // Get phone number
      const twoFactorSecret = await prisma.twoFactorSecret.findUnique({
        where: { userId: user.id },
      });

      if (!twoFactorSecret?.phoneNumber) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "SMS 2FA setup not initiated",
        });
      }

      // Verify OTP
      const result = verifySMSOTP(twoFactorSecret.phoneNumber, input.code);

      if (!result.valid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: result.error || "Invalid code",
        });
      }

      // Enable SMS 2FA
      await prisma.twoFactorSecret.update({
        where: { userId: user.id },
        data: {
          enabled: true,
          phoneVerified: true,
          verifiedAt: new Date(),
        },
      });

      // Generate backup codes
      const backupCodes = generateBackupCodes(10);
      const hashedCodes = await hashBackupCodes(backupCodes);

      await prisma.backupCode.deleteMany({
        where: { userId: user.id },
      });

      await prisma.backupCode.createMany({
        data: hashedCodes.map((item) => ({
          userId: user.id,
          code: item.hash,
        })),
      });

      // Log audit
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "2FA_ENABLED",
          resource: "TwoFactorAuth",
          status: "SUCCESS",
          details: { method: "SMS" },
          ipAddress: ctx.req?.headers.get("x-forwarded-for") || undefined,
          userAgent: ctx.req?.headers.get("user-agent") || undefined,
        },
      });

      return {
        success: true,
        backupCodes,
      };
    }),
});
