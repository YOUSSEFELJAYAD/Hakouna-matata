import { router } from "../trpc";
import { userRouter } from "./user";

/**
 * Main App Router
 * Combines all tRPC routers into a single API
 */
export const appRouter = router({
  user: userRouter,
});

export type AppRouter = typeof appRouter;
