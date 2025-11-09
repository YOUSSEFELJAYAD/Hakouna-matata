import { type FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { auth } from "@/lib/auth/better-auth";
import { prisma } from "@/lib/db/prisma";

/**
 * tRPC Context
 * Creates context for each request with user session and database access
 */
export async function createContext(opts: FetchCreateContextFnOptions) {
  const sessionToken = opts.req.headers.get("cookie")?.split("hakouna-session=")[1]?.split(";")[0];

  let session = null;
  let user = null;

  if (sessionToken) {
    try {
      session = await prisma.session.findUnique({
        where: { sessionToken },
        include: { user: true },
      });

      if (session && session.expires > new Date()) {
        user = session.user;
      }
    } catch (error) {
      console.error("Error fetching session:", error);
    }
  }

  return {
    prisma,
    session,
    user,
    req: opts.req,
    resHeaders: opts.resHeaders,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
