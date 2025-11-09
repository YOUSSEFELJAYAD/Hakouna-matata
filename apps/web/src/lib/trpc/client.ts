"use client";

import { createTRPCReact } from "@trpc/react-query";
import { type AppRouter } from "@/server/routers/_app";

/**
 * tRPC React Client
 * Provides type-safe API calls from React components
 */
export const trpc = createTRPCReact<AppRouter>();
