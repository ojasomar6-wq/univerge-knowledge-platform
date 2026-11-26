import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(user?: AuthenticatedUser): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("univerge dashboard", () => {
  it("returns readiness stats and a set of assessment pathways", async () => {
    const caller = appRouter.createCaller(createContext());
    const result = await caller.dashboard.overview();

    expect(result.stats.readiness).toBeGreaterThan(0);
    expect(result.assessments.length).toBeGreaterThanOrEqual(4);
    expect(result.assessments.some(assessment => assessment.level === "advanced")).toBe(true);
  });

  it("retrieves evidence for a knowledge question", async () => {
    const caller = appRouter.createCaller(createContext());
    const result = await caller.knowledge.search({ query: "algorithmic reasoning" });

    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("title");
    expect(result[0]).toHaveProperty("excerpt");
  });
});
