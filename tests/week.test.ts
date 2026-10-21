import { describe, expect, it } from "vitest";
import { getWeekRange, dateKey } from "../lib/week";

describe("Saturday–Friday week boundaries", () => {
  it.each([
    ["2026-09-19", "2026-09-19", "2026-09-25"],
    ["2026-09-20", "2026-09-19", "2026-09-25"],
    ["2026-09-25", "2026-09-19", "2026-09-25"],
    ["2026-09-26", "2026-09-26", "2026-10-02"],
    ["2027-01-01", "2026-12-26", "2027-01-01"],
    ["2027-01-02", "2027-01-02", "2027-01-08"],
  ])("maps %s to %s through %s", (input, expectedStart, expectedEnd) => {
    const { start, end } = getWeekRange(new Date(`${input}T12:00:00`), 6);
    expect(dateKey(start)).toBe(expectedStart); expect(dateKey(end)).toBe(expectedEnd);
  });
});
