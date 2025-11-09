/**
 * Advanced Search Utilities
 */

import { prisma } from "@/lib/prisma";

export async function searchUsers(query: string, limit: number = 10) {
  return prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: query, mode: "insensitive" } },
        { name: { contains: query, mode: "insensitive" } },
      ],
    },
    take: limit,
    select: { id: true, email: true, name: true, image: true },
  });
}

export async function searchFiles(userId: string, query: string, limit: number = 20) {
  return prisma.file.findMany({
    where: {
      userId,
      OR: [
        { originalName: { contains: query, mode: "insensitive" } },
        { tags: { has: query } },
      ],
    },
    take: limit,
    orderBy: { createdAt: "desc" },
  });
}

export async function searchPosts(query: string, limit: number = 20) {
  return prisma.post.findMany({
    where: {
      content: { contains: query, mode: "insensitive" },
      published: true,
    },
    take: limit,
    include: {
      user: { select: { id: true, name: true, image: true } },
      _count: { select: { likes: true, comments: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
