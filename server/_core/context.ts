import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { getSession } from "../localAuth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  let user: User | null = null;
  const localToken = (opts.req as any).cookies?.univerge_session;
  if (localToken) user = getSession(localToken);
  if (!user) {
    try { user = await sdk.authenticateRequest(opts.req); } catch { user = null; }
  }
  return { req: opts.req, res: opts.res, user };
}
