import { describe, it, expect } from "vitest";

describe("Setup", () => {
  it("should pass a basic test", () => {
    expect(1 + 1).toBe(2);
  });

  it("should have access to query keys", async () => {
    const { queryKeys } = await import("@/lib/queryKeys");
    expect(queryKeys.portfolios.all).toEqual(["portfolios"]);
    expect(queryKeys.users.me()).toEqual(["users", "me"]);
  });
});
