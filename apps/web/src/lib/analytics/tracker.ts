/**
 * Analytics Tracking
 */

import { prisma } from "@/lib/prisma";

export async function trackPageView(params: {
  userId?: string;
  path: string;
  referrer?: string;
  userAgent?: string;
  ipAddress?: string;
}) {
  return prisma.pageView.create({
    data: params,
  });
}

export async function trackEvent(params: {
  userId?: string;
  name: string;
  properties?: Record<string, any>;
}) {
  return prisma.event.create({
    data: {
      userId: params.userId,
      name: params.name,
      properties: params.properties,
    },
  });
}

export async function getAnalytics(userId: string, days: number = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const pageViews = await prisma.pageView.count({
    where: { userId, createdAt: { gte: since } },
  });

  const events = await prisma.event.count({
    where: { userId, createdAt: { gte: since } },
  });

  return { pageViews, events };
}
