import { router } from "../trpc";
import { userRouter } from "./user";
import { twoFactorRouter } from "./2fa";
import { fileRouter } from "./file";
import { socialRouter } from "./social";
import { paymentRouter } from "./payment";

/**
 * Main App Router
 * Combines all tRPC routers into a single API
 */
export const appRouter = router({
  user: userRouter,
  twoFactor: twoFactorRouter,
  file: fileRouter,
  social: socialRouter,
  payment: paymentRouter,
});

export type AppRouter = typeof appRouter;
