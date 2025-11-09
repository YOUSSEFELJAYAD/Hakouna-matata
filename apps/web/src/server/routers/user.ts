import { z } from "zod";
import { router, publicProcedure, protectedProcedure, adminProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { sanitizeHtml, sanitizePhone } from "@/lib/security/sanitize";

/**
 * User Router
 * Handles user-related operations with role-based access control
 * Enhanced with input sanitization and comprehensive audit logging
 */
export const userRouter = router({
  // Get current user profile
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const profile = await ctx.prisma.profile.findUnique({
      where: { userId: ctx.user.id },
    });

    return {
      user: ctx.user,
      profile,
    };
  }),

  // Update user profile
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100).optional(),
        bio: z.string().max(500).optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
        postalCode: z.string().optional(),
        theme: z.enum(["light", "dark"]).optional(),
        language: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { name, bio, phone, address, city, country, postalCode, ...rest } = input;

      // Sanitize inputs to prevent XSS
      const sanitizedData = {
        ...(name && { name: sanitizeHtml(name) }),
        ...(bio && { bio: sanitizeHtml(bio) }),
        ...(phone && { phone: sanitizePhone(phone) }),
        ...(address && { address: sanitizeHtml(address) }),
        ...(city && { city: sanitizeHtml(city) }),
        ...(country && { country: sanitizeHtml(country) }),
        ...(postalCode && { postalCode: sanitizeHtml(postalCode) }),
        ...rest,
      };

      // Update user name if provided
      if (sanitizedData.name) {
        await ctx.prisma.user.update({
          where: { id: ctx.user.id },
          data: { name: sanitizedData.name },
        });
      }

      // Extract profile-specific data
      const { name: _, ...profileData } = sanitizedData;

      // Update or create profile
      const profile = await ctx.prisma.profile.upsert({
        where: { userId: ctx.user.id },
        update: profileData,
        create: {
          userId: ctx.user.id,
          ...profileData,
        },
      });

      // Audit log
      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.user.id,
          action: "UPDATE_PROFILE",
          resource: "PROFILE",
          resourceId: ctx.user.id,
          details: { updatedFields: Object.keys(input) },
          status: "SUCCESS",
          ipAddress: ctx.req.headers.get("x-forwarded-for") || "unknown",
          userAgent: ctx.req.headers.get("user-agent") || "unknown",
        },
      });

      return profile;
    }),

  // Get all users (admin only)
  getAllUsers: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(10),
        role: z.enum(["USER", "ADMIN", "SUPERADMIN"]).optional(),
        status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING_VERIFICATION"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, role, status } = input;
      const skip = (page - 1) * limit;

      const where = {
        ...(role && { role }),
        ...(status && { status }),
      };

      const [users, total] = await Promise.all([
        ctx.prisma.user.findMany({
          where,
          skip,
          take: limit,
          include: {
            profile: true,
          },
          orderBy: { createdAt: "desc" },
        }),
        ctx.prisma.user.count({ where }),
      ]);

      return {
        users,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  // Update user role (admin only)
  updateUserRole: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        role: z.enum(["USER", "ADMIN", "SUPERADMIN"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Prevent admins from creating superadmins (only superadmins can do this)
      if (input.role === "SUPERADMIN" && ctx.user.role !== "SUPERADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only superadmins can assign superadmin role",
        });
      }

      const user = await ctx.prisma.user.update({
        where: { id: input.userId },
        data: { role: input.role },
      });

      // Log the action
      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.user.id,
          action: "UPDATE_USER_ROLE",
          resource: "USER",
          resourceId: input.userId,
          details: { newRole: input.role },
          status: "SUCCESS",
        },
      });

      return user;
    }),

  // Delete user (admin only)
  deleteUser: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Prevent deleting superadmins
      const targetUser = await ctx.prisma.user.findUnique({
        where: { id: input.userId },
      });

      if (targetUser?.role === "SUPERADMIN" && ctx.user.role !== "SUPERADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only superadmins can delete superadmin accounts",
        });
      }

      await ctx.prisma.user.delete({
        where: { id: input.userId },
      });

      // Log the action
      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.user.id,
          action: "DELETE_USER",
          resource: "USER",
          resourceId: input.userId,
          status: "SUCCESS",
        },
      });

      return { success: true };
    }),
});
