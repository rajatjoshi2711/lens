import { describe, expect, it } from "vitest";
import { createClickBurst } from "./click-burst";

describe("createClickBurst", () => {
  it("fires on the 8th click inside the window", () => {
    const burst = createClickBurst(8, 3000);
    const results = Array.from({ length: 8 }, (_, i) => burst.click(i * 100));
    expect(results.slice(0, 7).every((r) => r === false)).toBe(true);
    expect(results[7]).toBe(true);
  });

  it("does not fire on 7 clicks", () => {
    const burst = createClickBurst(8, 3000);
    const fired = Array.from({ length: 7 }, (_, i) => burst.click(i * 100));
    expect(fired.includes(true)).toBe(false);
  });

  it("drops clicks older than the window", () => {
    const burst = createClickBurst(8, 3000);
    for (let i = 0; i < 7; i++) burst.click(i * 100);
    // 8th click arrives long after the first seven.
    expect(burst.click(10_000)).toBe(false);
  });

  it("starts over after firing", () => {
    const burst = createClickBurst(3, 3000);
    burst.click(0);
    burst.click(1);
    expect(burst.click(2)).toBe(true);
    expect(burst.click(3)).toBe(false);
  });
});
