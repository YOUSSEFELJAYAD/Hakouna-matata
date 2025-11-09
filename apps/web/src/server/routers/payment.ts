/**
 * Payment tRPC Router
 */

import { z } from "zod";
import { router, protectedProcedure } from "@/server/trpc";
import { createPaymentIntent, createCustomer, createSubscription } from "@/lib/payments/stripe";

export const paymentRouter = router({
  createPaymentIntent: protectedProcedure
    .input(z.object({
      amount: z.number().positive(),
      currency: z.string().default("usd"),
    }))
    .mutation(async ({ ctx, input }) => {
      const paymentIntent = await createPaymentIntent({
        amount: input.amount,
        currency: input.currency,
        metadata: { userId: ctx.user.id },
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    }),

  createSubscription: protectedProcedure
    .input(z.object({
      priceId: z.string(),
      customerId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      let customerId = input.customerId;

      if (!customerId) {
        const customer = await createCustomer({
          email: ctx.user.email,
          name: ctx.user.name || undefined,
          metadata: { userId: ctx.user.id },
        });
        customerId = customer.id;
      }

      const subscription = await createSubscription({
        customerId,
        priceId: input.priceId,
        metadata: { userId: ctx.user.id },
      });

      return subscription;
    }),
});
