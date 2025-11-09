import { router } from "../trpc";
import { userRouter } from "./user";
import { twoFactorRouter } from "./2fa";

/**
 * Main App Router
 * Combines all tRPC routers into a single API
 */
export const appRouter = router({
  user: userRouter,
  twoFactor: twoFactorRouter,
});

export type AppRouter = typeof appRouter;
