/**
 * Social Features tRPC Router
 */

import { z } from "zod";
import { router, protectedProcedure } from "@/server/trpc";
import { prisma } from "@/lib/prisma";

export const socialRouter = router({
  createPost: protectedProcedure
    .input(z.object({ content: z.string().min(1).max(5000) }))
    .mutation(async ({ ctx, input }) => {
      return prisma.post.create({
        data: {
          userId: ctx.user.id,
          content: input.content,
        },
      });
    }),

  getFeed: protectedProcedure
    .input(z.object({ limit: z.number().default(20), cursor: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const posts = await prisma.post.findMany({
        where: { published: true },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        include: {
          user: { select: { id: true, name: true, image: true } },
          _count: { select: { likes: true, comments: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      let nextCursor: string | undefined;
      if (posts.length > input.limit) {
        const nextItem = posts.pop();
        nextCursor = nextItem!.id;
      }

      return { posts, nextCursor };
    }),

  likePost: protectedProcedure
    .input(z.object({ postId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return prisma.like.create({
        data: {
          postId: input.postId,
          userId: ctx.user.id,
        },
      });
    }),

  followUser: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return prisma.follow.create({
        data: {
          followerId: ctx.user.id,
          followingId: input.userId,
        },
      });
    }),
});
