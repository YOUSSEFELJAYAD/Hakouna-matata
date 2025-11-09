/**
 * File Upload tRPC Router
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "@/server/trpc";
import { prisma } from "@/lib/prisma";
import {
  uploadToS3,
  deleteFromS3,
  getSignedDownloadUrl,
  getSignedUploadUrl,
  isAllowedFileType,
  getFileSizeLimit,
} from "@/lib/storage/s3";
import { optimizeImage, generateThumbnails } from "@/lib/storage/image";

export const fileRouter = router({
  /**
   * Get upload URL for client-side upload
   */
  getUploadUrl: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        mimeType: z.string(),
        size: z.number(),
        folder: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate file type
      if (!isAllowedFileType(input.mimeType)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "File type not allowed",
        });
      }

      // Validate file size
      const sizeLimit = getFileSizeLimit(input.mimeType);
      if (input.size > sizeLimit) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `File size exceeds limit of ${sizeLimit / (1024 * 1024)}MB`,
        });
      }

      const { url, key } = await getSignedUploadUrl({
        fileName: input.fileName,
        mimeType: input.mimeType,
        folder: input.folder,
      });

      // Create file record
      const file = await prisma.file.create({
        data: {
          userId: ctx.user.id,
          fileName: key,
          originalName: input.fileName,
          mimeType: input.mimeType,
          size: BigInt(input.size),
          url: "",
          key,
          folder: input.folder,
          uploadStatus: "PENDING",
        },
      });

      return {
        uploadUrl: url,
        fileId: file.id,
        key,
      };
    }),

  /**
   * Mark upload as complete
   */
  completeUpload: protectedProcedure
    .input(
      z.object({
        fileId: z.string(),
        url: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const file = await prisma.file.update({
        where: { id: input.fileId, userId: ctx.user.id },
        data: {
          url: input.url,
          uploadStatus: "COMPLETED",
        },
      });

      return file;
    }),

  /**
   * List files
   */
  list: protectedProcedure
    .input(
      z.object({
        folder: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const files = await prisma.file.findMany({
        where: {
          userId: ctx.user.id,
          folder: input.folder,
          uploadStatus: "COMPLETED",
        },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
      });

      let nextCursor: typeof input.cursor | undefined = undefined;
      if (files.length > input.limit) {
        const nextItem = files.pop();
        nextCursor = nextItem!.id;
      }

      return {
        files,
        nextCursor,
      };
    }),

  /**
   * Get file details
   */
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const file = await prisma.file.findUnique({
        where: { id: input.id },
      });

      if (!file) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "File not found",
        });
      }

      // Check access
      if (file.userId !== ctx.user.id && file.accessLevel === "PRIVATE") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied",
        });
      }

      return file;
    }),

  /**
   * Get download URL
   */
  getDownloadUrl: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const file = await prisma.file.findUnique({
        where: { id: input.id },
      });

      if (!file) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "File not found",
        });
      }

      if (file.userId !== ctx.user.id && file.accessLevel === "PRIVATE") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied",
        });
      }

      const url = await getSignedDownloadUrl(file.key);

      // Update download count
      await prisma.file.update({
        where: { id: input.id },
        data: {
          downloads: { increment: 1 },
          lastAccessed: new Date(),
        },
      });

      return { url };
    }),

  /**
   * Delete file
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const file = await prisma.file.findUnique({
        where: { id: input.id, userId: ctx.user.id },
      });

      if (!file) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "File not found",
        });
      }

      // Delete from S3
      await deleteFromS3(file.key);

      // Delete from database
      await prisma.file.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * Update file metadata
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        fileName: z.string().optional(),
        folder: z.string().optional(),
        tags: z.array(z.string()).optional(),
        accessLevel: z.enum(["PRIVATE", "SHARED", "PUBLIC", "RESTRICTED"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const file = await prisma.file.update({
        where: { id, userId: ctx.user.id },
        data,
      });

      return file;
    }),
});
